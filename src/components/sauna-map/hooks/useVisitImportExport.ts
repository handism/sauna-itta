import { useState, useRef, useCallback, ChangeEvent, RefObject } from "react";
import { z } from "zod";
import { SaunaVisit, SaunaVisitSchema } from "../types";
import { normalizeVisits } from "../utils";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function useVisitImportExport(
  visits: SaunaVisit[],
  saveVisits: (visits: SaunaVisit[]) => boolean,
  showToast?: (message: string, type: "success" | "error" | "info") => void
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

      if (normalizedImported.length === 0) {
        return { added: 0, success: true };
      }

      const nextVisits = [...normalizedImported, ...visits];
      const success = saveVisits(nextVisits);
      return { added: normalizedImported.length, success };
    },
    [visits, saveVisits],
  );

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, success } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast?.("新しく追加されるデータはありませんでした。", "info");
          return;
        }

        if (!success) {
          showToast?.(STORAGE_ERROR_MSG, "error");
        } else {
          showToast?.(`データを${added}件取り込みました。`, "success");
        }
      } catch (error) {
        console.error(error);
        showToast?.("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
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
