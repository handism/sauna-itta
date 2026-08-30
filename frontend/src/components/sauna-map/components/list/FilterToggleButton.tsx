import { memo } from "react";
import { SlidersHorizontal } from "lucide-react";

interface FilterToggleButtonProps {
  isFilterPanelOpen: boolean;
  isFilterActive: boolean;
  toggleFilterPanel: () => void;
}

function FilterToggleButtonComponent({
  isFilterPanelOpen,
  isFilterActive,
  toggleFilterPanel,
}: FilterToggleButtonProps) {
  return (
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
  );
}

export const FilterToggleButton = memo(FilterToggleButtonComponent);
