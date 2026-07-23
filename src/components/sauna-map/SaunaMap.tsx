"use client";

import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, FormEvent } from "react";
import { MapPin, X } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ZoomObserver({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}
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
import { Toast } from "./components/Toast";
import type { ToastState } from "./components/Toast";
import { BottomSheet } from "./components/BottomSheet";
import type { SheetSnapPosition } from "./types";
import { MobileNavBar, MobileTab } from "./components/MobileNavBar";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { getSaunaIcon } from "./components/markerIcon";
import { useSaunaVisits } from "./hooks/useSaunaVisits";
import { useEditorState } from "./hooks/useEditorState";
import { useVisitFilters } from "./hooks/useVisitFilters";
import { useUIState } from "./hooks/useUIState";
import {
  getDefaultForm,
  getInitialIsMobile,
  getInitialTheme,
  getTodayDate,
  THEME_STORAGE_KEY,
  MOBILE_BREAKPOINT,
  getVisitHistoryEntries,
  toFormState,
  compressAndGetBase64,
  applyThemeClass,
} from "./utils";
import { SaunaVisit, VisitFormState, LatLng } from "./types";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export default function SaunaMap() {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { visits, addVisit, editVisit, deleteVisit, removeHistoryEntry, importVisitsFromFile, exportVisits } =
    useSaunaVisits();
  const { filters, setFilters, filteredVisits, stats, isFilterActive, activeFilterCount, clearFilters } =
    useVisitFilters(visits);

  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);
  const [mounted, setMounted] = useState(false);
  const {
    state: editorState,
    startCreate,
    startEdit,
    selectLocation,
    cancelEdit,
    toggleSidebar,
  } = useEditorState(isMobile);
  const { mode, editingId, selectedLocation, isSidebarExpanded, mapTarget } = editorState;
  
  const {
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
  } = useUIState();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapTargetOverride, setMapTargetOverride] = useState<LatLng | null>(null);
  const [snapPosition, setSnapPosition] = useState<SheetSnapPosition>("min");
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const showBadges = zoomLevel >= 13;

  const activeMapTarget = mapTargetOverride || mapTarget;

  const selectedVisit = useMemo(
    () => visits.find((v) => v.id === selectedId),
    [visits, selectedId]
  );

  const handleSelectVisit = useCallback((visit: SaunaVisit) => {
    setSelectedId(visit.id);
    setHoveredId(visit.id);
    setMapTargetOverride({ lat: visit.lat, lng: visit.lng });
    if (isMobile) {
      // ピンタップ時はマップの操作性を重視し min（最小化）のまま保つ（バー横に選択名を表示）
      setSnapPosition("min");
    }
  }, [isMobile]);

  const handleDeselectVisit = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setMapTargetOverride(null);
  }, []);

  const handleSelectMobileTab = useCallback((tab: MobileTab) => {
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
  }, [startCreate]);

  const showToast = useCallback((message: string, tone: ToastState["tone"] = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast || toast.tone === "error") return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  };

  const startNewVisit = () => {
    startCreate();
    setForm(getDefaultForm(getTodayDate()));
  };

  const startEditing = (visit: SaunaVisit) => {
    setSelectedId(visit.id);
    startEdit(visit);
    setForm(toFormState(visit));
    if (isMobile) {
      setSnapPosition("full");
    }
  };

  const cancelEditing = (completed = false) => {
    cancelEdit(completed);
    setForm(getDefaultForm());
    if (isMobile) {
      setSnapPosition("min");
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    openDeleteConfirm();
  };

  const confirmDelete = () => {
    if (!editingId) return;
    const { success } = deleteVisit(editingId);
    if (!success) {
      showToast(
        STORAGE_ERROR_MSG,
        "error",
      );
    } else {
      showToast("記録を削除しました。", "success");
    }
    closeDeleteConfirm();
    cancelEditing(true);
  };


  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      selectLocation({ lat, lng });
    },
    [selectLocation],
  );

  const handleBoundsChange = useCallback(
    (bounds: { northEast: LatLng; southWest: LatLng }) => {
      setFilters((prev) => ({
        ...prev,
        mapBounds: bounds,
      }));
    },
    [setFilters]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !form.name) return;

    let success = false;
    if (editingId) {
      const result = editVisit(editingId, selectedLocation, form);
      success = result.success;
    } else {
      const result = addVisit(selectedLocation, form);
      success = result.success;
    }

    if (!success) {
      showToast(
        STORAGE_ERROR_MSG,
        "error",
      );
    }

    cancelEditing(true);
  };

  const handleImageFile = async (file: File) => {
    setImageUploading(true);
    try {
      const base64 = await compressAndGetBase64(file);
      setForm((prev) => ({ ...prev, image: base64 }));
    } catch (error) {
      console.error(error);
      showToast("画像の圧縮に失敗しました。別の画像で試してください。", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, success } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast("新しく追加されるデータはありませんでした。", "info");
          return;
        }

        if (!success) {
          showToast(
            STORAGE_ERROR_MSG,
            "error",
          );
        } else {
          showToast(`データを${added}件取り込みました。`, "success");
        }
      } catch (error) {
        console.error(error);
        showToast("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

  const isAdding = mode !== "list";
  const isMobilePickingLocation = isMobile && mode === "creating:pick";
  const isCreating = mode === "creating:pick" || mode === "creating:form";
  const editingVisit = editingId ? visits.find((v) => v.id === editingId) ?? null : null;
  const historyEntries = editingVisit ? getVisitHistoryEntries(editingVisit) : [];

  const handleListEdit = (visit: SaunaVisit) => {
    startEditing(visit);
    if (isMobile) setSnapPosition("full");
  };

  const handleListSelectVisit = (visit: SaunaVisit) => {
    handleSelectVisit(visit);
    if (isMobile) setSnapPosition("half");
  };

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

  const handleDeleteHistoryEntry = (index: number) => {
    if (!editingId) return;

    removeHistoryEntry(editingId, index);

    const newLatest = historyEntries.filter((_, i) => i !== index).at(-1);

    if (newLatest) {
      setForm((prev) => ({
        ...prev,
        date: newLatest.date,
        comment: newLatest.comment,
        rating: newLatest.rating ?? 0,
        image: newLatest.image ?? "",
      }));
    }
  };

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
              onToggleClustering={() => setEnableClustering((prev) => !prev)}
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
              <Popup>ここにピンを立てますか？</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {isMobilePickingLocation && (
        <div className="pin-hint">
          <div className="pin-hint-icon"><MapPin size={20} /></div>
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
