import { SaunaVisit, VisitHistoryEntry, VisitStatus } from "../types";
import { getTodayDate } from "./date";
import { getVisitStatus } from "./visitStatus";

export function getVisitHistoryEntries(visit: SaunaVisit): VisitHistoryEntry[] {
  if (Array.isArray(visit.history) && visit.history.length > 0) {
    return visit.history;
  }

  return [
    {
      date: visit.date,
      comment: visit.comment ?? "",
      rating: visit.rating ?? 0,
      image: visit.image,
    },
  ];
}

export function getVisitCount(visit: SaunaVisit): number {
  const historyCount = Array.isArray(visit.history) ? visit.history.length : 0;
  return Math.max(1, visit.visitCount ?? 1, historyCount);
}

/**
 * 訪問記録を 1 件ずつに平坦化した履歴エントリ。
 * 統計ページでは `useStatsData` が一度だけ算出し、各グラフへ渡す
 * （グラフごとに flattenVisitHistory() を呼ぶと同じ走査を何度も繰り返すため）。
 */
export type FlatVisitHistoryEntry = VisitHistoryEntry & {
  visitId: string;
  status: VisitStatus;
};

/**
 * 訪問記録を履歴エントリ単位へ平坦化する。
 * @param filterStatus 指定した場合、そのステータスの記録だけを対象にする
 *   （平坦化してから絞り込むと、除外する分まで配列を作ることになるため走査中に弾く）
 */
export function flattenVisitHistory(
  visits: SaunaVisit[],
  filterStatus?: VisitStatus,
): FlatVisitHistoryEntry[] {
  const entries: FlatVisitHistoryEntry[] = [];

  for (const visit of visits) {
    const status = getVisitStatus(visit);

    if (filterStatus && status !== filterStatus) {
      continue;
    }

    const visitId = visit.id;
    for (const entry of getVisitHistoryEntries(visit)) {
      entries.push({
        date: entry.date,
        comment: entry.comment,
        rating: entry.rating,
        image: entry.image,
        visitId,
        status,
      });
    }
  }

  return entries;
}

/**
 * 履歴の末尾（最新の訪問）を記録本体の date / comment / rating / image へ写し、
 * 訪問回数を揃えた差分を返す。
 *
 * 記録本体のこれらの値は最新履歴の写しであり、履歴を足す・直す・消すどの経路でも
 * 同じ形に保つ必要がある。経路ごとに書き写すと 1 箇所の直し忘れで、一覧に出る本体の値と
 * 履歴の中身がずれる。履歴を触る処理は必ずこれを通すこと。
 *
 * @param history 1 件以上の履歴。`getVisitHistoryEntries()` は必ず 1 件以上返す
 * @param visitCount 引き継ぐ訪問回数。履歴を削除する経路では渡さないこと
 *   （旧形式から引き継いだ回数ごと残件数へ揃える。ルートの AGENTS.md のデータソース規約を参照）
 */
export function syncLatestFromHistory(
  history: VisitHistoryEntry[],
  visitCount?: number,
): Pick<SaunaVisit, "history" | "date" | "comment" | "rating" | "image" | "visitCount"> {
  const latest = history[history.length - 1];

  return {
    history,
    date: latest.date,
    comment: latest.comment,
    rating: latest.rating,
    image: latest.image,
    visitCount: Math.max(1, visitCount ?? 1, history.length),
  };
}

type HistoryEntryInput = { date?: string; comment: string; rating?: number; image?: string };

/**
 * フォームの入力から履歴 1 件を組み立てる。新規作成（createNewVisit）と
 * 更新（buildHistoryUpdate）で日付・評価の既定値を食い違わせないよう、ここに集約する。
 */
export function buildHistoryEntry(form: HistoryEntryInput): VisitHistoryEntry {
  return {
    date: form.date || getTodayDate(),
    comment: form.comment,
    rating: form.rating || 0,
    image: form.image,
  };
}

export function buildHistoryUpdate(
  v: SaunaVisit,
  form: HistoryEntryInput & { appendHistory?: boolean },
): Pick<SaunaVisit, "history" | "comment" | "image" | "date" | "rating" | "visitCount"> {
  const nextEntry = buildHistoryEntry(form);
  const baseHistory = getVisitHistoryEntries(v);
  const history = form.appendHistory
    ? [...baseHistory, nextEntry]
    : [...baseHistory.slice(0, -1), nextEntry];

  return syncLatestFromHistory(history, v.visitCount);
}

export function normalizeVisits(visits: SaunaVisit[]): SaunaVisit[] {
  return visits.map((v) => ({
    ...v,
    ...syncLatestFromHistory(getVisitHistoryEntries(v), v.visitCount),
    tags: v.tags ?? [],
    status: getVisitStatus(v),
    area: v.area ?? "",
  }));
}
