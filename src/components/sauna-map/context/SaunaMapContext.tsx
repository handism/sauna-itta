"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { UIProvider, useSaunaUI } from "./UIContext";
import { VisitsDataProvider, useSaunaVisitsData } from "./VisitsDataContext";
import { EditorProvider, useSaunaEditor } from "./EditorContext";
import { MapStateProvider, useSaunaMapState } from "./MapStateContext";
import { SaunaVisit } from "../types";

export function SaunaMapProvider({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <VisitsDataProvider>
        <EditorProvider>
          <MapStateProvider>{children}</MapStateProvider>
        </EditorProvider>
      </VisitsDataProvider>
    </UIProvider>
  );
}

/**
 * 後方互換性用統合フック
 * 各種専用フック（useSaunaUI, useSaunaVisitsData, useSaunaEditor, useSaunaMapState）の
 * 戻り値を束ねて従来の API インターフェースを提供します。
 */
export function useSaunaMap() {
  const ui = useSaunaUI();
  const visitsData = useSaunaVisitsData();
  const editor = useSaunaEditor();
  const mapState = useSaunaMapState();

  const startEditing = useCallback(
    (visit: SaunaVisit) => {
      mapState.setSelectedId(visit.id);
      editor.startEditing(visit);
      if (ui.isMobile) {
        mapState.setSnapPosition("full");
      }
    },
    [mapState, editor, ui.isMobile],
  );

  const cancelEditing = useCallback(
    (completed = false) => {
      editor.cancelEditing(completed);
      if (ui.isMobile) {
        mapState.setSnapPosition("min");
      }
    },
    [editor, ui.isMobile, mapState],
  );

  return useMemo(
    () => ({
      // Common / UI
      isMobile: ui.isMobile,
      mounted: ui.mounted,
      theme: ui.theme,
      toggleTheme: ui.toggleTheme,
      isShareViewOpen: ui.isShareViewOpen,
      isMobileMenuOpen: ui.isMobileMenuOpen,
      isFilterModalOpen: ui.isFilterModalOpen,
      isDeleteConfirmOpen: ui.isDeleteConfirmOpen,
      mobileMenuRef: ui.mobileMenuRef,
      openShareView: ui.openShareView,
      closeShareView: ui.closeShareView,
      toggleMobileMenu: ui.toggleMobileMenu,
      closeMobileMenu: ui.closeMobileMenu,
      openFilterModal: ui.openFilterModal,
      closeFilterModal: ui.closeFilterModal,
      openDeleteConfirm: ui.openDeleteConfirm,
      closeDeleteConfirm: ui.closeDeleteConfirm,
      toast: ui.toast,
      showToast: ui.showToast,
      clearToast: ui.clearToast,

      // Visits & Filter
      visits: visitsData.visits,
      filteredVisits: visitsData.filteredVisits,
      filters: visitsData.filters,
      setFilters: visitsData.setFilters,
      stats: visitsData.stats,
      isFilterActive: visitsData.isFilterActive,
      activeFilterCount: visitsData.activeFilterCount,
      clearFilters: visitsData.clearFilters,
      exportVisits: visitsData.exportVisits,
      handleImportData: visitsData.handleImportData,
      importing: visitsData.importing,
      importInputRef: visitsData.importInputRef,

      // Form & Editor
      form: editor.form,
      setForm: editor.setForm,
      editorState: editor.editorState,
      mode: editor.mode,
      editingId: editor.editingId,
      selectedLocation: editor.selectedLocation,
      isSidebarExpanded: editor.isSidebarExpanded,
      isAdding: editor.isAdding,
      isMobilePickingLocation: editor.isMobilePickingLocation,
      isCreating: editor.isCreating,
      editingVisit: editor.editingVisit,
      historyEntries: editor.historyEntries,
      imageUploading: editor.imageUploading,
      startNewVisit: editor.startNewVisit,
      startEditing,
      handleDelete: editor.handleDelete,
      confirmDelete: editor.confirmDelete,
      handleLocationSelect: editor.handleLocationSelect,
      handleBoundsChange: editor.handleBoundsChange,
      handleSubmit: editor.handleSubmit,
      handleImageFile: editor.handleImageFile,
      handleRemoveImage: editor.handleRemoveImage,
      handleDeleteHistoryEntry: editor.handleDeleteHistoryEntry,
      cancelEditing,
      toggleSidebar: editor.toggleSidebar,

      // Map View State
      hoveredId: mapState.hoveredId,
      setHoveredId: mapState.setHoveredId,
      selectedId: mapState.selectedId,
      setSelectedId: mapState.setSelectedId,
      activeMapTarget: mapState.activeMapTarget,
      snapPosition: mapState.snapPosition,
      setSnapPosition: mapState.setSnapPosition,
      handleZoomChange: mapState.handleZoomChange,
      enableClustering: mapState.enableClustering,
      toggleClustering: mapState.toggleClustering,
      showBadges: mapState.showBadges,
      selectedVisit: mapState.selectedVisit,
      handleSelectVisit: mapState.handleSelectVisit,
      handleDeselectVisit: mapState.handleDeselectVisit,
      handleListEdit: mapState.handleListEdit,
      handleListSelectVisit: mapState.handleListSelectVisit,
      handleSelectMobileTab: mapState.handleSelectMobileTab,
    }),
    [ui, visitsData, editor, mapState, startEditing, cancelEditing],
  );
}

// 他の Context / Hook も再エクスポート
export { useSaunaUI, UIProvider } from "./UIContext";
export { useSaunaVisitsData, VisitsDataProvider } from "./VisitsDataContext";
export { useSaunaEditor, EditorProvider } from "./EditorContext";
export { useSaunaMapState, MapStateProvider } from "./MapStateContext";
