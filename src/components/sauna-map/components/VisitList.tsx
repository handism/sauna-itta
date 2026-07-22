import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";
import { QuickFilterChips } from "./QuickFilterChips";

interface VisitListProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  onOpenFilters: () => void;
  onEdit: (visit: SaunaVisit) => void;
  selectedId?: string | null;
  onSelectVisit?: (visit: SaunaVisit) => void;
  onDeselectVisit?: () => void;
  hoveredId?: string | null;
  onHoverVisit?: (id: string | null) => void;
}

export function VisitList({
  visits,
  filteredVisits,
  filters,
  setFilters,
  isFilterActive,
  onOpenFilters,
  onEdit,
  selectedId,
  onSelectVisit,
  onDeselectVisit,
  hoveredId,
  onHoverVisit,
}: VisitListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeId = selectedId || hoveredId;

  useEffect(() => {
    if (!activeId || !containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(
      `[data-visit-id="${activeId}"]`
    );
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeId]);

  return (
    <div className="sauna-list" ref={containerRef}>
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

        <QuickFilterChips filters={filters} setFilters={setFilters} />

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
          const isHovered = visit.id === hoveredId;
          const isSelected = visit.id === selectedId;
          return (
            <div
              key={visit.id}
              data-visit-id={visit.id}
              className={`sauna-card ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectVisit?.(visit)}
              onMouseEnter={() => onHoverVisit?.(visit.id)}
              onMouseLeave={() => onHoverVisit?.(null)}
            >
              <div className="sauna-card-header">
                <h3 className="sauna-card-title">
                  {visit.name}
                  {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
                </h3>
                <div className="sauna-card-actions">
                  {isSelected && onDeselectVisit && (
                    <button
                      type="button"
                      className="sauna-card-deselect-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeselectVisit();
                      }}
                      title="選択を解除"
                      aria-label="選択を解除"
                    >
                      ✕ 解除
                    </button>
                  )}
                  <button
                    type="button"
                    className="sauna-card-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(visit);
                    }}
                    title="記録を編集"
                  >
                    ✏️ 編集
                  </button>
                </div>
              </div>
              {visit.area && <div className="sauna-card-area">{visit.area}</div>}
              <RatingStars rating={visit.rating ?? 0} className="sauna-card-rating" />
              {visit.tags && visit.tags.length > 0 && (
                <div className="sauna-tag-list">
                  {visit.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="sauna-tag sauna-tag-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters((prev) => ({ ...prev, search: tag }));
                      }}
                      title={`タグ「${tag}」で絞り込み`}
                    >
                      {tag}
                    </button>
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

