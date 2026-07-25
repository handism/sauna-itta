import { Dispatch, SetStateAction, memo } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { QuickFilterChips } from "./QuickFilterChips";
import { SortSelect } from "./SortSelect";
import { FilterPanel } from "./FilterPanel";
import { useSaunaUI } from "../context";

interface VisitListSearchProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  visits: SaunaVisit[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onToggleFilterPanel?: () => void;
}

function VisitListSearchComponent({
  filters,
  setFilters,
  visits,
  activeFilterCount = 0,
  onClearFilters,
  onToggleFilterPanel,
}: VisitListSearchProps) {
  const ui = useSaunaUI();

  const isFilterPanelOpen = ui.isFilterPanelOpen;
  const toggleFilterPanel = onToggleFilterPanel ?? ui.toggleFilterPanel;
  const closeFilterPanel = ui.closeFilterPanel;
  const isFilterActive = activeFilterCount > 0 || filters.minRating > 0 || filters.filterByBounds;

  return (
    <div className="sauna-search-box">
      <div className="search-row">
        <div className="search-input-wrapper">
          <span className="search-icon"><Search size={15} /></span>
          <input
            type="text"
            className="input search-input"
            placeholder="サウナ名・エリア・タグで即検索..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              aria-label="検索のクリア"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="controls-row">
        <div className="status-tabs" role="tablist" aria-label="ステータスフィルター">
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "all"}
            className={`status-tab ${filters.status === "all" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
          >
            すべて
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "visited"}
            className={`status-tab ${filters.status === "visited" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "visited" }))}
          >
            行った
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "wishlist"}
            className={`status-tab ${filters.status === "wishlist" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "wishlist" }))}
          >
            イキタイ
          </button>
        </div>

        <div className="controls-actions">
          <SortSelect
            value={filters.sort}
            onChange={(newSort) =>
              setFilters((prev) => ({ ...prev, sort: newSort }))
            }
          />
          <button
            type="button"
            className={`filters-open-btn ${isFilterPanelOpen || isFilterActive ? "is-active" : ""}`}
            onClick={toggleFilterPanel}
            title="詳細フィルター（最低満足度・マップ表示エリア）"
            aria-expanded={isFilterPanelOpen}
            aria-label="詳細フィルターの表示切り替え"
          >
            <SlidersHorizontal size={15} />
            {isFilterActive && <span className="filters-badge" />}
          </button>
        </div>
      </div>

      <FilterPanel
        isOpen={isFilterPanelOpen}
        filters={filters}
        setFilters={setFilters}
        isFilterActive={Boolean(isFilterActive && onClearFilters)}
        onClearFilters={onClearFilters ?? (() => {})}
        onClose={closeFilterPanel}
      />

      <QuickFilterChips
        filters={filters}
        setFilters={setFilters}
        visits={visits}
        activeFilterCount={activeFilterCount}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}

export const VisitListSearch = memo(VisitListSearchComponent);
