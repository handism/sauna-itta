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
import { readStorage, writeStorage } from "../utils/storage";
import {
  useVisitsCRUD,
  useVisitFiltersContext,
  useSaunaMapState,
  useSaunaEditorActions,
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
    const saved = readStorage(STORAGE_KEY);
    return saved === "compact" || saved === "card" ? saved : "compact";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    writeStorage(STORAGE_KEY, mode);
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

/**
 * Context から値を集めて View へ渡すだけのコンテナ。
 * テストは props を直接渡せる `VisitListView` を描画すること。
 */
export function VisitList() {
  const { visits } = useVisitsCRUD();
  const { filteredVisits, filters, setFilters, isFilterActive, activeFilterCount, clearFilters } =
    useVisitFiltersContext();
  const { selectedId, hoveredId, setHoveredId, handleEditVisit, handleListSelectVisit, handleDeselectVisit } =
    useSaunaMapState();
  // 一覧が要るのは操作関数だけ。編集状態を購読すると、サイドバーの開閉で
  // 一覧全体が再レンダリング対象になる
  const { startNewVisit } = useSaunaEditorActions();

  return (
    <VisitListView
      visits={visits}
      filteredVisits={filteredVisits}
      filters={filters}
      setFilters={setFilters}
      isFilterActive={isFilterActive}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
      onStartNewVisit={startNewVisit}
      onEdit={handleEditVisit}
      selectedId={selectedId}
      onSelectVisit={handleListSelectVisit}
      onDeselectVisit={handleDeselectVisit}
      hoveredId={hoveredId}
      onHoverVisit={setHoveredId}
    />
  );
}
