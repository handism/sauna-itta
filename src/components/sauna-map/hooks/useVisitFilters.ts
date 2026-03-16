import { useMemo, useState } from "react";
import { calculateStats } from "../utils";
import { SaunaVisit, VisitFilters } from "../types";

const DEFAULT_FILTERS: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  sort: "recent",
};

export function useVisitFilters(visits: SaunaVisit[]) {
  const [filters, setFilters] = useState<VisitFilters>(DEFAULT_FILTERS);

  const filteredVisits = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    let result = visits.filter((v) => {
      if (filters.status !== "all" && (v.status ?? "visited") !== filters.status) {
        return false;
      }

      if ((v.rating ?? 0) < filters.minRating) {
        return false;
      }

      if (keyword) {
        const text = [v.name, v.comment, v.area ?? "", (v.tags ?? []).join(" ")]
          .join(" ")
          .toLowerCase();
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
        case "recent":
        default:
          return b.date.localeCompare(a.date);
      }
    });

    return result;
  }, [visits, filters]);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  const isFilterActive =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.minRating > 0 ||
    filters.sort !== "recent";

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return {
    filters,
    setFilters,
    filteredVisits,
    stats,
    isFilterActive,
    clearFilters,
  };
}
