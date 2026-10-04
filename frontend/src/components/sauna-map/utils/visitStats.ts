import { SaunaVisit, VisitStats } from "../types";
import { comparePrefectures, extractPrefecture } from "./geo";
import { getVisitCount, getVisitHistoryEntries } from "./visitHistory";
import { isVisited, isWishlist, WISHLIST_LABEL } from "./visitStatus";

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
  const prefectures = Array.from(prefectureSet).sort(comparePrefectures);

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

/**
 * 「通っている」とみなす最小の訪問回数。全施設が 1 回ずつのとき、訪問回数で順位を付けても
 * 全員同率で意味が無いため、MY HOME SAUNA と よく行く施設 TOP 5 はこの回数以上の施設だけを扱う。
 */
export const REPEAT_VISIT_MIN_COUNT = 2;

/** {@link rankVisitsByCount} の結果のうち、{@link REPEAT_VISIT_MIN_COUNT} 回以上行った施設だけを返す（順序は保つ）。 */
export function getRepeatVisits(ranked: RankedVisit[]): RankedVisit[] {
  return ranked.filter(({ count }) => count >= REPEAT_VISIT_MIN_COUNT);
}

/**
 * {@link rankVisitsByCount} の結果を満足度の高い順に並べ替えて返す（同点なら元の順＝訪問回数・施設名の順）。
 * 繰り返し訪問した施設が無いときの TOP 5 の代わりの並びに使う。評価の無い記録は 0 点として末尾へ回す。
 */
export function sortRankedByRating(ranked: RankedVisit[]): RankedVisit[] {
  return [...ranked].sort((a, b) => (b.visit.rating ?? 0) - (a.visit.rating ?? 0));
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

/** フォームのタグ候補の既定（記録にタグが少ないうちはこれで埋める） */
export const PRESET_TAGS = [
  "外気浴最高",
  "水風呂キンキン",
  "セルフロウリュ",
  "アウフグース",
  "サウナ飯",
  "ソロ向き",
] as const;

/** フォームに並べるタグ候補の数 */
export const TAG_SUGGESTION_LIMIT = 8;

/**
 * フォームのタグ候補。利用者がよく付けるタグを先に並べ、足りない分を
 * {@link PRESET_TAGS} で埋める。固定のプリセットだけだと、自分のタグは毎回手で打つことになる。
 * 「行きたい」はステータスで表すため候補に出さない。
 */
export function getTagSuggestions(
  visits: SaunaVisit[],
  limit = TAG_SUGGESTION_LIMIT,
): string[] {
  const suggestions: string[] = [];
  const candidates = [
    ...countTags(visits).map(({ name }) => name),
    ...PRESET_TAGS,
  ];
  for (const tag of candidates) {
    if (suggestions.length >= limit) break;
    if (tag === WISHLIST_LABEL || suggestions.includes(tag)) continue;
    suggestions.push(tag);
  }
  return suggestions;
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

export interface MonthlyVisitCount {
  /** YYYY-MM */
  month: string;
  visits: number;
}

/**
 * 月別の訪問件数を、最初の訪問月から最後の訪問月まで 0 件の月も含めて並べる。
 * 記録のある月だけを並べると、棒グラフの x 軸が「5月 → 7月」のように飛んでも
 * 等間隔に見え、空白期間が読み取れなくなるため。
 */
export function getMonthlyVisitCounts(entries: { date: string }[]): MonthlyVisitCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const month = entry.date.substring(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const months = Array.from(counts.keys()).sort();
  const [firstYear, firstMonth] = months[0].split("-").map(Number);
  const [lastYear, lastMonth] = months[months.length - 1].split("-").map(Number);

  const result: MonthlyVisitCount[] = [];
  let year = firstYear;
  let month = firstMonth;
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    result.push({ month: key, visits: counts.get(key) ?? 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}
