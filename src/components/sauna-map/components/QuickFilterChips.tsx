import { Dispatch, SetStateAction, useMemo } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { getPopularAreas, getPopularTags } from "../utils";

interface QuickFilterChipsProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  visits?: SaunaVisit[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  resultCount?: number;
}

export function QuickFilterChips({
  filters,
  setFilters,
  visits = [],
  activeFilterCount = 0,
  onClearFilters,
  resultCount,
}: QuickFilterChipsProps) {
  const popularAreas = useMemo(() => getPopularAreas(visits, 4), [visits]);
  const popularTags = useMemo(() => getPopularTags(visits, 5), [visits]);

  const handleStatusChange = (status: "all" | "visited" | "wishlist") => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleRatingToggle = (minRating: number) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === minRating ? 0 : minRating,
    }));
  };

  const handleAreaToggle = (area: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedArea: prev.selectedArea === area ? "" : area,
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedTag: prev.selectedTag === tag ? "" : tag,
    }));
  };

  const isFilterActive = activeFilterCount > 0;

  return (
    <div className="quick-filter-container">
      <div className="quick-filter-chips" aria-label="クイックフィルター">
        {/* リセット / アクティブバッジ */}
        {isFilterActive && onClearFilters && (
          <button
            type="button"
            className="chip-btn chip-reset-btn"
            onClick={onClearFilters}
            title="フィルターをクリア"
          >
            ✕ クリア {activeFilterCount > 0 && <span className="chip-badge">{activeFilterCount}</span>}
          </button>
        )}

        {/* ステータス */}
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

        {/* 動的エリアチップ */}
        {popularAreas.map((area) => (
          <button
            key={`area-${area}`}
            type="button"
            className={`chip-btn ${filters.selectedArea === area ? "is-active" : ""}`}
            onClick={() => handleAreaToggle(area)}
          >
            📍 {area}
          </button>
        ))}

        {/* 動的タグチップ */}
        {popularTags.map((tag) => (
          <button
            key={`tag-${tag}`}
            type="button"
            className={`chip-btn ${filters.selectedTag === tag ? "is-active" : ""}`}
            onClick={() => handleTagToggle(tag)}
          >
            🏷️ {tag}
          </button>
        ))}
      </div>

      {resultCount !== undefined && (
        <div className="filter-result-count">
          {resultCount} 件表示
        </div>
      )}
    </div>
  );
}
