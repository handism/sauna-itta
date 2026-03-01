import { Dispatch, SetStateAction } from "react";
import { VisitFilters } from "../types";

interface FilterModalProps {
  isOpen: boolean;
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onClearFilters: () => void;
  onClose: () => void;
}

export function FilterModal({
  isOpen,
  filters,
  setFilters,
  isFilterActive,
  onClearFilters,
  onClose,
}: FilterModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="filters-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="filters-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="filters-modal-title"
      >
        <div className="filters-modal-header">
          <h3 id="filters-modal-title">フィルター</h3>
          <button
            type="button"
            className="filters-modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="filters">
          <input
            className="input"
            placeholder="キーワード検索"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <div className="form-group">
            <label className="filters-label">ステータス</label>
            <select
              className="input"
              style={{ width: "100%" }}
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as VisitFilters["status"],
                }))
              }
            >
              <option value="all">すべて</option>
              <option value="visited">行った</option>
              <option value="wishlist">行きたい</option>
            </select>
          </div>
          <div className="form-group">
            <label className="filters-label">並び順</label>
            <select
              className="input"
              style={{ width: "100%" }}
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as VisitFilters["sort"],
                }))
              }
            >
              <option value="recent">新しい順</option>
              <option value="oldest">古い順</option>
              <option value="ratingDesc">満足度が高い順</option>
              <option value="ratingAsc">満足度が低い順</option>
            </select>
          </div>
          <div className="form-group">
            <label className="filters-label">最低満足度</label>
            <select
              className="input"
              style={{ width: "100%" }}
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
          {isFilterActive && (
            <button
              type="button"
              className="btn btn-ghost filters-reset"
              onClick={() => {
                onClearFilters();
                onClose();
              }}
            >
              フィルター解除
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            反映して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
