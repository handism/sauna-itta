import { Dispatch, SetStateAction, memo } from "react";
import { Search, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { QuickFilterChips } from "./QuickFilterChips";

interface VisitListSearchProps {
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  visits: SaunaVisit[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

function VisitListSearchComponent({
  filters,
  setFilters,
  visits,
  activeFilterCount,
  onClearFilters,
}: VisitListSearchProps) {
  return (
    <div className="sauna-search-box">
      <div className="search-row">
        <div className="search-input-wrapper">
          <span className="search-icon"><Search size={15} /></span>
          <input
            type="text"
            className="input search-input"
            placeholder="サウナ名・エリア・タグで即検索..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              aria-label="検索のクリア"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="controls-row">
        <div className="status-tabs" role="tablist" aria-label="ステータスフィルター">
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "all"}
            className={`status-tab ${filters.status === "all" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
          >
            すべて
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "visited"}
            className={`status-tab ${filters.status === "visited" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "visited" }))}
          >
            行った
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "wishlist"}
            className={`status-tab ${filters.status === "wishlist" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "wishlist" }))}
          >
            イキタイ
          </button>
        </div>
        <select
          className="quick-sort-select"
          aria-label="並び順"
          title="並び順"
          value={filters.sort}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort: e.target.value as VisitFilters["sort"] }))
          }
        >
          <option value="recent">📅 新しい順</option>
          <option value="oldest">📅 古い順</option>
          <option value="ratingDesc">⭐ 評価が高い順</option>
          <option value="ratingAsc">⭐ 評価が低い順</option>
          <option value="visitCountDesc">🔥 訪問回数が多い順</option>
          <option value="nameAsc">🔤 名前順 (あ〜ん)</option>
        </select>
      </div>

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
