import { Dispatch, SetStateAction } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";

interface VisitListProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onOpenFilters: () => void;
  onEdit: (visit: SaunaVisit) => void;
}

export function VisitList({
  visits,
  filteredVisits,
  filters,
  setFilters,
  isFilterActive,
  onOpenFilters,
  onEdit,
}: VisitListProps) {
  return (
    <div className="sauna-list">
      <div className="sauna-list-header">
        <h2 className="panel-title">
          訪れたサウナ ({filteredVisits.length}/{visits.length})
        </h2>
        <button
          type="button"
          className={`filters-open-btn ${isFilterActive ? "is-active" : ""}`}
          onClick={onOpenFilters}
          title="詳細フィルター"
        >
          ⚙️ フィルター {isFilterActive && "●"}
        </button>
      </div>

      <div className="sauna-search-box">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
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
              ✕
            </button>
          )}
        </div>

        <div className="sauna-quick-controls">
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
            value={filters.sort}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sort: e.target.value as VisitFilters["sort"],
              }))
            }
            aria-label="並び順"
          >
            <option value="recent">📅 新しい順</option>
            <option value="oldest">📅 古い順</option>
            <option value="ratingDesc">⭐ 満足度が高い順</option>
            <option value="ratingAsc">⭐ 満足度が低い順</option>
          </select>
        </div>
      </div>

      {visits.length === 0 ? (
        <p className="empty-state">
          まだ投稿がありません。
          <br />
          新しいピンを立ててみましょう！
        </p>
      ) : filteredVisits.length === 0 ? (
        <div className="empty-state">
          <p>条件に合うサウナが見つかりませんでした。</p>
          {isFilterActive && (
            <button
              type="button"
              className="btn btn-ghost reset-filter-btn"
              onClick={() =>
                setFilters({ search: "", status: "all", minRating: 0, sort: "recent" })
              }
            >
              フィルターをクリア
            </button>
          )}
        </div>
      ) : (
        filteredVisits.map((visit) => {
          const visitCount = getVisitCount(visit);
          return (
            <div key={visit.id} className="sauna-card" onClick={() => onEdit(visit)}>
              <h3 className="sauna-card-title">
                {visit.name}
                {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
              </h3>
              {visit.area && <div className="sauna-card-area">{visit.area}</div>}
              <RatingStars rating={visit.rating ?? 0} className="sauna-card-rating" />
              {visit.tags && visit.tags.length > 0 && (
                <div className="sauna-tag-list">
                  {visit.tags.map((tag) => (
                    <span key={tag} className="sauna-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="sauna-card-comment">{visit.comment}</p>
              {sanitizeImageUrl(visit.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sanitizeImageUrl(visit.image)} className="sauna-img-preview" alt="" />
              )}
              <div className="sauna-card-meta">
                <span>日付: {visit.date}</span>
                {visitCount > 1 && <span>訪問 {visitCount}回目</span>}
                <span>タップで編集</span>
              </div>
              <a
                href={getDirectionsUrl(visit.lat, visit.lng)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="route-link"
              >
                🧭 ここへ行く
              </a>
            </div>
          );
        })
      )}
    </div>
  );
}

