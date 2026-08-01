import { useCallback, useMemo, useState } from "react";
import {
  calculateStats,
  getVisitCount,
  getVisitStatus,
  isInBounds,
  createSearchRegex,
  matchesSearchKeyword,
} from "../utils";
import { SaunaVisit, VisitFilters } from "../types";

const DEFAULT_FILTERS: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  sort: "recent",
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  mapBounds: null,
};

/**
 * 統計ページのタグから遷移してきた場合 (?tag=...) は、その絞り込みを適用した状態で開く。
 * 地図は ssr: false で描画されるため、初期値の算出で window を参照して問題ない。
 */
export function getInitialFilters(): VisitFilters {
  if (typeof window === "undefined") {
    return DEFAULT_FILTERS;
  }

  const tag = new URLSearchParams(window.location.search).get("tag");
  return tag ? { ...DEFAULT_FILTERS, selectedTag: tag } : DEFAULT_FILTERS;
}

export function useVisitFilters(visits: SaunaVisit[]) {
  const [filters, setFilters] = useState<VisitFilters>(getInitialFilters);

  const filteredVisits = useMemo(() => {
    const searchRegex = createSearchRegex(filters.search);

    const result = visits.filter((v) => {
      if (filters.status !== "all" && getVisitStatus(v) !== filters.status) {
        return false;
      }

      if ((v.rating ?? 0) < filters.minRating) {
        return false;
      }

      if (filters.selectedTag && (!v.tags || !v.tags.includes(filters.selectedTag))) {
        return false;
      }

      if (filters.selectedArea && (!v.area || !v.area.includes(filters.selectedArea))) {
        return false;
      }

      if (filters.filterByBounds && !isInBounds(v.lat, v.lng, filters.mapBounds)) {
        return false;
      }

      if (!matchesSearchKeyword(v, searchRegex)) {
        return false;
      }

      return true;
    });

    return result.toSorted((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return a.date.localeCompare(b.date);
        case "ratingDesc":
          return (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date);
        case "ratingAsc":
          return (a.rating ?? 0) - (b.rating ?? 0) || b.date.localeCompare(a.date);
        case "visitCountDesc":
          // history.length と visitCount の両方を考慮する必要があるため getVisitCount() を使う
          return getVisitCount(b) - getVisitCount(a) || b.date.localeCompare(a.date);
        case "nameAsc":
          return a.name.localeCompare(b.name, "ja");
        case "recent":
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [visits, filters]);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim().length > 0) count++;
    if (filters.status !== "all") count++;
    if (filters.minRating > 0) count++;
    if (filters.sort !== "recent") count++;
    if (filters.selectedTag) count++;
    if (filters.selectedArea) count++;
    if (filters.filterByBounds) count++;
    return count;
  }, [filters]);

  const isFilterActive = activeFilterCount > 0;

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    filters,
    setFilters,
    filteredVisits,
    stats,
    isFilterActive,
    activeFilterCount,
    clearFilters,
  };
}
