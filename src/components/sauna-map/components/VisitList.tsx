import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";
import { QuickFilterChips } from "./QuickFilterChips";

type ViewMode = "card" | "compact";
const STORAGE_KEY = "sauna_itta_view_mode";

interface VisitListProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  activeFilterCount?: number;
  onClearFilters?: () => void;
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
  activeFilterCount,
  onClearFilters,
  onOpenFilters,
  onEdit,
  selectedId,
  onSelectVisit,
  onDeselectVisit,
  hoveredId,
  onHoverVisit,
}: VisitListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "compact" || saved === "card") return saved;
    }
    return "compact";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(
      `[data-visit-id="${selectedId}"]`
    );
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  const statusCounts = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    const baseFiltered = visits.filter((v) => {
      if ((v.rating ?? 0) < filters.minRating) return false;
      if (filters.selectedTag && (!v.tags || !v.tags.includes(filters.selectedTag))) return false;
      if (filters.selectedArea && (!v.area || !v.area.includes(filters.selectedArea))) return false;
      if (filters.filterByBounds && filters.mapBounds) {
        const { northEast, southWest } = filters.mapBounds;
        const inLat =
          v.lat >= Math.min(southWest.lat, northEast.lat) &&
          v.lat <= Math.max(southWest.lat, northEast.lat);
        const minLng = Math.min(southWest.lng, northEast.lng);
        const maxLng = Math.max(southWest.lng, northEast.lng);
        if (!inLat || !(v.lng >= minLng && v.lng <= maxLng)) return false;
      }
      if (keyword) {
        const text = `${v.name} ${v.comment ?? ""} ${v.area ?? ""} ${(v.tags ?? []).join(" ")}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });

    return {
      all: baseFiltered.length,
      visited: baseFiltered.filter((v) => (v.status ?? "visited") === "visited").length,
      wishlist: baseFiltered.filter((v) => v.status === "wishlist").length,
    };
  }, [
    visits,
    filters.search,
    filters.minRating,
    filters.selectedTag,
    filters.selectedArea,
    filters.filterByBounds,
    filters.mapBounds,
  ]);

  return (
    <div className="sauna-list" ref={containerRef}>
      <div className="sauna-list-header">
        <div className="status-tabs" role="tablist" aria-label="ステータスフィルター">
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "all"}
            className={`status-tab ${filters.status === "all" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
          >
            すべて ({statusCounts.all})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "visited"}
            className={`status-tab ${filters.status === "visited" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "visited" }))}
          >
            行った ({statusCounts.visited})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === "wishlist"}
            className={`status-tab ${filters.status === "wishlist" ? "is-active" : ""}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "wishlist" }))}
          >
            イキタイ ({statusCounts.wishlist})
          </button>
        </div>

        <div className="sauna-header-actions">
          <div className="view-mode-toggle" role="group" aria-label="表示形式切り替え">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "compact" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("compact")}
              title="リスト（コンパクト）表示"
              aria-label="リスト表示"
            >
              ☰ リスト
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "card" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("card")}
              title="カード表示"
              aria-label="カード表示"
            >
              㗊 カード
            </button>
          </div>
          <button
            type="button"
            className={`filters-open-btn ${isFilterActive ? "is-active" : ""}`}
            onClick={onOpenFilters}
            title="詳細フィルター"
          >
            ⚙️ {isFilterActive && <span className="filters-badge" />}
          </button>
        </div>
      </div>

      <div className="sauna-search-box">
        <div className="sauna-search-tools-row">
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

          <button
            type="button"
            className={`bounds-toggle-btn ${filters.filterByBounds ? "is-active" : ""}`}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                filterByBounds: !prev.filterByBounds,
              }))
            }
            title="地図の表示エリア内にあるサウナのみを表示"
          >
            🗺️ マップ範囲内
          </button>

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

      {visits.length === 0 ? (
        <p className="empty-state">
          まだ投稿がありません。
          <br />
          新しいピンを立ててみましょう！
        </p>
      ) : filteredVisits.length === 0 ? (
        <div className="empty-state">
          <p>
            {filters.filterByBounds
              ? "現在の地図エリア内に該当するサウナが見つかりませんでした。地図をスクロールするかフィルターを解除してください。"
              : "条件に合うサウナが見つかりませんでした。"}
          </p>
          {isFilterActive && (
            <button
              type="button"
              className="btn btn-ghost reset-filter-btn"
              onClick={onClearFilters ?? (() => setFilters({ search: "", status: "all", minRating: 0, sort: "recent", filterByBounds: false, mapBounds: null }))}
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

          if (viewMode === "compact") {
            return (
              <div
                key={visit.id}
                data-visit-id={visit.id}
                className={`sauna-compact-item ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
                onMouseEnter={() => onHoverVisit?.(visit.id)}
                onMouseLeave={() => onHoverVisit?.(null)}
              >
                <div
                  className="sauna-compact-header"
                  onClick={() => {
                    if (isSelected) {
                      onDeselectVisit?.();
                    } else {
                      onSelectVisit?.(visit);
                    }
                  }}
                >
                  <div className="sauna-compact-main-info">
                    <span className={`sauna-compact-chevron ${isSelected ? "is-expanded" : ""}`}>
                      ▶
                    </span>
                    <h3 className="sauna-compact-title">
                      {visit.name}
                      {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
                    </h3>
                    {visit.area && <span className="sauna-compact-area">{visit.area}</span>}
                  </div>
                  <div className="sauna-compact-side-info">
                    <RatingStars rating={visit.rating ?? 0} className="sauna-compact-rating" />
                    <button
                      type="button"
                      className="sauna-card-edit-btn compact-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(visit);
                      }}
                      title="記録を編集"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="sauna-compact-body">
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
                    {visit.comment && <p className="sauna-card-comment">{visit.comment}</p>}
                    {sanitizeImageUrl(visit.image) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sanitizeImageUrl(visit.image)} className="sauna-img-preview" alt="" />
                    )}
                    <div className="sauna-card-meta">
                      <span>日付: {visit.date}</span>
                      {visitCount > 1 && <span>訪問 {visitCount}回目</span>}
                    </div>
                    <div className="sauna-compact-footer-actions">
                      <a
                        href={getDirectionsUrl(visit.lat, visit.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="route-link"
                      >
                        🧭 ここへ行く
                      </a>
                      {onDeselectVisit && (
                        <button
                          type="button"
                          className="sauna-card-deselect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselectVisit();
                          }}
                        >
                          ✕ 解除
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

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

