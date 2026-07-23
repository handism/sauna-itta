import imageCompression from "browser-image-compression";
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit, VisitFormState, VisitHistoryEntry, VisitStats, SaunaVisitSchema } from "./types";

export const VISITS_STORAGE_KEY = "sauna-itta_visits";
export const THEME_STORAGE_KEY = "sauna-itta_theme";
// スタイル側の @media (max-width) ブレークポイント（767/768px）と値を揃えること
export const MOBILE_BREAKPOINT = 768;

export function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
  const match = s.match(/^(東京都|北海道|(?:京都|大阪)府|.+?県)/);
  if (match) return match[1];
  const first = s.split(/\s/)[0];
  return /[都道府県]$/.test(first) ? first : null;
}

export function getDirectionsUrl(lat: number, lng: number): string {
  const safeLat = encodeURIComponent(Number(lat).toString());
  const safeLng = encodeURIComponent(Number(lng).toString());
  return `https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}`;
}

export function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "http://localhost");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    if (parsed.protocol === "data:" && /^image\/(jpeg|jpg|png|gif|webp|bmp)(;|,)/i.test(parsed.pathname)) {
      return url;
    }
  } catch {
    // URL parsing failed, return undefined
  }
  return undefined;
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

export function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
    return "dark";
  }
}

export function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

export function applyThemeClass(theme: "dark" | "light"): void {
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  } else {
    document.documentElement.classList.remove("light-theme");
  }
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDefaultForm(date = ""): VisitFormState {
  return {
    name: "",
    comment: "",
    image: "",
    date,
    rating: 0,
    tagsText: "",
    status: "visited",
    area: "",
    appendHistory: false,
  };
}

export function toFormState(visit: SaunaVisit): VisitFormState {
  const history = getVisitHistoryEntries(visit);
  const latest = history[history.length - 1];
  return {
    name: visit.name,
    comment: latest?.comment ?? visit.comment ?? "",
    image: latest?.image ?? visit.image ?? "",
    date: latest?.date ?? visit.date,
    rating: latest?.rating ?? visit.rating ?? 0,
    tagsText: (visit.tags ?? []).join(", "),
    status: visit.status ?? "visited",
    area: visit.area ?? "",
    appendHistory: false,
  };
}

export function toNormalizedTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

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
  form: VisitFormState,
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
    const validSaved = parsedSaved.filter(isValidVisit) as SaunaVisit[];
    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customSaved = validSaved.filter((v) => !initialIds.has(v.id));
    const customVisits = normalizeVisits(customSaved);
    return [...customVisits, ...baseVisits];
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return baseVisits;
  }
}

function getUniqueAreasCount(visits: SaunaVisit[]): number {
  const areas = new Set<string>();
  for (const visit of visits) {
    const area = (visit.area ?? "").trim();
    if (area.length > 0) {
      areas.add(area);
    }
  }
  return areas.size;
}

function getPrefectures(visitedVisits: SaunaVisit[]): string[] {
  const prefectureSet = new Set<string>();
  for (const visit of visitedVisits) {
    const pref = extractPrefecture(visit.area);
    if (pref != null) {
      prefectureSet.add(pref);
    }
  }
  return Array.from(prefectureSet).sort((a, b) => a.localeCompare(b, "ja"));
}

function getDateAndRatingStats(visitedVisits: SaunaVisit[]) {
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const visit of visitedVisits) {
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

  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

  return { firstDate, lastDate, avgRating };
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

  const visitedVisits = visits.filter(v => (v.status ?? "visited") === "visited");
  const visitedCount = visitedVisits.length;
  const uniqueAreas = getUniqueAreasCount(visits);
  const prefectures = getPrefectures(visitedVisits);
  const { firstDate, lastDate, avgRating } = getDateAndRatingStats(visitedVisits);

  return {
    total,
    visitedCount,
    wishlistCount: total - visitedCount,
    firstDate,
    lastDate,
    avgRating,
    uniqueAreas,
    prefectures,
    prefectureCount: prefectures.length,
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

export async function compressAndGetBase64(file: File): Promise<string> {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(compressedFile);
  });
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
