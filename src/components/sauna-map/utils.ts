import { SaunaVisit, VisitFormState } from "./types";

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
    rating: v.rating ?? 0,
    tags: v.tags ?? [],
    status: v.status ?? "visited",
    area: v.area ?? "",
    visitCount: Math.max(1, v.visitCount ?? 1),
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
    visitCount: 1,
  };
}

export function toFormState(visit: SaunaVisit): VisitFormState {
  return {
    name: visit.name,
    comment: visit.comment,
    image: visit.image || "",
    date: visit.date,
    rating: visit.rating ?? 0,
    tagsText: (visit.tags ?? []).join(", "),
    status: visit.status ?? "visited",
    area: visit.area ?? "",
    visitCount: Math.max(1, visit.visitCount ?? 1),
  };
}

export function toNormalizedTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
