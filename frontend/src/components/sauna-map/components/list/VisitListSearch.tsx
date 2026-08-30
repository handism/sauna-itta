import { Dispatch, SetStateAction, memo } from "react";
import { SaunaVisit, VisitFilters } from "../../types";
import { QuickFilterChips } from "./QuickFilterChips";
import { SortSelect } from "./SortSelect";
import { FilterPanel } from "./FilterPanel";
import { useSaunaUI } from "../../context";
import { SearchInput } from "./SearchInput";
import { StatusTabs } from "./StatusTabs";
import { FilterToggleButton } from "./FilterToggleButton";

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
      <SearchInput filters={filters} setFilters={setFilters} />

      <div className="controls-row">
        <StatusTabs filters={filters} setFilters={setFilters} />

        <div className="controls-actions">
          <SortSelect
            value={filters.sort}
            onChange={(newSort) =>
              setFilters((prev) => ({ ...prev, sort: newSort }))
            }
          />
          <FilterToggleButton
            isFilterPanelOpen={isFilterPanelOpen}
            isFilterActive={isFilterActive}
            toggleFilterPanel={toggleFilterPanel}
          />
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
