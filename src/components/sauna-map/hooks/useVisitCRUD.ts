import { useCallback } from "react";
import { SaunaVisit, VisitFormState } from "../types";
import {
  getTodayDate,
  buildHistoryUpdate,
  getVisitHistoryEntries,
  toNormalizedTags,
} from "../utils";

export function createNewVisit(
  selected: { lat: number; lng: number },
  form: VisitFormState
): SaunaVisit {
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
}

export function getUpdatedVisits(
  visits: SaunaVisit[],
  editingId: string,
  selected: { lat: number; lng: number },
  form: VisitFormState
): SaunaVisit[] {
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
}

export function getVisitsWithRemovedHistory(
  visits: SaunaVisit[],
  id: string,
  index: number
): SaunaVisit[] {
  return visits.map((v) => {
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
}

export function useVisitCRUD(
  visits: SaunaVisit[],
  saveVisits: (visits: SaunaVisit[]) => boolean
) {
  const addVisit = useCallback(
    (selected: { lat: number; lng: number }, form: VisitFormState) => {
      const newVisit = createNewVisit(selected, form);
      const success = saveVisits([newVisit, ...visits]);
      return { success, newVisit };
    },
    [visits, saveVisits],
  );

  const editVisit = useCallback(
    (editingId: string, selected: { lat: number; lng: number }, form: VisitFormState) => {
      const nextVisits = getUpdatedVisits(visits, editingId, selected, form);
      const success = saveVisits(nextVisits);
      return { success, nextVisits };
    },
    [visits, saveVisits],
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
      const nextVisits = getVisitsWithRemovedHistory(visits, id, index);
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
