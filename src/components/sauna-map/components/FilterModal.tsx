import { Dispatch, SetStateAction } from "react";
import { X, Map } from "lucide-react";
import { VisitFilters } from "../types";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { useSaunaUI, useSaunaVisitsData } from "../context";

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

function BoundsToggle({ filters, setFilters }: FilterComponentProps) {
  return (
    <div className="form-group">
      <label className="filters-label">表示エリア</label>
      <button
        type="button"
        className={`btn bounds-toggle-btn bounds-toggle-btn--full ${filters.filterByBounds ? "is-active" : ""}`}
        onClick={() =>
          setFilters((prev) => ({
            ...prev,
            filterByBounds: !prev.filterByBounds,
          }))
        }
      >
        <Map size={15} /> 地図の表示エリア内のみ表示
      </button>
    </div>
  );
}

export interface FilterModalViewProps {
  isOpen: boolean;
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onClearFilters: () => void;
  onClose: () => void;
}

export function FilterModalView({
  isOpen,
  filters,
  setFilters,
  isFilterActive,
  onClearFilters,
  onClose,
}: FilterModalViewProps) {
  const containerRef = useModalBehavior(isOpen, onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="filters-modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={containerRef}
        className="filters-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-modal-title"
        tabIndex={-1}
      >
        <div className="filters-modal-header">
          <h3 id="filters-modal-title">詳細フィルター</h3>
          <button
            type="button"
            className="filters-modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="filters-modal-body">
          <MinRatingSelect filters={filters} setFilters={setFilters} />
          <BoundsToggle filters={filters} setFilters={setFilters} />
        </div>

        <div className="filters-modal-footer">
          {isFilterActive && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClearFilters}
            >
              リセット
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilterModal(props: Partial<FilterModalViewProps>) {
  const ui = useSaunaUI();
  const visitsData = useSaunaVisitsData();

  return (
    <FilterModalView
      isOpen={props.isOpen ?? ui.isFilterModalOpen}
      filters={props.filters ?? visitsData.filters}
      setFilters={props.setFilters ?? visitsData.setFilters}
      isFilterActive={props.isFilterActive ?? visitsData.isFilterActive}
      onClearFilters={props.onClearFilters ?? visitsData.clearFilters}
      onClose={props.onClose ?? ui.closeFilterModal}
    />
  );
}
