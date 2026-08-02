"use client";

import { useCallback, useState } from "react";
import "leaflet/dist/leaflet.css";

import { ShareModal } from "./components/ShareModal";
import { VisitForm } from "./components/VisitForm";
import { VisitList } from "./components/VisitList";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { BottomSheet } from "./components/BottomSheet";
import { MobileNavBar } from "./components/MobileNavBar";
import { DesktopSidebar } from "./components/DesktopSidebar";
import {
  SaunaMapProvider,
  useSaunaUI,
  useVisitFiltersContext,
  useSaunaEditor,
  useSaunaMapState,
  useVisitsCRUD,
} from "./context";
import { CurrentLocation } from "./types";
import { MobilePinHint } from "./components/MobilePinHint";
import { SaunaMapLayer } from "./components/SaunaMapLayer";
import { ApiAccessGate } from "./components/ApiAccessGate";

function SaunaMapContent() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);

  const {
    isMobile,
    mounted,
    theme,
    isDeleteConfirmOpen,
    toggleFilterPanel,
    closeDeleteConfirm,
    toast,
    clearToast,
  } = useSaunaUI();

  const { filteredVisits, isFilterActive } = useVisitFiltersContext();
  const { dataSource, loading, authenticated, csrfToken, loadError, reload } = useVisitsCRUD();

  const {
    isAdding,
    isMobilePickingLocation,
    confirmDelete,
  } = useSaunaEditor();

  const {
    snapPosition,
    setSnapPosition,
    selectedVisit,
    handleCancelEditing,
    handleSelectMobileTab,
  } = useSaunaMapState();

  const handleMobileFilterClick = useCallback(() => {
    setSnapPosition("half");
    toggleFilterPanel();
  }, [setSnapPosition, toggleFilterPanel]);

  if (!mounted) {
    return <div className="map-container" style={{ background: "var(--background)", height: "100%", width: "100%" }} />;
  }

  if (dataSource === "api" && (loading || !authenticated || loadError)) {
    return (
      <ApiAccessGate
        loading={loading}
        authenticated={authenticated}
        csrfToken={csrfToken}
        error={loadError}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className={`map-wrapper ${theme === "light" ? "light-theme" : ""}`}>
      <SaunaMapLayer
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
      />

      {isMobilePickingLocation && (
        <MobilePinHint onCancel={handleCancelEditing} />
      )}

      {!isMobilePickingLocation && !isMobile && (
        <DesktopSidebar>
          {isAdding ? <VisitForm /> : <VisitList />}
        </DesktopSidebar>
      )}

      {/* モバイル専用 ボトムシート UI */}
      {!isMobilePickingLocation && isMobile && (
        <BottomSheet
          snapPosition={snapPosition}
          onSnapChange={setSnapPosition}
          filteredCount={filteredVisits.length}
          selectedVisitName={selectedVisit?.name}
        >
          {isAdding ? <VisitForm /> : <VisitList />}
        </BottomSheet>
      )}

      {/* モバイル専用 下部ナビゲーションバー */}
      {!isMobilePickingLocation && isMobile && (
        <MobileNavBar
          onSelectTab={handleSelectMobileTab}
          snapPosition={snapPosition}
          isAdding={isAdding}
          onOpenFilter={handleMobileFilterClick}
          isFilterActive={isFilterActive}
        />
      )}

      <ShareModal />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="記録を削除しますか？"
        message="この操作は元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        destructive
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

export default function SaunaMap() {
  return (
    <SaunaMapProvider>
      <SaunaMapContent />
    </SaunaMapProvider>
  );
}
