import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { List, LayoutGrid, SlidersHorizontal, Search, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { ImageLightbox } from "./common";
import { QuickFilterChips } from "./QuickFilterChips";
import { VisitCompactItem } from "./VisitCompactItem";
import { VisitCardItem } from "./VisitCardItem";

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
  isMobile?: boolean;
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
  isMobile,
}: VisitListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
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

  return (
    <div className="sauna-list" ref={containerRef}>
      <div className="sauna-list-header">
        <h2 className="panel-title">
          訪れたサウナ <span className="panel-title-count">({filteredVisits.length}件)</span>
        </h2>

        <div className="sauna-header-actions">
          <div className="view-mode-toggle" role="group" aria-label="表示形式切り替え">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "compact" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("compact")}
              title="リスト（コンパクト）表示"
              aria-label="リスト表示"
            >
              <List size={15} /> リスト
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "card" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("card")}
              title="カード表示"
              aria-label="カード表示"
            >
              <LayoutGrid size={15} /> カード
            </button>
          </div>
          {!isMobile && (
            <button
              type="button"
              className={`filters-open-btn ${isFilterActive ? "is-active" : ""}`}
              onClick={onOpenFilters}
              title="詳細フィルター（並び順・最低評価・マップ内表示）"
            >
              <SlidersHorizontal size={16} /> {isFilterActive && <span className="filters-badge" />}
            </button>
          )}
        </div>
      </div>

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
          const isHovered = visit.id === hoveredId;
          const isSelected = visit.id === selectedId;

          if (viewMode === "compact") {
            return (
              <VisitCompactItem
                key={visit.id}
                visit={visit}
                isHovered={isHovered}
                isSelected={isSelected}
                onHoverVisit={onHoverVisit}
                onSelectVisit={onSelectVisit}
                onDeselectVisit={onDeselectVisit}
                onEdit={onEdit}
                setFilters={setFilters}
                onOpenImage={setLightboxSrc}
              />
            );
          }

          return (
            <VisitCardItem
              key={visit.id}
              visit={visit}
              isHovered={isHovered}
              isSelected={isSelected}
              onHoverVisit={onHoverVisit}
              onSelectVisit={onSelectVisit}
              onDeselectVisit={onDeselectVisit}
              onEdit={onEdit}
              setFilters={setFilters}
              onOpenImage={setLightboxSrc}
            />
          );
        })
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
