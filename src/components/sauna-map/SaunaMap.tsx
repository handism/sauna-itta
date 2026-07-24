"use client";

import { useCallback } from "react";
import { MapPin, X } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { FilterModal } from "./components/FilterModal";
import { ShareModal } from "./components/ShareModal";
import { VisitForm } from "./components/VisitForm";
import { VisitList } from "./components/VisitList";
import { VisitMarkers } from "./components/VisitMarkers";
import { ConfirmModal } from "./components/ConfirmModal";
import { LocationPicker } from "./components/LocationPicker";
import { MapController } from "./components/MapController";
import { LocationControl } from "./components/LocationControl";
import { MapClusterControl } from "./components/MapClusterControl";
import { MapZoomControl } from "./components/MapZoomControl";
import { MapBoundsObserver } from "./components/MapBoundsObserver";
import { ZoomObserver } from "./components/ZoomObserver";
import { Toast } from "./components/Toast";
import { BottomSheet } from "./components/BottomSheet";
import { MobileNavBar } from "./components/MobileNavBar";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { getSaunaIcon } from "./components/markerIcon";
import {
  SaunaMapProvider,
  useSaunaUI,
  useSaunaVisitsData,
  useSaunaEditor,
  useSaunaMapState,
} from "./context";
import { SaunaVisit } from "./types";

function SaunaMapContent() {
  const {
    isMobile,
    mounted,
    theme,
    isDeleteConfirmOpen,
    openFilterModal,
    closeDeleteConfirm,
    toast,
    showToast,
    clearToast,
  } = useSaunaUI();

  const { filteredVisits, isFilterActive } = useSaunaVisitsData();

  const {
    editingId,
    selectedLocation,
    isAdding,
    isMobilePickingLocation,
    isCreating,
    confirmDelete,
    handleLocationSelect,
    handleBoundsChange,
    cancelEditing: editorCancelEditing,
    startEditing: editorStartEditing,
  } = useSaunaEditor();

  const {
    hoveredId,
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
    handleSelectMobileTab,
  } = useSaunaMapState();

  const startEditing = useCallback(
    (visit: SaunaVisit) => {
      setSelectedId(visit.id);
      editorStartEditing(visit);
      if (isMobile) {
        setSnapPosition("full");
      }
    },
    [setSelectedId, editorStartEditing, isMobile, setSnapPosition],
  );

  const cancelEditing = useCallback(
    (completed = false) => {
      editorCancelEditing(completed);
      if (isMobile) {
        setSnapPosition("min");
      }
    },
    [editorCancelEditing, isMobile, setSnapPosition],
  );

  if (!mounted) {
    return <div className="map-container" style={{ background: "var(--background)", height: "100%", width: "100%" }} />;
  }

  return (
    <div className={`map-wrapper ${theme === "light" ? "light-theme" : ""}`}>
      <div className="map-container" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <MapContainer
          center={[36.0, 138.0]}
          zoom={6}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <div className="map-top-right-controls">
            <MapClusterControl
              enableClustering={enableClustering}
              onToggleClustering={toggleClustering}
            />
            <MapZoomControl />
            <LocationControl onNotify={showToast} />
          </div>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />

          <MapController target={activeMapTarget} isMobile={isMobile} />
          <ZoomObserver onZoomChange={handleZoomChange} />
          <MapBoundsObserver onBoundsChange={handleBoundsChange} />
          <VisitMarkers
            visits={filteredVisits}
            editingId={editingId}
            selectedId={selectedId}
            hoveredId={hoveredId}
            showBadges={showBadges}
            enableClustering={enableClustering}
            onEdit={startEditing}
            onSelectVisit={handleSelectVisit}
          />

          {isCreating && <LocationPicker onLocationSelect={handleLocationSelect} />}

          {selectedLocation && !editingId && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={getSaunaIcon({ selected: true })}
            >
              <Popup autoPan={false}>ここにピンを立てますか？</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {isMobilePickingLocation && (
        <div className="pin-hint">
          <div className="pin-hint-icon">
            <MapPin size={20} />
          </div>
          <div className="pin-hint-text">
            <strong>地図をタップして場所を選択</strong>
            <span>サウナの場所をタップしてね</span>
          </div>
          <button className="pin-hint-cancel" onClick={() => cancelEditing()}>
            <X size={16} />
          </button>
        </div>
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
          onOpenFilter={openFilterModal}
          isFilterActive={isFilterActive}
        />
      )}

      <FilterModal />
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
