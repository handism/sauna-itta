import { useState, useRef, useCallback, ChangeEvent } from "react";
import { z } from "zod";
import { SaunaVisit, SaunaVisitSchema } from "../types";
import { normalizeVisits } from "../utils";
import type { ImportResult } from "../repositories";

// Rails 側の ImportsController が 1 リクエストあたり 10 件までしか受け付けません
const CHUNK_SIZE = 10;

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

class ImportProgressError extends Error {
  constructor(
    readonly added: number,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ImportProgressError";
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function useVisitImportExport(
  visits: SaunaVisit[],
  saveVisits: ((visits: SaunaVisit[]) => boolean) | undefined,
  showToast?: (message: string, type: "success" | "error" | "info") => void,
  importBatch?: (visits: SaunaVisit[]) => Promise<ImportResult>,
  reload?: () => Promise<void>,
) {
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const importVisitsFromFile = useCallback(
    async (file: File) => {
      const text = await readFileAsText(file);
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file");
      }

      const validationResult = z.array(SaunaVisitSchema).safeParse(parsed);
      if (!validationResult.success) {
        throw new Error("Imported data is not in the correct format for sauna visits: " + validationResult.error.message);
      }

      const validVisits = validationResult.data;
      const existingIds = new Set(visits.map((v) => v.id));
      const normalizedImported = normalizeVisits(validVisits.filter((v) => !existingIds.has(v.id)));
      // 画面に出ている記録と重複した分。サーバー側で弾かれた分は importBatch の skipped に乗る
      const alreadyKnown = validVisits.length - normalizedImported.length;

      if (normalizedImported.length === 0) {
        return { added: 0, skipped: alreadyKnown, success: true };
      }

      if (importBatch) {
        let added = 0;
        let skipped = alreadyKnown;
        try {
          const total = normalizedImported.length;
          for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
            const result = await importBatch(normalizedImported.slice(offset, offset + CHUNK_SIZE));
            added += result.added;
            skipped += result.skipped;
            // 最終チャンクの結果は完了トーストで伝えるため、残りがある間だけ途中経過を出す
            if (offset + CHUNK_SIZE < total) {
              showToast?.(`${added}/${total}件を取り込み中です...`, "info");
            }
          }
        } catch (error) {
          try {
            await reload?.();
          } catch (reloadError) {
            console.error("インポート失敗後の再読み込みにも失敗しました。", reloadError);
          }
          const message = error instanceof Error ? error.message : "サーバーへの取り込みに失敗しました。";
          throw new ImportProgressError(added, message, { cause: error });
        }
        await reload?.();
        return { added, skipped, success: true };
      }

      const nextVisits = [...normalizedImported, ...visits];
      const success = saveVisits?.(nextVisits) ?? false;
      return { added: normalizedImported.length, skipped: alreadyKnown, success };
    },
    [visits, saveVisits, importBatch, reload, showToast],
  );

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, skipped, success } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast?.(
            skipped > 0
              ? `${skipped}件はすでに登録済みのため、新しく追加されたデータはありません。`
              : "新しく追加されるデータはありませんでした。",
            "info",
          );
          return;
        }

        if (!success) {
          showToast?.(STORAGE_ERROR_MSG, "error");
        } else {
          const skippedNote = skipped > 0 ? `（${skipped}件はすでに登録済みのためスキップしました）` : "";
          showToast?.(`データを${added}件取り込みました。${skippedNote}`, "success");
        }
      } catch (error) {
        console.error(error);
        if (error instanceof ImportProgressError) {
          const progress = error.added > 0 ? `${error.added}件は取り込み済みです。` : "";
          showToast?.(`データの取り込みに失敗しました。${progress}${error.message}`, "error");
        } else {
          showToast?.("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
        }
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

  const exportVisits = useCallback(() => {
    const dataStr = JSON.stringify(visits, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "sauna-visits.json");
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, [visits]);

  return {
    importing,
    importInputRef,
    handleImportData,
    importVisitsFromFile,
    exportVisits,
  };
}
