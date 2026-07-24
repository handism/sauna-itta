import { memo } from "react";
import { List, LayoutGrid, SlidersHorizontal } from "lucide-react";

export type ViewMode = "card" | "compact";

interface VisitListHeaderProps {
  filteredCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isFilterActive: boolean;
  onOpenFilters: () => void;
  isMobile?: boolean;
}

function VisitListHeaderComponent({
  filteredCount,
  viewMode,
  onViewModeChange,
  isFilterActive,
  onOpenFilters,
  isMobile,
}: VisitListHeaderProps) {
  return (
    <div className="sauna-list-header">
      <h2 className="panel-title">
        訪れたサウナ <span className="panel-title-count">({filteredCount}件)</span>
      </h2>

      <div className="sauna-header-actions">
        <div className="view-mode-toggle" role="group" aria-label="表示形式切り替え">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === "compact" ? "is-active" : ""}`}
            onClick={() => onViewModeChange("compact")}
            title="リスト（コンパクト）表示"
            aria-label="リスト表示"
          >
            <List size={15} /> リスト
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === "card" ? "is-active" : ""}`}
            onClick={() => onViewModeChange("card")}
            title="カード表示"
            aria-label="カード表示"
          >
            <LayoutGrid size={15} /> カード
          </button>
        </div>
        {!isMobile && (
          <button
            type="button"
            className={`filters-open-btn ${isFilterActive ? "is-active" : ""}`}
            onClick={onOpenFilters}
            title="詳細フィルター（並び順・最低評価・マップ内表示）"
          >
            <SlidersHorizontal size={16} /> {isFilterActive && <span className="filters-badge" />}
          </button>
        )}
      </div>
    </div>
  );
}

export const VisitListHeader = memo(VisitListHeaderComponent);
