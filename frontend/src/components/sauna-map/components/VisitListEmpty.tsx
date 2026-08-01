import { MapPinPlus, SearchX } from "lucide-react";

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

  // 初回起動時と同じ構造（アイコン＋見出し＋説明＋操作）に揃える
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        <SearchX size={28} />
      </span>
      <p className="empty-state-title">該当するサウナがありません</p>
      <p className="empty-state-body">
        {filterByBounds
          ? "現在の地図エリア内には見つかりませんでした。地図を動かすか、絞り込みを解除してください。"
          : "条件を変えるか、絞り込みを解除してみてください。"}
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
