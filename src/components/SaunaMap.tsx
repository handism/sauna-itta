"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FilterModal } from "./sauna-map/components/FilterModal";
import { ShareModal } from "./sauna-map/components/ShareModal";
import { VisitForm } from "./sauna-map/components/VisitForm";
import { VisitList } from "./sauna-map/components/VisitList";
import { VisitMarkers } from "./sauna-map/components/VisitMarkers";
import { ConfirmModal } from "./sauna-map/components/ConfirmModal";
import { Toast } from "./sauna-map/components/Toast";
import type { ToastState } from "./sauna-map/components/Toast";
import { getSaunaIcon } from "./sauna-map/components/markerIcon";
import { useSaunaVisits } from "./sauna-map/hooks/useSaunaVisits";
import { useEditorState } from "./sauna-map/hooks/useEditorState";
import { useVisitFilters } from "./sauna-map/hooks/useVisitFilters";
import {
  getDefaultForm,
  getInitialIsMobile,
  getInitialTheme,
  getTodayDate,
  THEME_STORAGE_KEY,
  toFormState,
} from "./sauna-map/utils";
import { LatLng, SaunaVisit, VisitFormState } from "./sauna-map/types";

function LocationPicker({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ target }: { target: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = currentZoom < 8 ? 8 : currentZoom;
    map.flyTo([target.lat, target.lng], nextZoom);
  }, [target, map]);

  return null;
}

function LocationControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setToastMessage("お使いのブラウザは位置情報に対応していません");
      return;
    }

    setLocating(true);
    setToastMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14);
        setLocating(false);
      },
      () => {
        setToastMessage("位置情報を取得できませんでした");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map]);

  return (
    <div className="location-control" style={{ position: "absolute", zIndex: 1000 }}>
      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        className="location-control-btn"
        aria-label="現在地へ移動"
        title="現在地へ移動"
      >
        {locating ? "…" : "📍"}
      </button>
      {toastMessage && (
        <div className="location-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function SaunaMap() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const { visits, saveVisits, createVisit, updateVisit, importVisitsFromFile, exportVisits } =
    useSaunaVisits();
  const { filters, setFilters, filteredVisits, stats, isFilterActive, clearFilters } =
    useVisitFilters(visits);

  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [isMobile] = useState(getInitialIsMobile);
  const {
    state: editorState,
    startCreate,
    startEdit,
    selectLocation,
    cancelEdit,
    toggleSidebar,
  } = useEditorState(isMobile);
  const { mode, editingId, selectedLocation, isSidebarExpanded, mapTarget } = editorState;
  const [isShareViewOpen, setIsShareViewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: ToastState["tone"] = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileMenuRef.current?.contains(target)) return;
      setIsMobileMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const startNewVisit = () => {
    startCreate();
    setForm(getDefaultForm(getTodayDate()));
  };

  const startEditing = (visit: SaunaVisit) => {
    startEdit(visit);
    setForm(toFormState(visit));
  };

  const cancelEditing = (completed = false) => {
    cancelEdit(completed);
    setForm(getDefaultForm());
  };

  const handleDelete = () => {
    if (!editingId) return;
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!editingId) return;
    const updatedVisits = visits.filter((v) => v.id !== editingId);
    const persisted = saveVisits(updatedVisits);
    if (!persisted) {
      showToast(
        "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。",
        "error",
      );
    } else {
      showToast("記録を削除しました。", "success");
    }
    setIsDeleteConfirmOpen(false);
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

    if (editingId) {
      const updatedVisits = updateVisit(editingId, selectedLocation, form);
      const persisted = saveVisits(updatedVisits);
      if (!persisted) {
        showToast(
          "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。",
          "error",
        );
      }
    } else {
      const newVisit = createVisit(selectedLocation, form);
      const persisted = saveVisits([newVisit, ...visits]);
      if (!persisted) {
        showToast(
          "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。",
          "error",
        );
      }
    }

    cancelEditing(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const { added, nextVisits } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast("新しく追加されるデータはありませんでした。", "info");
          return;
        }

        const persisted = saveVisits(nextVisits);
        if (!persisted) {
          showToast(
            "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。",
            "error",
          );
        }
        showToast(`データを${added}件取り込みました。`, "success");
      } catch (error) {
        console.error(error);
        showToast("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
      } finally {
        e.target.value = "";
      }
    },
    [importVisitsFromFile, saveVisits, showToast],
  );

  const isAdding = mode !== "list";
  const isMobilePickingLocation = isMobile && mode === "creating:pick";
  const isCreating = mode === "creating:pick" || mode === "creating:form";

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

          <MapController target={mapTarget} />
          <VisitMarkers visits={filteredVisits} editingId={editingId} onEdit={startEditing} />

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
          {isMobileMenuOpen && (
            <div
              className="mobile-menu-backdrop"
              onClick={() => setIsMobileMenuOpen(false)}
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
                {!isAdding && (
                  <button
                    type="button"
                    className="mobile-menu-btn"
                    onClick={() => {
                      startNewVisit();
                      setIsMobileMenuOpen(false);
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
                  onClick={() => setIsMobileMenuOpen((v) => !v)}
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
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {theme === "dark" ? "☀️ ライトモード" : "🌙 ダークモード"}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsShareViewOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      📸 シェア用ビュー
                    </button>
                    <Link
                      href="/stats"
                      prefetch={false}
                      role="menuitem"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📊 ダッシュボード
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        exportVisits(visits);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      📥 エクスポート
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        importInputRef.current?.click();
                        setIsMobileMenuOpen(false);
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
                  onSubmit={handleSubmit}
                  onImageChange={handleImageChange}
                  onDelete={handleDelete}
                  onCancel={() => cancelEditing()}
                />
              ) : (
                <VisitList
                  visits={visits}
                  filteredVisits={filteredVisits}
                  isFilterActive={isFilterActive}
                  onOpenFilters={() => setIsFilterModalOpen(true)}
                  onEdit={startEditing}
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

      <FilterModal
        isOpen={isFilterModalOpen}
        filters={filters}
        setFilters={setFilters}
        isFilterActive={isFilterActive}
        onClearFilters={clearFilters}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareViewOpen}
        stats={stats}
        filteredVisits={filteredVisits}
        onClose={() => setIsShareViewOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="記録を削除しますか？"
        message="この操作は元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
