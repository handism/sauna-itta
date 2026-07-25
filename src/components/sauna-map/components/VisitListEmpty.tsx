import { MapPinPlus } from "lucide-react";

interface VisitListEmptyProps {
  hasVisits: boolean;
  filterByBounds?: boolean;
  isFilterActive: boolean;
  onClearFilters: () => void;
  onStartNewVisit?: () => void;
}

export function VisitListEmpty({
  hasVisits,
  filterByBounds,
  isFilterActive,
  onClearFilters,
  onStartNewVisit,
}: VisitListEmptyProps) {
  if (!hasVisits) {
    return (
      <div className="empty-state empty-state--first-run">
        <span className="empty-state-icon" aria-hidden="true">
          <MapPinPlus size={28} />
        </span>
        <p className="empty-state-title">まだ記録がありません</p>
        <p className="empty-state-body">
          行ったサウナも、行きたいサウナも。
          <br />
          最初の 1 件を地図に残しましょう。
        </p>
        {onStartNewVisit && (
          <button
            type="button"
            className="btn btn-primary empty-state-cta"
            onClick={onStartNewVisit}
          >
            <MapPinPlus size={16} />
            <span>最初のサウナを登録する</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="empty-state">
      <p>
        {filterByBounds
          ? "現在の地図エリア内に該当するサウナが見つかりませんでした。地図をスクロールするかフィルターを解除してください。"
          : "条件に合うサウナが見つかりませんでした。"}
      </p>
      {isFilterActive && (
        <button
          type="button"
          className="btn btn-ghost reset-filter-btn"
          onClick={onClearFilters}
        >
          フィルターをクリア
        </button>
      )}
    </div>
  );
}
