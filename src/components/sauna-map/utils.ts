import imageCompression from "browser-image-compression";
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit, VisitFormState, VisitHistoryEntry, VisitStats, SaunaVisitSchema } from "./types";

export const VISITS_STORAGE_KEY = "sauna-itta_visits";
export const THEME_STORAGE_KEY = "sauna-itta_theme";

export function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
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
    if (parsed.protocol === "data:" && parsed.pathname.startsWith("image/")) {
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

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
}

export function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
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

  const savedVisits = localStorage.getItem(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return baseVisits;
  }

  try {
    const parsedSaved = JSON.parse(savedVisits);
    if (!Array.isArray(parsedSaved)) {
      return baseVisits;
    }
    const validSaved = parsedSaved.filter(isValidVisit) as SaunaVisit[];
    const normalizedSaved = normalizeVisits(validSaved);
    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customVisits = normalizedSaved.filter((v) => !initialIds.has(v.id));
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

  const acc = visits.reduce(
    (acc, visit) => {
      const status = visit.status ?? "visited";

      if (status === "visited") {
        acc.visitedCount++;

        const pref = extractPrefecture(visit.area);
        if (pref != null) {
          acc.prefectureSet.add(pref);
        }

        const history = getVisitHistoryEntries(visit);
        for (let j = 0; j < history.length; j++) {
          const entry = history[j];

          if (acc.firstDate === null || entry.date.localeCompare(acc.firstDate) < 0) {
            acc.firstDate = entry.date;
          }
          if (acc.lastDate === null || entry.date.localeCompare(acc.lastDate) > 0) {
            acc.lastDate = entry.date;
          }

          const rating = entry.rating ?? 0;
          if (rating > 0) {
            acc.ratingSum += rating;
            acc.ratingCount++;
          }
        }
      }

      const area = (visit.area ?? "").trim();
      if (area.length > 0) {
        acc.areas.add(area);
      }

      return acc;
    },
    {
      visitedCount: 0,
      firstDate: null as string | null,
      lastDate: null as string | null,
      ratingSum: 0,
      ratingCount: 0,
      areas: new Set<string>(),
      prefectureSet: new Set<string>(),
    }
  );
  const prefectures = Array.from(acc.prefectureSet).sort((a, b) => a.localeCompare(b, "ja"));

  return {
    total,
    visitedCount: acc.visitedCount,
    wishlistCount: total - acc.visitedCount,
    firstDate: acc.firstDate,
    lastDate: acc.lastDate,
    avgRating: acc.ratingCount > 0 ? Math.round((acc.ratingSum / acc.ratingCount) * 10) / 10 : 0,
    uniqueAreas: acc.areas.size,
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
