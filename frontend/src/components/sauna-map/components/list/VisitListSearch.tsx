import { Dispatch, SetStateAction, memo } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../../types";
import { QuickFilterChips } from "./QuickFilterChips";
import { SortSelect } from "./SortSelect";
import { FilterPanel } from "./FilterPanel";
import { useSaunaUI } from "../../context";

const STATUS_OPTIONS: { value: VisitFilters["status"]; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "visited", label: "行った" },
  { value: "wishlist", label: "行きたい" },
];

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
  // activeFilterCount は minRating / filterByBounds も数えているため、これだけで足りる
  const isFilterActive = activeFilterCount > 0;

  return (
    <div className="sauna-search-box">
      <div className="search-row">
        <div className="search-input-wrapper">
          {/* placeholder は支援技術で読み上げられないため、視覚的に隠したラベルを持たせる */}
          <label className="sr-only" htmlFor="visit-list-search">
            サウナ名・エリア・タグで検索
          </label>
          <span className="search-icon" aria-hidden="true"><Search size={15} /></span>
          <input
            id="visit-list-search"
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
        {/*
          対応する tabpanel が無いため tablist ではなくトグルボタン群として公開する。
          押下状態は aria-pressed で伝える。
        */}
        <div className="status-tabs" role="group" aria-label="ステータスフィルター">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.status === value}
              className={`status-tab ${filters.status === value ? "is-active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, status: value }))}
            >
              {label}
            </button>
          ))}
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
