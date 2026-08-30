import { z } from "zod";
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit, VisitHistoryEntry, VisitStats, SaunaVisitSchema } from "../types";
import { VISITS_STORAGE_KEY } from "./constants";
import { getTodayDate } from "./date";
import { extractPrefecture } from "./geo";
import { readStorage } from "./storage";
import { getVisitStatus, isVisited, isWishlist } from "./visitStatus";

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
  status: "visited" | "wishlist";
};

export function flattenVisitHistory(visits: SaunaVisit[]): FlatVisitHistoryEntry[] {
  const entries: FlatVisitHistoryEntry[] = [];

  for (const visit of visits) {
    const status = getVisitStatus(visit);
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

export function buildHistoryUpdate(
  v: SaunaVisit,
  form: { date?: string; comment: string; rating?: number; image?: string; appendHistory?: boolean },
): Pick<SaunaVisit, "history" | "comment" | "image" | "date" | "rating" | "visitCount"> {
  const entryDate = form.date || getTodayDate();
  const nextEntry = {
    date: entryDate,
    comment: form.comment,
    rating: form.rating || 0,
    image: form.image,
  };
  const baseHistory = getVisitHistoryEntries(v);
  const history = form.appendHistory
    ? [...baseHistory, nextEntry]
    : [...baseHistory.slice(0, -1), nextEntry];
  const latest = history[history.length - 1];
  return {
    history,
    comment: latest.comment,
    image: latest.image,
    date: latest.date,
    rating: latest.rating,
    visitCount: Math.max(1, v.visitCount ?? 1, history.length),
  };
}

function applyHistoryNormalization(visit: SaunaVisit): Pick<
  SaunaVisit,
  "history" | "date" | "comment" | "rating" | "image" | "visitCount"
> {
  const history = getVisitHistoryEntries(visit);
  const latest = history[history.length - 1];

  return {
    history,
    date: latest.date,
    comment: latest.comment,
    rating: latest.rating,
    image: latest.image,
    visitCount: Math.max(1, visit.visitCount ?? 1, history.length),
  };
}

export function normalizeVisits(visits: SaunaVisit[]): SaunaVisit[] {
  return visits.map((v) => ({
    ...v,
    ...applyHistoryNormalization(v),
    tags: v.tags ?? [],
    status: getVisitStatus(v),
    area: v.area ?? "",
  }));
}

function isValidVisit(v: unknown): v is SaunaVisit {
  return SaunaVisitSchema.safeParse(v).success;
}

export function getInitialVisits(): SaunaVisit[] {
  const parsedInitial = z.array(SaunaVisitSchema).safeParse(initialVisits);
  const rawBaseVisits = parsedInitial.success ? parsedInitial.data : [];
  const baseVisits = normalizeVisits(rawBaseVisits);

  if (typeof window === "undefined") {
    return baseVisits;
  }

  const savedVisits = readStorage(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return baseVisits;
  }

  try {
    const parsedSaved = JSON.parse(savedVisits);
    if (!Array.isArray(parsedSaved)) {
      return baseVisits;
    }
    
    // 高速な一括検証を実施。一部無効な要素が含まれる場合のみフォールバック
    const batchResult = z.array(SaunaVisitSchema).safeParse(parsedSaved);
    const validSaved = batchResult.success
      ? batchResult.data
      : parsedSaved.filter(isValidVisit);

    /*
     * 保存があるときは保存側だけを正とする。同梱JSONを毎回足し戻す実装に戻すと、
     * デモ記録の編集・削除が保存直後は反映されるのに再読み込みで元へ戻ります
     * （保存側の同一IDが捨てられ、削除した記録も同梱JSONから復活するため）。
     * 同梱JSONは保存がまだ無いときの初期データとしてのみ使うこと。
     */
    return normalizeVisits(validSaved);
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return baseVisits;
  }
}

export function calculateStats(visits: SaunaVisit[]): VisitStats {
  const total = visits.length;
  if (total === 0) {
    return {
      total: 0,
      visitedCount: 0,
      wishlistCount: 0,
      firstDate: null,
      lastDate: null,
      avgRating: 0,
      uniqueAreas: 0,
      prefectures: [],
      prefectureCount: 0,
    };
  }

  let visitedCount = 0;
  const areasSet = new Set<string>();
  const prefectureSet = new Set<string>();
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const visit of visits) {
    const area = (visit.area ?? "").trim();
    if (area.length > 0) {
      areasSet.add(area);
    }

    if (isVisited(visit)) {
      visitedCount++;

      const pref = extractPrefecture(visit.area);
      if (pref != null) {
        prefectureSet.add(pref);
      }

      if (!Array.isArray(visit.history)) {
        visit.history = getVisitHistoryEntries(visit);
      }

      for (const entry of visit.history) {
        if (firstDate === null || entry.date < firstDate) {
          firstDate = entry.date;
        }
        if (lastDate === null || entry.date > lastDate) {
          lastDate = entry.date;
        }

        const rating = entry.rating ?? 0;
        if (rating > 0) {
          ratingSum += rating;
          ratingCount++;
        }
      }
    }
  }

  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;
  const prefectures = Array.from(prefectureSet).sort((a, b) => a.localeCompare(b, "ja"));

  return {
    total,
    visitedCount,
    wishlistCount: total - visitedCount,
    firstDate,
    lastDate,
    avgRating,
    uniqueAreas: areasSet.size,
    prefectures,
    prefectureCount: prefectures.length,
  };
}

export interface RankedVisit {
  visit: SaunaVisit;
  count: number;
}

/**
 * 訪問済みの記録を訪問回数の多い順（同数なら施設名の五十音順）に並べて返す。
 *
 * 統計ページの「MY HOME SAUNA」と「よく行く施設 TOP 5」は同じ順位を指す必要があるため、
 * 各カードで絞り込みと並べ替えを書かずにこれを使うこと（同数の場合の扱いがずれると、
 * 1 位として表示される施設が 2 つのカードで食い違います）。
 */
export function rankVisitsByCount(visits: SaunaVisit[]): RankedVisit[] {
  return visits
    .filter(isVisited)
    .map((visit) => ({ visit, count: getVisitCount(visit) }))
    .sort((a, b) => b.count - a.count || a.visit.name.localeCompare(b.visit.name, "ja"));
}

export interface TagCount {
  name: string;
  count: number;
}

/**
 * タグごとの出現回数を、件数の多い順（同数ならタグ名の五十音順）で返す。
 * @param excludeWishlist true の場合「行きたい」の記録を集計対象から外す
 */
export function countTags(
  visits: SaunaVisit[],
  { excludeWishlist = false }: { excludeWishlist?: boolean } = {},
): TagCount[] {
  const tagCounts = new Map<string, number>();

  for (const visit of visits) {
    if (excludeWishlist && isWishlist(visit)) {
      continue;
    }
    if (!Array.isArray(visit.tags)) {
      continue;
    }
    for (const tag of visit.tags) {
      const trimmed = tag.trim();
      if (trimmed) {
        tagCounts.set(trimmed, (tagCounts.get(trimmed) ?? 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([name, count]) => ({ name, count }));
}

export function getPopularTags(visits: SaunaVisit[], limit = 5): string[] {
  return countTags(visits)
    .slice(0, limit)
    .map(({ name }) => name);
}

export function getPopularAreas(visits: SaunaVisit[], limit = 4): string[] {
  const areaCounts = new Map<string, number>();
  for (const visit of visits) {
    const pref = extractPrefecture(visit.area);
    if (pref) {
      areaCounts.set(pref, (areaCounts.get(pref) ?? 0) + 1);
    }
  }

  return Array.from(areaCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([area]) => area);
}
