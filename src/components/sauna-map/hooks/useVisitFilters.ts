import { useMemo, useState } from "react";
import { extractPrefecture } from "../utils";
import { SaunaVisit, VisitFilters, VisitStats } from "../types";

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

    result = result.slice().sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "ratingDesc":
          return (
            (b.rating ?? 0) - (a.rating ?? 0) ||
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        case "ratingAsc":
          return (
            (a.rating ?? 0) - (b.rating ?? 0) ||
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [visits, filters]);

  const stats = useMemo<VisitStats>(() => {
    const total = visits.length;
    if (total === 0) {
      return {
        total,
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

    const sortedByDate = [...visits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const firstDate = sortedByDate[0].date;
    const lastDate = sortedByDate[sortedByDate.length - 1].date;
    const visitedCount = visits.filter((v) => (v.status ?? "visited") === "visited").length;
    const wishlistCount = visits.filter((v) => (v.status ?? "visited") === "wishlist").length;
    const ratings = visits.map((v) => v.rating ?? 0).filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : 0;

    const areas = new Set(visits.map((v) => (v.area ?? "").trim()).filter((a) => a.length > 0));
    const prefectures = Array.from(
      new Set(
        visits
          .filter((v) => (v.status ?? "visited") === "visited")
          .map((v) => extractPrefecture(v.area))
          .filter((p): p is string => p != null),
      ),
    ).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      total,
      visitedCount,
      wishlistCount,
      firstDate,
      lastDate,
      avgRating,
      uniqueAreas: areas.size,
      prefectures,
      prefectureCount: prefectures.length,
    };
  }, [visits]);

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
