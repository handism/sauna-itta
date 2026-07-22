"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
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
import { Toast } from "./components/Toast";
import type { ToastState } from "./components/Toast";
import { BottomSheet, SheetSnapPosition } from "./components/BottomSheet";
import { MobileNavBar, MobileTab } from "./components/MobileNavBar";
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
  getVisitHistoryEntries,
  toFormState,
  compressAndGetBase64,
} from "./utils";
import { SaunaVisit, VisitFormState, LatLng } from "./types";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export default function SaunaMap() {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { visits, addVisit, editVisit, deleteVisit, removeLastHistoryEntry, importVisitsFromFile, exportVisits } =
    useSaunaVisits();
  const { filters, setFilters, filteredVisits, stats, isFilterActive, activeFilterCount, clearFilters } =
    useVisitFilters(visits);

  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [isMobile] = useState(getInitialIsMobile);
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
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("map");

  const activeMapTarget = mapTargetOverride || mapTarget;

  const handleSelectVisit = useCallback((visit: SaunaVisit) => {
    setSelectedId(visit.id);
    setHoveredId(visit.id);
    setMapTargetOverride({ lat: visit.lat, lng: visit.lng });
    if (isMobile) {
      setSnapPosition("half");
      setActiveMobileTab("list");
    }
  }, [isMobile]);

  const handleDeselectVisit = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setMapTargetOverride(null);
  }, []);

  const handleSelectMobileTab = useCallback((tab: MobileTab) => {
    setActiveMobileTab(tab);
    if (tab === "map") {
      setSnapPosition("min");
    } else if (tab === "list") {
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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
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
  };

  const cancelEditing = (completed = false) => {
    cancelEdit(completed);
    setForm(getDefaultForm());
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressAndGetBase64(file);
      setForm((prev) => ({ ...prev, image: base64 }));
    } catch (error) {
      console.error(error);
      showToast("画像の圧縮に失敗しました。別の画像で試してください。", "error");
    }
  };

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

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

  const handleDeleteLastHistory = () => {
    if (!editingId) return;

    removeLastHistoryEntry(editingId);

    const newLatest = historyEntries[historyEntries.length - 2];

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
          <ZoomControl position="topright" />
          <LocationControl />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />

          <MapController target={activeMapTarget} isMobile={isMobile} />
          <VisitMarkers
            visits={filteredVisits}
            editingId={editingId}
            selectedId={selectedId}
            hoveredId={hoveredId}
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
          <div className="pin-hint-icon">📍</div>
          <div className="pin-hint-text">
            <strong>地図をタップして場所を選択</strong>
            <span>サウナの場所をタップしてね</span>
          </div>
          <button className="pin-hint-cancel" onClick={() => cancelEditing()}>
            ✕
          </button>
        </div>
      )}

      {!isMobilePickingLocation && (
        <div className="ui-layer">
          {!isSidebarExpanded && (
            <button
              type="button"
              className="desktop-sidebar-open-btn"
              onClick={toggleSidebar}
              aria-label="サイドバーを開く"
              title="サイドバーを開く"
            >
              <span className="open-btn-icon">♨️</span>
              <span className="open-btn-text">サウナイッタ</span>
              <span className="open-btn-arrow">▶</span>
            </button>
          )}

          {isMobileMenuOpen && (
            <div
              className="mobile-menu-backdrop"
              onClick={closeMobileMenu}
              aria-hidden
            />
          )}
          <aside className={`sidebar ${!isSidebarExpanded ? "collapsed" : ""}`}>
            <button
              className="mobile-toggle"
              onClick={toggleSidebar}
              aria-label="パネルを開く・閉じる"
            >
              {isSidebarExpanded ? "↓" : "↑"}
            </button>
            <div className="sidebar-header">
              <div className="sidebar-header-main">
                <h1 className="text-primary">サウナイッタ</h1>
                <p>マイととのいマップ</p>
              </div>
              <div className="mobile-menu-wrap" ref={mobileMenuRef}>
                <button
                  type="button"
                  className="desktop-sidebar-close-btn"
                  onClick={toggleSidebar}
                  aria-label="サイドバーを折りたたむ"
                  title="サイドバーを折りたたむ"
                >
                  ◀
                </button>
                {!isAdding && (
                  <button
                    type="button"
                    className="mobile-menu-btn"
                    onClick={() => {
                      startNewVisit();
                      closeMobileMenu();
                    }}
                    aria-label="新規ピンを立てる"
                    title="新規ピンを立てる"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-menu-btn"
                  onClick={toggleMobileMenu}
                  aria-label="メニュー"
                  aria-expanded={isMobileMenuOpen}
                >
                  ⋯
                </button>
                {isMobileMenuOpen && (
                  <div
                    className={`mobile-menu-dropdown ${
                      isSidebarExpanded ? "mobile-menu-dropdown--down" : ""
                    }`}
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        toggleTheme();
                        closeMobileMenu();
                      }}
                    >
                      {theme === "dark" ? "☀️ ライトモード" : "🌙 ダークモード"}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        openShareView();
                        closeMobileMenu();
                      }}
                    >
                      📸 シェア用ビュー
                    </button>
                    <Link
                      href="/stats"
                      prefetch={false}
                      role="menuitem"
                      onClick={closeMobileMenu}
                    >
                      📊 ダッシュボード
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        exportVisits();
                        closeMobileMenu();
                      }}
                    >
                      📥 エクスポート
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        importInputRef.current?.click();
                        closeMobileMenu();
                      }}
                    >
                      📤 インポート
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="sidebar-content">
              {isAdding ? (
                <VisitForm
                  form={form}
                  setForm={setForm}
                  selectedLocation={selectedLocation}
                  editingId={editingId}
                  historyEntries={historyEntries}
                  onSubmit={handleSubmit}
                  onImageChange={handleImageChange}
                  onDelete={handleDelete}
                  onCancel={() => cancelEditing()}
                  onDeleteLastHistory={editingId ? handleDeleteLastHistory : undefined}
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
                  onEdit={startEditing}
                  selectedId={selectedId}
                  onSelectVisit={handleSelectVisit}
                  onDeselectVisit={handleDeselectVisit}
                  hoveredId={hoveredId}
                  onHoverVisit={setHoveredId}
                />
              )}
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={handleImportData}
            />
          </aside>
        </div>
      )}

      {/* モバイル専用 ボトムシート UI */}
      {!isMobilePickingLocation && (
        <BottomSheet snapPosition={snapPosition} onSnapChange={setSnapPosition}>
          {isAdding ? (
            <VisitForm
              form={form}
              setForm={setForm}
              selectedLocation={selectedLocation}
              editingId={editingId}
              historyEntries={historyEntries}
              onSubmit={handleSubmit}
              onImageChange={handleImageChange}
              onDelete={handleDelete}
              onCancel={() => cancelEditing()}
              onDeleteLastHistory={editingId ? handleDeleteLastHistory : undefined}
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
              onEdit={(visit) => {
                startEditing(visit);
                setSnapPosition("full");
              }}
              selectedId={selectedId}
              onSelectVisit={handleSelectVisit}
              onDeselectVisit={handleDeselectVisit}
              hoveredId={hoveredId}
              onHoverVisit={setHoveredId}
            />
          )}
        </BottomSheet>
      )}

      {/* モバイル専用 下部ナビゲーションバー */}
      {!isMobilePickingLocation && (
        <MobileNavBar
          activeTab={activeMobileTab}
          onSelectTab={handleSelectMobileTab}
          snapPosition={snapPosition}
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
