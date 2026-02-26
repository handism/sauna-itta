"use client";

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import initialVisits from "@/data/sauna-visits.json";

// Interface for Sauna Visit
interface SaunaVisit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  comment: string;
  image?: string;
  date: string;
}

// Custom Marker Icon Generator
const getSaunaIcon = (isSelected: boolean = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="sauna-marker ${isSelected ? 'sauna-marker--selected' : ''}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};
const defaultIcon = getSaunaIcon();

// Component to handle map clicks
function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to control map view when a sauna is focused from the list
function MapController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = currentZoom < 8 ? 8 : currentZoom;

    map.flyTo([target.lat, target.lng], nextZoom);
  }, [target, map]);

  return null;
}

export default function SaunaMap() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState<{ name: string; comment: string; image: string; date: string; }>({
    name: "",
    comment: "",
    image: "",
    date: "",
  });
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setIsClient(true);

    const savedVisits = localStorage.getItem("sauna-itta_visits");
    let combinedVisits = [...(initialVisits as SaunaVisit[])];

    if (savedVisits) {
      try {
        const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
        const initialIds = new Set(combinedVisits.map(v => v.id));
        const customVisits = parsedSaved.filter(v => !initialIds.has(v.id));
        combinedVisits = [...customVisits, ...combinedVisits];
      } catch (e) {
        console.error("Failed to parse saved visits:", e);
      }
    }
    setVisits(combinedVisits);

    const savedTheme = localStorage.getItem("sauna-itta_theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setIsSidebarExpanded(false);
    }
  }, []);

  const saveVisits = (newVisits: SaunaVisit[]) => {
    setVisits(newVisits);
    try {
      localStorage.setItem("sauna-itta_visits", JSON.stringify(newVisits));
    } catch (error) {
      console.error("Failed to persist visits to localStorage:", error);
      alert("画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("sauna-itta_theme", newTheme);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(visits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'sauna-visits.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startNewVisit = () => {
    setIsAdding(true);
    setForm({
      name: "",
      comment: "",
      image: "",
      date: new Date().toISOString().split('T')[0],
    });
    // モバイルではStep1（地図タップ待ち）のためサイドバーを縮小
    if (isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const startEditing = (visit: SaunaVisit) => {
    setEditingId(visit.id);
    setForm({
      name: visit.name,
      comment: visit.comment,
      image: visit.image || "",
      date: visit.date,
    });
    setSelectedLocation({ lat: visit.lat, lng: visit.lng });
    setMapTarget({ lat: visit.lat, lng: visit.lng });
    setIsAdding(true);
    // 編集時はStep1不要なのでサイドバーを開く
    setIsSidebarExpanded(true);
  };

  // completed=true: 保存・削除後 → 一覧を見せるためサイドバーを展開
  // completed=false: キャンセル → モバイルではサイドバーを閉じる
  const cancelEditing = (completed = false) => {
    setIsAdding(false);
    setEditingId(null);
    setSelectedLocation(null);
    setForm({ name: "", comment: "", image: "", date: "" });
    if (isMobile) {
      setIsSidebarExpanded(completed);
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    if (confirm("このサウナの記録を削除しますか？")) {
      const updatedVisits = visits.filter(v => v.id !== editingId);
      saveVisits(updatedVisits);
      cancelEditing(true); // 削除完了 → 一覧を展開して表示
    }
  };

  // 地図タップで場所選択 → モバイルでは自動的にフォームを展開
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    if (isMobile) {
      setIsSidebarExpanded(true);
    }
  }, [isMobile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !form.name) return;

    if (editingId) {
      const updatedVisits = visits.map(v =>
        v.id === editingId ? {
          ...v,
          name: form.name,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          comment: form.comment,
          image: form.image,
          date: form.date,
        } : v
      );
      saveVisits(updatedVisits);
    } else {
      const newVisit: SaunaVisit = {
        id: Date.now().toString(),
        name: form.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        comment: form.comment,
        image: form.image,
        date: form.date || new Date().toISOString().split('T')[0],
      };
      saveVisits([newVisit, ...visits]);
    }

    cancelEditing(true); // 保存完了 → 一覧を展開して表示
  };

  // モバイルでの「場所待ち」状態: サイドバーを非表示にして地図を全面に
  const isMobilePickingLocation = isMobile && isAdding && !editingId && !selectedLocation;

  if (!isClient) return <div className="map-container" style={{ background: "var(--background)" }} />;

  return (
    <div className={`map-wrapper ${theme === "light" ? "light-theme" : ""}`}>
      <div className="map-container" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <MapContainer
          center={[36.0, 138.0]}
          zoom={6}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />

          <MapController target={mapTarget} />

          {visits.map((visit) => (
            <Marker
              key={visit.id}
              position={[visit.lat, visit.lng]}
              icon={getSaunaIcon(visit.id === editingId)}
            >
              <Popup>
                <div style={{ minWidth: "200px" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)" }}>{visit.name}</h3>
                  {visit.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visit.image}
                      alt={visit.name}
                      style={{ width: "100%", borderRadius: "8px", marginBottom: "0.5rem" }}
                    />
                  )}
                  <p style={{ fontSize: "0.9rem", opacity: 0.8, whiteSpace: "pre-wrap" }}>{visit.comment}</p>
                  <small style={{ display: "block", marginTop: "0.5rem", opacity: 0.5 }}>
                    {visit.date}
                  </small>
                  <button
                    onClick={() => startEditing(visit)}
                    style={{
                      marginTop: "1rem", width: "100%", padding: "0.5rem",
                      background: "var(--primary)", border: "none", borderRadius: "8px",
                      color: "white", cursor: "pointer"
                    }}
                  >
                    編集する
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {isAdding && !editingId && <LocationPicker onLocationSelect={handleLocationSelect} />}

          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={getSaunaIcon()}>
              <Popup>{editingId ? "ここへ移動" : "ここにピンを立てますか？"}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* モバイル: 場所選択中のフローティング案内バー */}
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

      {/* サイドバー: 場所選択中のモバイルでは非表示 */}
      {!isMobilePickingLocation && (
        <div className="ui-layer" style={{ color: "var(--foreground)" }}>
          <aside className={`sidebar ${!isSidebarExpanded ? "collapsed" : ""}`}>
            <button
              className="mobile-toggle"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              aria-label="Toggle Sidebar"
            >
              {isSidebarExpanded ? "↓" : "↑"}
            </button>
            <div className="sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 className="text-primary" style={{ color: "var(--primary)" }}>サウナイッタ</h1>
                <p style={{ fontSize: "0.9rem", margin: 0, color: "var(--foreground)" }}>マイととのいマップ</p>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  background: "var(--glass)", border: "1px solid var(--glass-border)",
                  color: "var(--foreground)", padding: "0.5rem 1rem", borderRadius: "20px",
                  cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold"
                }}
              >
                {theme === "dark" ? "☀️ ライト" : "🌙 ダーク"}
              </button>
            </div>

            <div className="sidebar-content">
              {isAdding ? (
                <form onSubmit={handleSubmit}>
                  <h2 className="mb-2" style={{ fontSize: "1.2rem", color: "var(--foreground)" }}>
                    {editingId ? "サウナの編集" : "新規サウナ登録"}
                  </h2>
                  <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "1.5rem" }}>
                    {editingId ? "内容を更新します" : selectedLocation
                      ? "場所が選択されました ✅"
                      : "地図上をクリックして場所を選択してください"}
                  </p>

                  <div className="form-group">
                    <label>サウナ名</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="例: 上野 SHIZUKU"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>写真を追加</label>
                    <input
                      type="file"
                      className="input"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ fontSize: "0.8rem", padding: "0.5rem" }}
                    />
                    {form.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image} className="sauna-img-preview" alt="Preview" />
                    )}
                  </div>

                  <div className="form-group">
                    <label>行った日</label>
                    <input
                      type="date"
                      className="input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>感想・メモ</label>
                    <textarea
                      className="input textarea"
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      placeholder="水風呂の温度、外気浴の雰囲気など..."
                    />
                  </div>

                  <div className="cta-group" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <button type="submit" className="btn btn-primary" disabled={!selectedLocation}>
                      保存
                    </button>
                    {editingId && (
                      <button type="button" className="btn" style={{ background: "var(--error)", color: "white" }} onClick={handleDelete}>
                        削除
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost" onClick={() => cancelEditing()}>
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <div className="sauna-list">
                  <h2 className="mb-2" style={{ fontSize: "1.2rem", color: "var(--foreground)" }}>訪れたサウナ ({visits.length})</h2>
                  {visits.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: "center", marginTop: "2rem" }}>
                      まだ投稿がありません。<br />新しいピンを立ててみましょう！
                    </p>
                  ) : (
                    visits.map((visit) => (
                      <div key={visit.id} className="sauna-card" onClick={() => startEditing(visit)}>
                        <h3 style={{ color: "var(--foreground)" }}>{visit.name}</h3>
                        <p style={{ color: "var(--foreground)", whiteSpace: "pre-wrap" }}>{visit.comment}</p>
                        {visit.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={visit.image} className="sauna-img-preview" alt="" />
                        )}
                        <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.5rem" }}>
                          行った日: {visit.date}
                        </div>
                        <div style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "0.8rem", color: "var(--primary)" }}>
                          編集
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {!isAdding && (
              <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <button className="btn btn-primary" onClick={startNewVisit}>
                  新しいピンを立てる
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={exportData}
                  style={{ fontSize: "0.8rem", padding: "0.5rem" }}
                >
                  📥 データを出力する (GitHub保存用)
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
