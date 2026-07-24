"use client";

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
import { SaunaMapProvider, useSaunaMap } from "./context/SaunaMapContext";

function SaunaMapContent() {
  const {
    isMobile,
    mounted,
    theme,
    toggleTheme,
    visits,
    filteredVisits,
    filters,
    setFilters,
    stats,
    isFilterActive,
    activeFilterCount,
    clearFilters,
    exportVisits,
    form,
    setForm,
    mode,
    editingId,
    selectedLocation,
    isSidebarExpanded,
    isAdding,
    isMobilePickingLocation,
    isCreating,
    historyEntries,
    imageUploading,
    importing,
    importInputRef,
    startNewVisit,
    startEditing,
    handleDelete,
    confirmDelete,
    handleLocationSelect,
    handleBoundsChange,
    handleSubmit,
    handleImageFile,
    handleRemoveImage,
    handleImportData,
    handleDeleteHistoryEntry,
    cancelEditing,
    toggleSidebar,
    hoveredId,
    setHoveredId,
    selectedId,
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
    isShareViewOpen,
    isMobileMenuOpen,
    isFilterModalOpen,
    isDeleteConfirmOpen,
    mobileMenuRef,
    openShareView,
    closeShareView,
    toggleMobileMenu,
    closeMobileMenu,
    openFilterModal,
    closeFilterModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    toast,
    showToast,
    clearToast,
  } = useSaunaMap();

  const renderPanelContent = () =>
    isAdding ? (
      <VisitForm
        form={form}
        setForm={setForm}
        selectedLocation={selectedLocation}
        editingId={editingId}
        historyEntries={historyEntries}
        onSubmit={handleSubmit}
        onImageFile={handleImageFile}
        onRemoveImage={handleRemoveImage}
        onDelete={handleDelete}
        onCancel={() => cancelEditing()}
        onDeleteHistoryEntry={editingId ? handleDeleteHistoryEntry : undefined}
        imageUploading={imageUploading}
      />
    ) : (
      <VisitList
        visits={visits}
        filteredVisits={filteredVisits}
        filters={filters}
        setFilters={setFilters}
        isFilterActive={isFilterActive}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        onOpenFilters={openFilterModal}
        onEdit={handleListEdit}
        selectedId={selectedId}
        onSelectVisit={handleListSelectVisit}
        onDeselectVisit={handleDeselectVisit}
        hoveredId={hoveredId}
        onHoverVisit={setHoveredId}
        isMobile={isMobile}
      />
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
        <DesktopSidebar
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={toggleSidebar}
          isMobileMenuOpen={isMobileMenuOpen}
          mobileMenuRef={mobileMenuRef}
          onToggleMobileMenu={toggleMobileMenu}
          onCloseMobileMenu={closeMobileMenu}
          isAdding={isAdding}
          onStartNewVisit={startNewVisit}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenShareView={openShareView}
          onExportVisits={exportVisits}
          importing={importing}
          importInputRef={importInputRef}
          onImportClick={() => importInputRef.current?.click()}
          onImportChange={handleImportData}
        >
          {renderPanelContent()}
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
          {renderPanelContent()}
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

      <FilterModal
        isOpen={isFilterModalOpen}
        filters={filters}
        setFilters={setFilters}
        isFilterActive={isFilterActive}
        onClearFilters={clearFilters}
        onClose={closeFilterModal}
      />

      <ShareModal
        isOpen={isShareViewOpen}
        stats={stats}
        filteredVisits={filteredVisits}
        onClose={closeShareView}
      />

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
