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

export interface MapStateValueType {
  hoveredId: string | null;
  selectedId: string | null;
  activeMapTarget: LatLng | null;
  snapPosition: SheetSnapPosition;
  enableClustering: boolean;
  showBadges: boolean;
  selectedVisit: SaunaVisit | null;
}

export interface MapStateActionsType {
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setSnapPosition: (pos: SheetSnapPosition) => void;
  handleZoomChange: (zoom: number) => void;
  toggleClustering: () => void;
  handleSelectVisit: (visit: SaunaVisit) => void;
  handleDeselectVisit: () => void;
  handleEditVisit: (visit: SaunaVisit) => void;
  handleCancelEditing: (completed?: boolean) => void;
  /** 編集を閉じ終えたときのシート位置の後始末。保存完了時に VisitForm から呼ばれる */
  handleEditingFinished: () => void;
  handleListSelectVisit: (visit: SaunaVisit) => void;
  handleSelectMobileTab: (tab: MobileTab) => void;
}

export type MapStateContextType = MapStateValueType & MapStateActionsType;

const MapStateValueContext = createContext<MapStateValueType | null>(null);
const MapStateActionsContext = createContext<MapStateActionsType | null>(null);

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

  const stateValue = useMemo<MapStateValueType>(
    () => ({
      hoveredId,
      selectedId,
      activeMapTarget,
      snapPosition,
      enableClustering,
      showBadges,
      selectedVisit: selectedVisit ?? null,
    }),
    [
      hoveredId,
      selectedId,
      activeMapTarget,
      snapPosition,
      enableClustering,
      showBadges,
      selectedVisit,
    ],
  );

  const actionsValue = useMemo<MapStateActionsType>(
    () => ({
      setHoveredId,
      setSelectedId,
      setSnapPosition,
      handleZoomChange,
      toggleClustering,
      handleSelectVisit,
      handleDeselectVisit,
      handleEditVisit,
      handleCancelEditing,
      handleEditingFinished,
      handleListSelectVisit,
      handleSelectMobileTab,
    }),
    [
      setHoveredId,
      setSelectedId,
      setSnapPosition,
      handleZoomChange,
      toggleClustering,
      handleSelectVisit,
      handleDeselectVisit,
      handleEditVisit,
      handleCancelEditing,
      handleEditingFinished,
      handleListSelectVisit,
      handleSelectMobileTab,
    ],
  );

  return (
    <MapStateValueContext.Provider value={stateValue}>
      <MapStateActionsContext.Provider value={actionsValue}>
        {children}
      </MapStateActionsContext.Provider>
    </MapStateValueContext.Provider>
  );
}

export function useSaunaMapStateValue() {
  const context = useContext(MapStateValueContext);
  if (!context) {
    throw new Error("useSaunaMapStateValue must be used within a MapStateProvider");
  }
  return context;
}

export function useSaunaMapActions() {
  const context = useContext(MapStateActionsContext);
  if (!context) {
    throw new Error("useSaunaMapActions must be used within a MapStateProvider");
  }
  return context;
}

export function useSaunaMapState(): MapStateContextType {
  const state = useSaunaMapStateValue();
  const actions = useSaunaMapActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

