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
import { useVisitsCRUD } from "./VisitsCRUDContext";
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
  handleEditVisit: (visit: SaunaVisit) => void;
  handleCancelEditing: (completed?: boolean) => void;
  handleListSelectVisit: (visit: SaunaVisit) => void;
  handleSelectMobileTab: (tab: MobileTab) => void;
}

const MapStateContext = createContext<MapStateContextType | null>(null);

export function MapStateProvider({ children }: { children: ReactNode }) {
  const { isMobile } = useSaunaUI();
  const { visits } = useVisitsCRUD();
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

  // 編集の開始／終了はモバイルのシート位置と連動するため、呼び出し側で個別に
  // setSnapPosition せずここへ集約する（リスト・マーカー・ピンヒントで共通）
  const handleEditVisit = useCallback(
    (visit: SaunaVisit) => {
      setSelectedId(visit.id);
      startEditing(visit);
      if (isMobile) setSnapPosition("full");
    },
    [setSelectedId, startEditing, isMobile, setSnapPosition],
  );

  const handleCancelEditing = useCallback(
    (completed = false) => {
      cancelEditing(completed);
      if (isMobile) setSnapPosition("min");
    },
    [cancelEditing, isMobile, setSnapPosition],
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
      handleEditVisit,
      handleCancelEditing,
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
      handleEditVisit,
      handleCancelEditing,
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
