import { Dispatch, SetStateAction } from "react";
import { Map, ChevronUp, RotateCcw } from "lucide-react";
import { VisitFilters } from "../types";

interface FilterPanelProps {
  isOpen: boolean;
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onClearFilters: () => void;
  onClose: () => void;
}

export function FilterPanel({
  isOpen,
  filters,
  setFilters,
  isFilterActive,
  onClearFilters,
  onClose,
}: FilterPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="filters-panel" role="region" aria-label="詳細フィルター">
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
            <option value={0}>指定なし</option>
            <option value={1}>★1以上</option>
            <option value={2}>★2以上</option>
            <option value={3}>★3以上</option>
            <option value={4}>★4以上</option>
            <option value={5}>★5のみ</option>
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
              className={`btn bounds-toggle-btn bounds-toggle-btn--full ${filters.filterByBounds ? "is-active" : ""}`}
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
