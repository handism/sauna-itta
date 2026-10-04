import { VisitStatus, LatLng, SaunaVisit } from "./domain";

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

/**
 * 既存の記録の編集フォームを開くときの指定。
 * revisit は「また行った」（行った記録）／「行った！」（行きたい記録）から開くときに付け、
 * 今日の訪問を記録する初期値でフォームを開く。
 */
export interface StartEditingOptions {
  revisit?: boolean;
}

/** 一覧・地図から記録の編集フォームを開くハンドラ */
export type EditVisitHandler = (visit: SaunaVisit, options?: StartEditingOptions) => void;

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
