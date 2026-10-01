import { SaunaVisit, VisitFormState } from "../types";
// 同じ utils 内は個別ファイルから直接読む。"../utils"（index.ts）経由にすると、
// index.ts が本ファイルを再エクスポートしているため循環 import になる。
import { toNormalizedTags } from "./form";
import {
  buildHistoryEntry,
  buildHistoryUpdate,
  getVisitHistoryEntries,
  syncLatestFromHistory,
} from "./visitHistory";

export function createNewVisit(
  selected: { lat: number; lng: number },
  form: VisitFormState
): SaunaVisit {
  return {
    id: crypto.randomUUID(),
    name: form.name,
    lat: selected.lat,
    lng: selected.lng,
    // 本体の date / comment / rating / image と訪問回数は、更新・削除と同じく履歴から写す
    ...syncLatestFromHistory([buildHistoryEntry(form)]),
    tags: toNormalizedTags(form.tagsText),
    status: form.status,
    area: form.area,
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
