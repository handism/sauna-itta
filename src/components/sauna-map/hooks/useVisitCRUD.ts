import { useCallback } from "react";
import { SaunaVisit, VisitFormState } from "../types";
import {
  getTodayDate,
  buildHistoryUpdate,
  getVisitHistoryEntries,
  toNormalizedTags,
} from "../utils";

export function useVisitCRUD(
  visits: SaunaVisit[],
  saveVisits: (visits: SaunaVisit[]) => boolean
) {
  const createVisit = useCallback(
    (selected: { lat: number; lng: number }, form: VisitFormState): SaunaVisit => {
      const entryDate = form.date || getTodayDate();
      const historyEntry = {
        date: entryDate,
        comment: form.comment,
        rating: form.rating || 0,
        image: form.image,
      };

      return {
        id: Date.now().toString(),
        name: form.name,
        lat: selected.lat,
        lng: selected.lng,
        comment: historyEntry.comment,
        image: historyEntry.image,
        date: historyEntry.date,
        rating: historyEntry.rating,
        tags: toNormalizedTags(form.tagsText),
        status: form.status,
        area: form.area,
        visitCount: 1,
        history: [historyEntry],
      };
    },
    [],
  );

  const updateVisit = useCallback(
    (editingId: string, selected: { lat: number; lng: number }, form: VisitFormState) => {
      const tags = toNormalizedTags(form.tagsText);

      return visits.map((v) =>
        v.id === editingId
          ? {
              ...v,
              ...buildHistoryUpdate(v, form),
              name: form.name,
              lat: selected.lat,
              lng: selected.lng,
              tags,
              status: form.status,
              area: form.area,
            }
          : v,
      );
    },
    [visits],
  );

  const addVisit = useCallback(
    (selected: { lat: number; lng: number }, form: VisitFormState) => {
      const newVisit = createVisit(selected, form);
      const success = saveVisits([newVisit, ...visits]);
      return { success, newVisit };
    },
    [visits, createVisit, saveVisits],
  );

  const editVisit = useCallback(
    (editingId: string, selected: { lat: number; lng: number }, form: VisitFormState) => {
      const nextVisits = updateVisit(editingId, selected, form);
      const success = saveVisits(nextVisits);
      return { success, nextVisits };
    },
    [updateVisit, saveVisits],
  );

  const deleteVisit = useCallback(
    (id: string) => {
      const nextVisits = visits.filter((v) => v.id !== id);
      const success = saveVisits(nextVisits);
      return { success, nextVisits };
    },
    [visits, saveVisits],
  );

  const removeHistoryEntry = useCallback(
    (id: string, index: number) => {
      const nextVisits = visits.map((v) => {
        if (v.id !== id) return v;
        const history = getVisitHistoryEntries(v);
        if (history.length <= 1) return v;
        const trimmed = history.filter((_, i) => i !== index);
        const latest = trimmed[trimmed.length - 1];
        return {
          ...v,
          history: trimmed,
          date: latest.date,
          comment: latest.comment,
          rating: latest.rating,
          image: latest.image,
          visitCount: Math.max(1, trimmed.length),
        };
      });
      saveVisits(nextVisits);
    },
    [visits, saveVisits],
  );

  return {
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
  };
}
