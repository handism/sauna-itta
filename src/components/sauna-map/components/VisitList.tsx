import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { ImageLightbox } from "./common";
import { useImageLightbox } from "../hooks/useImageLightbox";
import { VisitCompactItem } from "./VisitCompactItem";
import { VisitCardItem } from "./VisitCardItem";
import { VisitListHeader, ViewMode } from "./VisitListHeader";
import { VisitListSearch } from "./VisitListSearch";
import { VisitListEmpty } from "./VisitListEmpty";
import { getScrollBehavior } from "../utils/motion";
import {
  useVisitsCRUD,
  useVisitFiltersContext,
  useSaunaMapState,
  useSaunaEditor,
} from "../context";

const STORAGE_KEY = "sauna_itta_view_mode";

/**
 * 一度に描画する件数。記録が増えても初期表示が重くならないよう、
 * リスト末尾が視界に入るたびに CHUNK_SIZE ずつ描画を伸ばす。
 */
export const INITIAL_RENDER_COUNT = 40;
export const CHUNK_SIZE = 40;

export interface VisitListViewProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  onStartNewVisit: () => void;
  onEdit: (visit: SaunaVisit) => void;
  selectedId: string | null;
  onSelectVisit: (visit: SaunaVisit) => void;
  onDeselectVisit: () => void;
  hoveredId: string | null;
  onHoverVisit: (id: string | null) => void;
}

export function VisitListView({
  visits,
  filteredVisits,
  filters,
  setFilters,
  isFilterActive,
  activeFilterCount,
  onClearFilters,
  onStartNewVisit,
  onEdit,
  selectedId,
  onSelectVisit,
  onDeselectVisit,
  hoveredId,
  onHoverVisit,
}: VisitListViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // ユーザー操作で伸ばした分の追加件数。実際の描画件数はレンダー中に導出する
  const [extraCount, setExtraCount] = useState(0);
  const { lightboxSrc, openImage, closeImage } = useImageLightbox();
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

  // 選択された記録が初期ウィンドウの外にある場合はそこまで描画を伸ばす。
  // フィルター変更時に extraCount は保持されるが、件数が減れば hasMore が false になり
  // 番兵も消えるため、描画数は常に filteredVisits の範囲に収まる。
  const selectedIndex = selectedId
    ? filteredVisits.findIndex((v) => v.id === selectedId)
    : -1;
  const visibleCount = Math.max(
    INITIAL_RENDER_COUNT + extraCount,
    selectedIndex + 1
  );
  const renderedVisits = filteredVisits.slice(0, visibleCount);
  const hasMore = filteredVisits.length > renderedVisits.length;

  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(
      `[data-visit-id="${selectedId}"]`
    );
    // jsdom など scrollIntoView 未実装の環境を考慮して optional call にする
    targetEl?.scrollIntoView?.({ behavior: getScrollBehavior(), block: "center" });
  }, [selectedId, visibleCount]);

  // 末尾の番兵が見えたら次のチャンクを描画する
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setExtraCount((prev) => prev + CHUNK_SIZE);
        }
      },
      // スクロールコンテナは .sidebar-content / .bottom-sheet-content 側なので
      // root は指定せずビューポート基準で監視する
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [visibleCount, filteredVisits.length]);

  return (
    <div className="sauna-list" ref={containerRef}>
      <VisitListHeader
        filteredCount={filteredVisits.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <VisitListSearch
        filters={filters}
        setFilters={setFilters}
        visits={visits}
        activeFilterCount={activeFilterCount}
        onClearFilters={onClearFilters}
      />

      {filteredVisits.length === 0 ? (
        <VisitListEmpty
          hasVisits={visits.length > 0}
          filterByBounds={filters.filterByBounds}
          isFilterActive={isFilterActive}
          onClearFilters={onClearFilters}
          onStartNewVisit={onStartNewVisit}
        />
      ) : (
        renderedVisits.map((visit) => {
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
                onOpenImage={openImage}
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
              onOpenImage={openImage}
            />
          );
        })
      )}

      {hasMore && (
        <div className="list-load-more" ref={sentinelRef}>
          <button
            type="button"
            className="btn btn-ghost list-load-more-btn"
            onClick={() => setExtraCount((prev) => prev + CHUNK_SIZE)}
          >
            さらに表示（残り {filteredVisits.length - renderedVisits.length} 件）
          </button>
        </div>
      )}

      <ImageLightbox src={lightboxSrc} onClose={closeImage} />
    </div>
  );
}

export function VisitList(props: Partial<VisitListViewProps>) {
  const crud = useVisitsCRUD();
  const filtersData = useVisitFiltersContext();
  const mapState = useSaunaMapState();
  const editor = useSaunaEditor();

  return (
    <VisitListView
      visits={props.visits ?? crud.visits}
      filteredVisits={props.filteredVisits ?? filtersData.filteredVisits}
      filters={props.filters ?? filtersData.filters}
      setFilters={props.setFilters ?? filtersData.setFilters}
      isFilterActive={props.isFilterActive ?? filtersData.isFilterActive}
      activeFilterCount={props.activeFilterCount ?? filtersData.activeFilterCount}
      onClearFilters={props.onClearFilters ?? filtersData.clearFilters}
      onStartNewVisit={props.onStartNewVisit ?? editor.startNewVisit}
      onEdit={props.onEdit ?? mapState.handleEditVisit}
      selectedId={props.selectedId ?? mapState.selectedId}
      onSelectVisit={props.onSelectVisit ?? mapState.handleListSelectVisit}
      onDeselectVisit={props.onDeselectVisit ?? mapState.handleDeselectVisit}
      hoveredId={props.hoveredId ?? mapState.hoveredId}
      onHoverVisit={props.onHoverVisit ?? mapState.setHoveredId}
    />
  );
}
