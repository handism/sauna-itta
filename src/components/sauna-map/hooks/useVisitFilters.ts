import { useMemo, useState } from "react";
import { calculateStats } from "../utils";
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

export function useVisitFilters(visits: SaunaVisit[]) {
  const [filters, setFilters] = useState<VisitFilters>(DEFAULT_FILTERS);

  const filteredVisits = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    const result = visits.filter((v) => {
      if (filters.status !== "all" && (v.status ?? "visited") !== filters.status) {
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

      if (keyword) {
        const text = `${v.name} ${v.comment ?? ""} ${v.area ?? ""} ${(v.tags ?? []).join(" ")}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return a.date.localeCompare(b.date);
        case "ratingDesc":
          return (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date);
        case "ratingAsc":
          return (a.rating ?? 0) - (b.rating ?? 0) || b.date.localeCompare(a.date);
        case "visitCountDesc":
          return (b.visitCount ?? 1) - (a.visitCount ?? 1) || b.date.localeCompare(a.date);
        case "nameAsc":
          return a.name.localeCompare(b.name, "ja");
        case "recent":
        default:
          return b.date.localeCompare(a.date);
      }
    });

    return result;
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

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

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
