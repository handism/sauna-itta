import { useCallback } from "react";
import { SaunaVisit } from "../types";
import { normalizeVisits } from "../utils";

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
  saveVisits: (visits: SaunaVisit[]) => boolean
) {
  const importVisitsFromFile = useCallback(
    async (file: File) => {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text) as SaunaVisit[];
      const existingIds = new Set(visits.map((v) => v.id));
      const normalizedImported = normalizeVisits(parsed).filter(
        (v) => !existingIds.has(v.id),
      );

      if (normalizedImported.length === 0) {
        return { added: 0, success: true };
      }

      const nextVisits = [...normalizedImported, ...visits];
      const success = saveVisits(nextVisits);
      return { added: normalizedImported.length, success };
    },
    [visits, saveVisits],
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
    importVisitsFromFile,
    exportVisits,
  };
}
