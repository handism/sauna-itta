import { VisitStatus, LatLng } from "./domain";

// --- UI / フォーム型定義 ---
export interface VisitFormState {
  name: string;
  comment: string;
  image: string;
  date: string;
  rating: number;
  tagsText: string;
  status: VisitStatus;
  area: string;
  appendHistory: boolean;
}

export type SortOrder =
  | "recent"
  | "oldest"
  | "ratingDesc"
  | "ratingAsc"
  | "visitCountDesc"
  | "nameAsc";

export interface VisitFilters {
  search: string;
  status: "all" | VisitStatus;
  minRating: number;
  sort: SortOrder;
  selectedTag?: string;
  selectedArea?: string;
  filterByBounds?: boolean;
  mapBounds?: { northEast: LatLng; southWest: LatLng } | null;
}

export type SheetSnapPosition = "min" | "half" | "full";

export type MobileTab = "map" | "list" | "add";
