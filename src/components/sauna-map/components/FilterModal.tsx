import { Dispatch, SetStateAction } from "react";
import { VisitFilters } from "../types";

interface FilterComponentProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
}

function MinRatingSelect({ filters, setFilters }: FilterComponentProps) {
  return (
    <div className="form-group">
      <label className="filters-label">最低満足度</label>
      <select
        className="input select-input"
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
  );
}

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
          <h3 id="filters-modal-title">詳細フィルター</h3>
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
          <MinRatingSelect filters={filters} setFilters={setFilters} />
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
