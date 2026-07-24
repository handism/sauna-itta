"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useMapViewState } from "../hooks/useMapViewState";
import { useSaunaUI } from "./UIContext";
import { useSaunaVisitsData } from "./VisitsDataContext";
import { useSaunaEditor } from "./EditorContext";
import { SheetSnapPosition, SaunaVisit, LatLng, MobileTab } from "../types";

interface MapStateContextType {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeMapTarget: LatLng | null;
  snapPosition: SheetSnapPosition;
  setSnapPosition: (pos: SheetSnapPosition) => void;
  handleZoomChange: (zoom: number) => void;
  enableClustering: boolean;
  toggleClustering: () => void;
  showBadges: boolean;
  selectedVisit: SaunaVisit | null;
  handleSelectVisit: (visit: SaunaVisit) => void;
  handleDeselectVisit: () => void;
  handleListEdit: (visit: SaunaVisit) => void;
  handleListSelectVisit: (visit: SaunaVisit) => void;
  handleSelectMobileTab: (tab: MobileTab) => void;
}

const MapStateContext = createContext<MapStateContextType | null>(null);

export function MapStateProvider({ children }: { children: ReactNode }) {
  const { isMobile } = useSaunaUI();
  const { visits } = useSaunaVisitsData();
  const { startEditing, cancelEditing, startCreate } = useSaunaEditor();

  const {
    hoveredId,
    setHoveredId,
    selectedId,
    setSelectedId,
    mapTargetOverride,
    snapPosition,
    setSnapPosition,
    handleZoomChange,
    enableClustering,
    toggleClustering,
    showBadges,
    selectedVisit,
    handleSelectVisit,
    handleDeselectVisit,
  } = useMapViewState(visits, isMobile);

  const activeMapTarget = mapTargetOverride;

  const handleListEdit = useCallback(
    (visit: SaunaVisit) => {
      setSelectedId(visit.id);
      startEditing(visit);
      if (isMobile) setSnapPosition("full");
    },
    [setSelectedId, startEditing, isMobile, setSnapPosition],
  );

  const handleListSelectVisit = useCallback(
    (visit: SaunaVisit) => {
      handleSelectVisit(visit);
      if (isMobile) setSnapPosition("half");
    },
    [handleSelectVisit, isMobile, setSnapPosition],
  );

  const handleSelectMobileTab = useCallback(
    (tab: MobileTab) => {
      if (tab === "map") {
        cancelEditing(true);
        setSnapPosition("min");
      } else if (tab === "list") {
        cancelEditing(true);
        setSnapPosition("half");
      } else if (tab === "add") {
        startCreate();
        setSnapPosition("full");
      }
    },
    [cancelEditing, startCreate, setSnapPosition],
  );

  const value = useMemo(
    () => ({
      hoveredId,
      setHoveredId,
      selectedId,
      setSelectedId,
      activeMapTarget,
      snapPosition,
      setSnapPosition,
      handleZoomChange,
      enableClustering,
      toggleClustering,
      showBadges,
      selectedVisit: selectedVisit ?? null,
      handleSelectVisit,
      handleDeselectVisit,
      handleListEdit,
      handleListSelectVisit,
      handleSelectMobileTab,
    }),
    [
      hoveredId,
      setHoveredId,
      selectedId,
      setSelectedId,
      activeMapTarget,
      snapPosition,
      setSnapPosition,
      handleZoomChange,
      enableClustering,
      toggleClustering,
      showBadges,
      selectedVisit,
      handleSelectVisit,
      handleDeselectVisit,
      handleListEdit,
      handleListSelectVisit,
      handleSelectMobileTab,
    ],
  );

  return <MapStateContext.Provider value={value}>{children}</MapStateContext.Provider>;
}

export function useSaunaMapState() {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error("useSaunaMapState must be used within a MapStateProvider");
  }
  return context;
}
