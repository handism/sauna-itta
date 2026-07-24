import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { SaunaVisit, VisitFilters } from "../types";
import { ImageLightbox } from "./common";
import { VisitCompactItem } from "./VisitCompactItem";
import { VisitCardItem } from "./VisitCardItem";
import { VisitListHeader, ViewMode } from "./VisitListHeader";
import { VisitListSearch } from "./VisitListSearch";
import { VisitListEmpty } from "./VisitListEmpty";
import { useSaunaMap } from "../context/SaunaMapContext";

const STORAGE_KEY = "sauna_itta_view_mode";

interface VisitListProps {
  visits?: SaunaVisit[];
  filteredVisits?: SaunaVisit[];
  filters?: VisitFilters;
  setFilters?: Dispatch<SetStateAction<VisitFilters>>;
  isFilterActive?: boolean;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onOpenFilters?: () => void;
  onEdit?: (visit: SaunaVisit) => void;
  selectedId?: string | null;
  onSelectVisit?: (visit: SaunaVisit) => void;
  onDeselectVisit?: () => void;
  hoveredId?: string | null;
  onHoverVisit?: (id: string | null) => void;
  isMobile?: boolean;
}

export function VisitList(props: VisitListProps) {
  const context = useSaunaMap();

  const visits = props.visits ?? context.visits;
  const filteredVisits = props.filteredVisits ?? context.filteredVisits;
  const filters = props.filters ?? context.filters;
  const setFilters = props.setFilters ?? context.setFilters;
  const isFilterActive = props.isFilterActive ?? context.isFilterActive;
  const activeFilterCount = props.activeFilterCount ?? context.activeFilterCount;
  const onClearFilters = props.onClearFilters ?? context.clearFilters;
  const onOpenFilters = props.onOpenFilters ?? context.openFilterModal;
  const onEdit = props.onEdit ?? context.handleListEdit;
  const selectedId = props.selectedId ?? context.selectedId;
  const onSelectVisit = props.onSelectVisit ?? context.handleListSelectVisit;
  const onDeselectVisit = props.onDeselectVisit ?? context.handleDeselectVisit;
  const hoveredId = props.hoveredId ?? context.hoveredId;
  const onHoverVisit = props.onHoverVisit ?? context.setHoveredId;
  const isMobile = props.isMobile ?? context.isMobile;

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
