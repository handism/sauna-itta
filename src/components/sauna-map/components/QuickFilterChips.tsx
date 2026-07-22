import { Dispatch, SetStateAction } from "react";
import { VisitFilters } from "../types";

interface QuickFilterChipsProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
}

export function QuickFilterChips({ filters, setFilters }: QuickFilterChipsProps) {
  const handleStatusChange = (status: "all" | "visited" | "wishlist") => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleRatingToggle = (minRating: number) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === minRating ? 0 : minRating,
    }));
  };

  return (
    <div className="quick-filter-chips" aria-label="クイックフィルター">
      <button
        type="button"
        className={`chip-btn ${filters.status === "all" ? "is-active" : ""}`}
        onClick={() => handleStatusChange("all")}
      >
        すべて
      </button>
      <button
        type="button"
        className={`chip-btn ${filters.status === "visited" ? "is-active" : ""}`}
        onClick={() => handleStatusChange("visited")}
      >
        ♨️ 訪問済
      </button>
      <button
        type="button"
        className={`chip-btn ${filters.status === "wishlist" ? "is-active" : ""}`}
        onClick={() => handleStatusChange("wishlist")}
      >
        ✨ イキタイ
      </button>
      <button
        type="button"
        className={`chip-btn ${filters.minRating === 4 ? "is-active" : ""}`}
        onClick={() => handleRatingToggle(4)}
      >
        ★ 4.0以上
      </button>
    </div>
  );
}
