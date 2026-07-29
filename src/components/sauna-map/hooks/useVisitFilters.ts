import { useCallback, useMemo, useState } from "react";
import { calculateStats, getVisitCount, getVisitStatus } from "../utils";
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
    const keyword = filters.search.trim();
    // Escape special regex characters in keyword for safe case-insensitive matching
    const searchRegex = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

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

      if (filters.filterByBounds && filters.mapBounds) {
        const { northEast, southWest } = filters.mapBounds;
        const inLat = v.lat >= Math.min(southWest.lat, northEast.lat) && v.lat <= Math.max(southWest.lat, northEast.lat);
        const minLng = Math.min(southWest.lng, northEast.lng);
        const maxLng = Math.max(southWest.lng, northEast.lng);
        const inLng = v.lng >= minLng && v.lng <= maxLng;
        if (!inLat || !inLng) return false;
      }

      if (searchRegex) {
        if (searchRegex.test(v.name)) return true;
        if (v.comment && searchRegex.test(v.comment)) return true;
        if (v.area && searchRegex.test(v.area)) return true;
        if (v.tags && v.tags.some((tag) => searchRegex.test(tag))) return true;
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
