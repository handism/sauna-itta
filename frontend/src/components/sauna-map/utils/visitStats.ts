import { SaunaVisit, VisitStats } from "../types";
import { extractPrefecture } from "./geo";
import { getVisitCount, getVisitHistoryEntries } from "./visitHistory";
import { isVisited, isWishlist } from "./visitStatus";

/*
 * 統計ページと地図の絞り込み候補で使う集計。記録そのものを変える処理は visitHistory.ts に置く。
 */

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

      const history = getVisitHistoryEntries(visit);
      for (const entry of history) {
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
