import { useState, useRef, useCallback, ChangeEvent } from "react";
import { z } from "zod";
import { SaunaVisit, SaunaVisitSchema } from "../types";
import { normalizeVisits } from "../utils";
import type { ImportResult } from "../repositories";

// Rails 側の ImportsController が 1 リクエストあたり 10 件までしか受け付けません
const CHUNK_SIZE = 10;
const CONCURRENCY_LIMIT = 5;

const REVOKE_OBJECT_URL_DELAY_MS = 1000;

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export class ImportProgressError extends Error {
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

export async function parseImportFile(file: File): Promise<SaunaVisit[]> {
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

  return validationResult.data;
}

export function filterNewVisits(validVisits: SaunaVisit[], existingVisits: SaunaVisit[]): { normalizedImported: SaunaVisit[]; alreadyKnown: number } {
  const existingIds = new Set(existingVisits.map((v) => v.id));
  const normalizedImported = normalizeVisits(validVisits.filter((v) => !existingIds.has(v.id)));
  // 画面に出ている記録と重複した分。サーバー側で弾かれた分は importBatch の skipped に乗る
  const alreadyKnown = validVisits.length - normalizedImported.length;
  return { normalizedImported, alreadyKnown };
}

export async function performBatchImport(
  normalizedImported: SaunaVisit[],
  alreadyKnown: number,
  importBatch: (visits: SaunaVisit[]) => Promise<ImportResult>,
  reload?: () => Promise<void>,
  showToast?: (message: string, type: "success" | "error" | "info") => void,
): Promise<{ added: number; skipped: number; success: boolean }> {
  let added = 0;
  let skipped = alreadyKnown;
  let processedCount = 0;
  try {
    const total = normalizedImported.length;
    const chunks: SaunaVisit[][] = [];
    for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
      chunks.push(normalizedImported.slice(offset, offset + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
      const batchChunks = chunks.slice(i, i + CONCURRENCY_LIMIT);
      const results = await Promise.all(batchChunks.map((chunk) => importBatch(chunk)));

      for (const result of results) {
        added += result.added;
        skipped += result.skipped;
      }

      processedCount += batchChunks.reduce((acc, chunk) => acc + chunk.length, 0);

      // 最終チャンク群の結果は完了トーストで伝えるため、残りがある間だけ途中経過を出す
      if (processedCount < total) {
        showToast?.(`${processedCount}/${total}件を取り込み中です...`, "info");
      }
    }
  } catch (error) {
    let message = error instanceof Error ? error.message : "サーバーへの取り込みに失敗しました。";
    try {
      await reload?.();
    } catch {
      message += "（再読み込みにも失敗しました）";
    }
    throw new ImportProgressError(added, message, { cause: error });
  }
  await reload?.();
  return { added, skipped, success: true };
}

export function downloadVisitsAsJson(visits: SaunaVisit[]): void {
  // 写真は最大1MBのBase64として記録に含まれるため、数十件で data: URL の
  // 長さ上限を超えて無言で失敗する。Blob URL なら容量の制約を受けない。
  const blob = new Blob([JSON.stringify(visits, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", objectUrl);
  linkElement.setAttribute("download", "sauna-visits.json");
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  // click() 直後の解放はダウンロード開始前に URL を無効化するブラウザがあるため遅らせる
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_OBJECT_URL_DELAY_MS);
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
      const validVisits = await parseImportFile(file);
      const { normalizedImported, alreadyKnown } = filterNewVisits(validVisits, visits);

      if (normalizedImported.length === 0) {
        return { added: 0, skipped: alreadyKnown, success: true };
      }

      if (importBatch) {
        return performBatchImport(normalizedImported, alreadyKnown, importBatch, reload, showToast);
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
    downloadVisitsAsJson(visits);
  }, [visits]);

  return {
    importing,
    importInputRef,
    handleImportData,
    importVisitsFromFile,
    exportVisits,
  };
}
