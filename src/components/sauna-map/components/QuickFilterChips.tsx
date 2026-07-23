import { Dispatch, SetStateAction, useMemo } from "react";
import { X, Star, MapPin, Tag } from "lucide-react";
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
}: QuickFilterChipsProps) {
  const popularAreas = useMemo(() => getPopularAreas(visits, 4), [visits]);
  const popularTags = useMemo(() => getPopularTags(visits, 5), [visits]);

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

  // もしサブフィルター（★4以上、エリア、タグ、またはアクティブフィルター）が存在しない場合は非表示にすることも視野に入れるが、スクロールチップバーとしてシンプルに提供
  return (
    <div className="quick-filter-container">
      <div className="quick-filter-chips" aria-label="サブフィルター">
        {/* リセット / アクティブバッジ */}
        {isFilterActive && onClearFilters && (
          <button
            type="button"
            className="chip-btn chip-reset-btn"
            onClick={onClearFilters}
            title="フィルターをクリア"
          >
            <X size={13} /> クリア {activeFilterCount > 0 && <span className="chip-badge">{activeFilterCount}</span>}
          </button>
        )}

        <button
          type="button"
          className={`chip-btn ${filters.minRating === 4 ? "is-active" : ""}`}
          onClick={() => handleRatingToggle(4)}
        >
          <Star size={13} /> 4.0以上
        </button>

        {/* 動的エリアチップ */}
        {popularAreas.map((area) => (
          <button
            key={`area-${area}`}
            type="button"
            className={`chip-btn ${filters.selectedArea === area ? "is-active" : ""}`}
            onClick={() => handleAreaToggle(area)}
          >
            <MapPin size={13} /> {area}
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
            <Tag size={13} /> {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

