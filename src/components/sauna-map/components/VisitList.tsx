import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { ImageLightbox } from "./common";
import { useImageLightbox } from "../hooks/useImageLightbox";
import { VisitCompactItem } from "./VisitCompactItem";
import { VisitCardItem } from "./VisitCardItem";
import { VisitListHeader, ViewMode } from "./VisitListHeader";
import { VisitListSearch } from "./VisitListSearch";
import { VisitListEmpty } from "./VisitListEmpty";
import { useSaunaUI, useSaunaVisitsData, useSaunaMapState } from "../context";

const STORAGE_KEY = "sauna_itta_view_mode";

export interface VisitListViewProps {
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: VisitFilters;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onEdit: (visit: SaunaVisit) => void;
  selectedId: string | null;
  onSelectVisit: (visit: SaunaVisit) => void;
  onDeselectVisit: () => void;
  hoveredId: string | null;
  onHoverVisit: (id: string | null) => void;
  isMobile: boolean;
}

export function VisitListView({
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
}: VisitListViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
      <VisitListHeader
        filteredCount={filteredVisits.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isFilterActive={isFilterActive}
        onOpenFilters={onOpenFilters}
        isMobile={isMobile}
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
        />
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

      <ImageLightbox src={lightboxSrc} onClose={closeImage} />
    </div>
  );
}

export function VisitList(props: Partial<VisitListViewProps>) {
  const ui = useSaunaUI();
  const visitsData = useSaunaVisitsData();
  const mapState = useSaunaMapState();

  return (
    <VisitListView
      visits={props.visits ?? visitsData.visits}
      filteredVisits={props.filteredVisits ?? visitsData.filteredVisits}
      filters={props.filters ?? visitsData.filters}
      setFilters={props.setFilters ?? visitsData.setFilters}
      isFilterActive={props.isFilterActive ?? visitsData.isFilterActive}
      activeFilterCount={props.activeFilterCount ?? visitsData.activeFilterCount}
      onClearFilters={props.onClearFilters ?? visitsData.clearFilters}
      onOpenFilters={props.onOpenFilters ?? ui.openFilterModal}
      onEdit={props.onEdit ?? mapState.handleListEdit}
      selectedId={props.selectedId ?? mapState.selectedId}
      onSelectVisit={props.onSelectVisit ?? mapState.handleListSelectVisit}
      onDeselectVisit={props.onDeselectVisit ?? mapState.handleDeselectVisit}
      hoveredId={props.hoveredId ?? mapState.hoveredId}
      onHoverVisit={props.onHoverVisit ?? mapState.setHoveredId}
      isMobile={props.isMobile ?? ui.isMobile}
    />
  );
}
