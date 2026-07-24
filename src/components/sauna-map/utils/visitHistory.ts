import { z } from "zod";
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit, VisitHistoryEntry, VisitStats, SaunaVisitSchema } from "../types";
import { VISITS_STORAGE_KEY } from "./constants";
import { extractPrefecture } from "./geo";

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

export function flattenVisitHistory(
  visits: SaunaVisit[],
): Array<VisitHistoryEntry & { visitId: string; status: "visited" | "wishlist" }> {
  const entries: Array<VisitHistoryEntry & { visitId: string; status: "visited" | "wishlist" }> =
    [];

  for (const visit of visits) {
    const status = visit.status ?? "visited";
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
  const entryDate = form.date || new Date().toISOString().split("T")[0];
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
    status: v.status ?? "visited",
    area: v.area ?? "",
  }));
}

function isValidVisit(v: unknown): v is SaunaVisit {
  return SaunaVisitSchema.safeParse(v).success;
}

export function getInitialVisits(): SaunaVisit[] {
  const baseVisits = normalizeVisits(initialVisits as SaunaVisit[]);
  if (typeof window === "undefined") {
    return baseVisits;
  }

  let savedVisits: string | null = null;
  try {
    savedVisits = localStorage.getItem(VISITS_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to read visits from localStorage:", error);
    return baseVisits;
  }

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
    const validSaved: SaunaVisit[] = batchResult.success
      ? batchResult.data
      : (parsedSaved.filter(isValidVisit) as SaunaVisit[]);

    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customSaved = validSaved.filter((v) => !initialIds.has(v.id));
    const customVisits = normalizeVisits(customSaved);
    return [...customVisits, ...baseVisits];
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

    const isVisited = (visit.status ?? "visited") === "visited";
    if (isVisited) {
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

export function getPopularTags(visits: SaunaVisit[], limit = 5): string[] {
  const tagCounts = new Map<string, number>();
  for (const visit of visits) {
    if (Array.isArray(visit.tags)) {
      for (const tag of visit.tags) {
        const trimmed = tag.trim();
        if (trimmed) {
          tagCounts.set(trimmed, (tagCounts.get(trimmed) ?? 0) + 1);
        }
      }
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([tag]) => tag);
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
