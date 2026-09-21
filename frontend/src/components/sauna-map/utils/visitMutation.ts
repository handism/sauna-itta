import { SaunaVisit, VisitFormState } from "../types";
import {
  getTodayDate,
  buildHistoryUpdate,
  getVisitHistoryEntries,
  syncLatestFromHistory,
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
    id: crypto.randomUUID(),
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
    // visitCount を渡さないことで、旧形式から引き継いだ回数ごと残件数へ揃える。
    // 引き継ぐ実装へ戻すと、同じ操作なのにapiモード
    // (HistoryEntriesController#truncate_legacy_visit_count) と訪問回数が食い違う。
    return { ...v, ...syncLatestFromHistory(trimmed) };
  });
}
