import { SaunaVisit, VisitFormState, VisitHistoryEntry } from "./types";

export const VISITS_STORAGE_KEY = "sauna-itta_visits";
export const THEME_STORAGE_KEY = "sauna-itta_theme";

export function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
  const first = s.split(/\s/)[0];
  return /[都道府県]$/.test(first) ? first : null;
}

export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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

  visits.forEach((visit) => {
    const status = visit.status ?? "visited";
    getVisitHistoryEntries(visit).forEach((entry) => {
      entries.push({ ...entry, visitId: visit.id, status });
    });
  });

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


function applyHistoryNormalization(visit: SaunaVisit): Pick<
  SaunaVisit,
  "history" | "date" | "comment" | "rating" | "image" | "visitCount"
> {
  const history = getVisitHistoryEntries(visit);
  const latest = history[history.length - 1];

  return {
    history,
    date: latest?.date ?? visit.date,
    comment: latest?.comment ?? visit.comment ?? "",
    rating: latest?.rating ?? visit.rating ?? 0,
    image: latest?.image ?? visit.image,
    visitCount: Math.max(1, visit.visitCount ?? 1, history.length),
  };
}
