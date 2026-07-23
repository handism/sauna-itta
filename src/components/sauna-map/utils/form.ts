import { SaunaVisit, VisitFormState } from "../types";
import { getVisitHistoryEntries } from "./visitHistory";

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
