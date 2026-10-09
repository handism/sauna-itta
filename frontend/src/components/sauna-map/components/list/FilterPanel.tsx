import { Dispatch, SetStateAction, useMemo } from "react";
import { Map, ChevronUp, RotateCcw } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../../types";
import { getPopularAreas, getPopularTags } from "../../utils";
import { cx } from "../../utils/classNames";

const MIN_RATING_OPTIONS = [
  { value: 0, label: "指定なし" },
  { value: 1, label: "★1以上" },
  { value: 2, label: "★2以上" },
  { value: 3, label: "★3以上" },
  { value: 4, label: "★4以上" },
  { value: 5, label: "★5のみ" },
];

interface FilterPanelProps {
  isOpen: boolean;
  visits?: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onClearFilters: () => void;
  onClose: () => void;
}

export function FilterPanel({
  isOpen,
  visits = [],
  filters,
  setFilters,
  isFilterActive,
  onClearFilters,
  onClose,
}: FilterPanelProps) {
  const areas = useMemo(() => getPopularAreas(visits, visits.length), [visits]);
  const tags = useMemo(() => getPopularTags(visits, Number.MAX_SAFE_INTEGER), [visits]);

  if (!isOpen) {
    return null;
  }

  return (
    <div id="visit-filter-panel" className="filters-panel" role="region" aria-label="詳細フィルター">
      <div className="filters-panel-header">
        <span className="filters-panel-title">詳細フィルター</span>
        <button
          type="button"
          className="filters-panel-close"
          onClick={onClose}
          aria-label="詳細フィルターを閉じる"
          title="閉じる"
        >
          <ChevronUp size={16} />
        </button>
      </div>

      <div className="filters-panel-body">
        <div className="form-group">
          <label htmlFor="filter-area">地域</label>
          <select
            id="filter-area"
            className="input select-input"
            value={filters.selectedArea}
            onChange={(e) => {
              const selectedArea = e.target.value;
              setFilters((prev) => ({ ...prev, selectedArea }));
            }}
          >
            <option value="">すべての地域</option>
            {filters.selectedArea && !areas.includes(filters.selectedArea) && (
              <option value={filters.selectedArea}>{filters.selectedArea}</option>
            )}
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="filter-tag">タグ</label>
          <select
            id="filter-tag"
            className="input select-input"
            value={filters.selectedTag}
            onChange={(e) => {
              const selectedTag = e.target.value;
              setFilters((prev) => ({ ...prev, selectedTag }));
            }}
          >
            <option value="">すべてのタグ</option>
            {filters.selectedTag && !tags.includes(filters.selectedTag) && (
              <option value={filters.selectedTag}>{filters.selectedTag}</option>
            )}
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="filters-label" htmlFor="filter-min-rating">
            最低満足度
          </label>
          <select
            id="filter-min-rating"
            className="input select-input"
            value={filters.minRating}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minRating: Number(e.target.value),
              }))
            }
          >
            {MIN_RATING_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          {/* 対象がボタンのため label ではなくグループラベルとして関連付ける */}
          <span className="filters-label form-group-label" id="filter-bounds-label">
            表示エリア
          </span>
          <div role="group" aria-labelledby="filter-bounds-label">
            <button
              type="button"
              className={cx("btn bounds-toggle-btn bounds-toggle-btn--full", filters.filterByBounds && "is-active")}
              aria-pressed={filters.filterByBounds}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  filterByBounds: !prev.filterByBounds,
                }))
              }
            >
              <Map size={15} aria-hidden="true" /> 地図の表示エリア内のみ表示
            </button>
          </div>
        </div>
      </div>

      {isFilterActive && (
        <div className="filters-panel-footer">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClearFilters}
          >
            <RotateCcw size={13} /> フィルターをクリア
          </button>
        </div>
      )}
    </div>
  );
}
