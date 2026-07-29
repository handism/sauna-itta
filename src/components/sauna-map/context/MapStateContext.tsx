"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useMapViewState } from "../hooks/useMapViewState";
import { useSaunaViewport } from "./UIContext";
import { useVisitsCRUD } from "./VisitsCRUDContext";
import { useSaunaEditorActions } from "./EditorContext";
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
  /** 編集を閉じ終えたときのシート位置の後始末。保存完了時に VisitForm から呼ばれる */
  handleEditingFinished: () => void;
  handleListSelectVisit: (visit: SaunaVisit) => void;
  handleSelectMobileTab: (tab: MobileTab) => void;
}

const MapStateContext = createContext<MapStateContextType | null>(null);

export function MapStateProvider({ children }: { children: ReactNode }) {
  const { isMobile } = useSaunaViewport();
  const { visits } = useVisitsCRUD();
  // 必要なのは操作関数だけ。useSaunaEditor()（state + actions）を購読すると
  // サイドバーの開閉や場所選択のたびに Provider ごと再レンダリングされる
  const { startEditing, cancelEditing, startCreate } = useSaunaEditorActions();

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

  // 保存でもキャンセルでも、編集を閉じたらシートは最小化して地図を見せる
  const handleEditingFinished = useCallback(() => {
    if (isMobile) setSnapPosition("min");
  }, [isMobile, setSnapPosition]);

  const handleCancelEditing = useCallback(
    (completed = false) => {
      cancelEditing(completed);
      handleEditingFinished();
    },
    [cancelEditing, handleEditingFinished],
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
      handleEditingFinished,
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
      handleEditingFinished,
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
