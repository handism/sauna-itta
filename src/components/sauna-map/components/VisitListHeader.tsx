import { memo } from "react";
import { List, LayoutGrid } from "lucide-react";

export type ViewMode = "card" | "compact";

interface VisitListHeaderProps {
  filteredCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function VisitListHeaderComponent({
  filteredCount,
  viewMode,
  onViewModeChange,
}: VisitListHeaderProps) {
  return (
    <div className="sauna-list-header">
      <h2 className="panel-title">
        サウナ一覧 <span className="panel-title-count">({filteredCount}件)</span>
      </h2>

      {/*
        検索・フィルター操作で件数が変わったことを支援技術へ伝える。
        見出し内の数字だけを読み上げても文脈が伝わらないため、文として持つ。
      */}
      <p className="sr-only" role="status" aria-live="polite">
        {filteredCount}件のサウナを表示中
      </p>

      <div className="sauna-header-actions">
        <div className="view-mode-toggle" role="group" aria-label="表示形式切り替え">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === "compact" ? "is-active" : ""}`}
            onClick={() => onViewModeChange("compact")}
            title="リスト（コンパクト）表示"
            aria-label="リスト表示に切り替え"
            aria-pressed={viewMode === "compact"}
          >
            <List size={15} aria-hidden="true" /> リスト
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === "card" ? "is-active" : ""}`}
            onClick={() => onViewModeChange("card")}
            title="カード表示"
            aria-label="カード表示に切り替え"
            aria-pressed={viewMode === "card"}
          >
            <LayoutGrid size={15} aria-hidden="true" /> カード
          </button>
        </div>
      </div>
    </div>
  );
}

export const VisitListHeader = memo(VisitListHeaderComponent);
