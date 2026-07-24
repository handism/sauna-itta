interface VisitListEmptyProps {
  hasVisits: boolean;
  filterByBounds?: boolean;
  isFilterActive: boolean;
  onClearFilters: () => void;
}

export function VisitListEmpty({
  hasVisits,
  filterByBounds,
  isFilterActive,
  onClearFilters,
}: VisitListEmptyProps) {
  if (!hasVisits) {
    return (
      <p className="empty-state">
        まだ投稿がありません。
        <br />
        新しいピンを立ててみましょう！
      </p>
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
