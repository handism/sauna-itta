import { useCallback, useState } from "react";
import initialVisits from "@/data/sauna-visits.json";
import {
  normalizeVisits,
  VISITS_STORAGE_KEY,
  getTodayDate,
} from "../utils";
import { SaunaVisit, VisitFormState } from "../types";

function getInitialVisits(): SaunaVisit[] {
  const baseVisits = normalizeVisits(initialVisits as SaunaVisit[]);
  if (typeof window === "undefined") {
    return baseVisits;
  }

  const savedVisits = localStorage.getItem(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return baseVisits;
  }

  try {
    const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
    const normalizedSaved = normalizeVisits(parsedSaved);
    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customVisits = normalizedSaved.filter((v) => !initialIds.has(v.id));
    return [...customVisits, ...baseVisits];
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return baseVisits;
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function useSaunaVisits() {
  const [visits, setVisits] = useState<SaunaVisit[]>(getInitialVisits);

  const saveVisits = useCallback((newVisits: SaunaVisit[]) => {
    setVisits(newVisits);
    try {
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(newVisits));
      return true;
    } catch (error) {
      console.error("Failed to persist visits to localStorage:", error);
      return false;
    }
  }, []);

  const createVisit = useCallback(
    (selected: { lat: number; lng: number }, form: VisitFormState): SaunaVisit => {
      return {
        id: Date.now().toString(),
        name: form.name,
        lat: selected.lat,
        lng: selected.lng,
        comment: form.comment,
        image: form.image,
        date: form.date || getTodayDate(),
        rating: form.rating || 0,
        tags: form.tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
        area: form.area,
        visitCount: Math.max(1, form.visitCount),
      };
    },
    [],
  );

  const updateVisit = useCallback(
    (editingId: string, selected: { lat: number; lng: number }, form: VisitFormState) => {
      const tags = form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      return visits.map((v) =>
        v.id === editingId
          ? {
              ...v,
              name: form.name,
              lat: selected.lat,
              lng: selected.lng,
              comment: form.comment,
              image: form.image,
              date: form.date,
              rating: form.rating || 0,
              tags,
              status: form.status,
              area: form.area,
              visitCount: Math.max(1, form.visitCount),
            }
          : v,
      );
    },
    [visits],
  );

  const importVisitsFromFile = useCallback(
    async (file: File) => {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text) as SaunaVisit[];
      const existingIds = new Set(visits.map((v) => v.id));
      const normalizedImported = normalizeVisits(parsed).filter(
        (v) => !existingIds.has(v.id),
      );

      if (normalizedImported.length === 0) {
        return { added: 0, nextVisits: visits };
      }

      const nextVisits = [...normalizedImported, ...visits];
      return { added: normalizedImported.length, nextVisits };
    },
    [visits],
  );

  const exportVisits = useCallback((data: SaunaVisit[]) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "sauna-visits.json");
    linkElement.click();
  }, []);

  return {
    visits,
    setVisits,
    saveVisits,
    createVisit,
    updateVisit,
    importVisitsFromFile,
    exportVisits,
  };
}
