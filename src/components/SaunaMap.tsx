"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  rating?: number;
  tags?: string[];
  status?: "visited" | "wishlist";
  area?: string;
}

// Custom Marker Icon Generator
const getSaunaIcon = (
  options: {
    selected?: boolean;
    wishlist?: boolean;
  } = {}
) => {
  const { selected = false, wishlist = false } = options;

  const classes = [
    "sauna-marker",
    selected ? "sauna-marker--selected" : "",
    wishlist ? "sauna-marker--wishlist" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"></div>`,
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
  const [form, setForm] = useState<{
    name: string;
    comment: string;
    image: string;
    date: string;
    rating: number;
    tagsText: string;
    status: "visited" | "wishlist";
    area: string;
  }>({
    name: "",
    comment: "",
    image: "",
    date: "",
    rating: 0,
    tagsText: "",
    status: "visited",
    area: "",
  });
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<{
    search: string;
    status: "all" | "visited" | "wishlist";
    minRating: number;
    sort: "recent" | "oldest" | "ratingDesc" | "ratingAsc";
  }>({
    search: "",
    status: "all",
    minRating: 0,
    sort: "recent",
  });
  const [isShareViewOpen, setIsShareViewOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const savedVisits = localStorage.getItem("sauna-itta_visits");
    let combinedVisits = [...(initialVisits as SaunaVisit[])];

    if (savedVisits) {
      try {
        const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
        const initialIds = new Set(combinedVisits.map((v) => v.id));
        const customVisits = parsedSaved
          .map((v) => ({
            ...v,
            rating: v.rating ?? 0,
            tags: v.tags ?? [],
            status: v.status ?? "visited",
            area: v.area ?? "",
          }))
          .filter((v) => !initialIds.has(v.id));
        combinedVisits = [
          ...customVisits,
          ...combinedVisits.map((v) => ({
            ...v,
            rating: v.rating ?? 0,
            tags: v.tags ?? [],
            status: v.status ?? "visited",
            area: v.area ?? "",
          })),
        ];
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
      date: new Date().toISOString().split("T")[0],
      rating: 0,
      tagsText: "",
      status: "visited",
      area: "",
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
      rating: visit.rating ?? 0,
      tagsText: (visit.tags ?? []).join(", "),
      status: visit.status ?? "visited",
      area: visit.area ?? "",
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
    setForm({
      name: "",
      comment: "",
      image: "",
      date: "",
      rating: 0,
      tagsText: "",
      status: "visited",
      area: "",
    });
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

    const normalizedTags =
      form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) ?? [];

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
          rating: form.rating || 0,
          tags: normalizedTags,
          status: form.status,
          area: form.area,
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
        rating: form.rating || 0,
        tags: normalizedTags,
        status: form.status,
        area: form.area,
      };
      saveVisits([newVisit, ...visits]);
    }

    cancelEditing(true); // 保存完了 → 一覧を展開して表示
  };

  const filteredVisits = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    let result = visits.filter((v) => {
      if (filters.status !== "all" && (v.status ?? "visited") !== filters.status) {
        return false;
      }
      if ((v.rating ?? 0) < filters.minRating) {
        return false;
      }
      if (keyword) {
        const text = [
          v.name,
          v.comment,
          v.area ?? "",
          (v.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      return true;
    });

    result = result.slice().sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "ratingDesc":
          return (b.rating ?? 0) - (a.rating ?? 0) || new Date(b.date).getTime() - new Date(a.date).getTime();
        case "ratingAsc":
          return (a.rating ?? 0) - (b.rating ?? 0) || new Date(b.date).getTime() - new Date(a.date).getTime();
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [visits, filters]);

  const stats = useMemo(() => {
    const total = visits.length;
    if (total === 0) {
      return {
        total,
        visitedCount: 0,
        wishlistCount: 0,
        firstDate: null as string | null,
        lastDate: null as string | null,
        avgRating: 0,
        uniqueAreas: 0,
      };
    }

    const sortedByDate = [...visits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = sortedByDate[0].date;
    const lastDate = sortedByDate[sortedByDate.length - 1].date;
    const visitedCount = visits.filter((v) => (v.status ?? "visited") === "visited").length;
    const wishlistCount = visits.filter((v) => (v.status ?? "visited") === "wishlist").length;
    const ratings = visits.map((v) => v.rating ?? 0).filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10
          ) / 10
        : 0;
    const areas = new Set(
      visits
        .map((v) => (v.area ?? "").trim())
        .filter((a) => a.length > 0)
    );

    return {
      total,
      visitedCount,
      wishlistCount,
      firstDate,
      lastDate,
      avgRating,
      uniqueAreas: areas.size,
    };
  }, [visits]);

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

          {filteredVisits.map((visit) => (
            <Marker
              key={visit.id}
              position={[visit.lat, visit.lng]}
              icon={getSaunaIcon({
                selected: visit.id === editingId,
                wishlist: (visit.status ?? "visited") === "wishlist",
              })}
            >
              <Popup>
                <div style={{ minWidth: "200px" }}>
                  <h3 style={{ margin: "0 0 0.25rem 0", color: "var(--primary)" }}>
                    {visit.name}
                    {(visit.status ?? "visited") === "wishlist" && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>🏷 行きたい</span>
                    )}
                  </h3>
                  {visit.area && (
                    <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>
                      {visit.area}
                    </div>
                  )}
                  {(visit.rating ?? 0) > 0 && (
                    <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                      {"★".repeat(visit.rating ?? 0)}
                      {"☆".repeat(5 - (visit.rating ?? 0))}
                    </div>
                  )}
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

          {/* 新規作成時のみプレビュー用のピンを表示（既存編集時は既存ピンをハイライト表示） */}
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
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.8 }}>
                  <span style={{ marginRight: "0.75rem" }}>合計: {stats.total}</span>
                  <span style={{ marginRight: "0.75rem" }}>行った: {stats.visitedCount}</span>
                  <span>行きたい: {stats.wishlistCount}</span>
                  {stats.uniqueAreas > 0 && (
                    <span style={{ marginLeft: "0.75rem" }}>エリア数: {stats.uniqueAreas}</span>
                  )}
                  {stats.firstDate && stats.lastDate && (
                    <div style={{ marginTop: "0.25rem" }}>
                      <span>期間: {stats.firstDate} 〜 {stats.lastDate}</span>
                    </div>
                  )}
                  {stats.avgRating > 0 && (
                    <div style={{ marginTop: "0.25rem" }}>
                      平均満足度: {stats.avgRating} / 5
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
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
                <button
                  type="button"
                  onClick={() => setIsShareViewOpen(true)}
                  style={{
                    background: "var(--glass)", border: "1px solid var(--glass-border)",
                    color: "var(--foreground)", padding: "0.35rem 0.75rem", borderRadius: "20px",
                    cursor: "pointer", fontSize: "0.7rem",
                  }}
                >
                  📸 シェア用ビュー
                </button>
              </div>
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
                    <label>エリア（任意）</label>
                    <input
                      className="input"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      placeholder="例: 東京 / 北海道 / 関西 など"
                    />
                  </div>

                  <div className="form-group">
                    <label>ステータス</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          flex: 1,
                          background:
                            form.status === "visited"
                              ? "var(--primary)"
                              : "var(--glass)",
                          color: form.status === "visited" ? "white" : "var(--foreground)",
                        }}
                        onClick={() => setForm({ ...form, status: "visited" })}
                      >
                        行った
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          flex: 1,
                          background:
                            form.status === "wishlist"
                              ? "var(--accent)"
                              : "var(--glass)",
                          color: "var(--foreground)",
                        }}
                        onClick={() => setForm({ ...form, status: "wishlist" })}
                      >
                        行きたい
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>満足度（★1〜5）</label>
                    <div style={{ display: "flex", gap: "0.25rem", fontSize: "1.2rem" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, rating: star })}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0 0.1rem",
                          }}
                          aria-label={`${star} star`}
                        >
                          {form.rating >= star ? "★" : "☆"}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, rating: 0 })}
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.8rem",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          opacity: 0.7,
                        }}
                      >
                        クリア
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>タグ（カンマ区切り）</label>
                    <input
                      className="input"
                      value={form.tagsText}
                      onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                      placeholder="例: 外気浴最高, 水風呂キンキン, ソロ向き"
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
                  <h2 className="mb-2" style={{ fontSize: "1.2rem", color: "var(--foreground)" }}>
                    訪れたサウナ ({filteredVisits.length}/{visits.length})
                  </h2>
                  <div
                    className="filters"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <input
                      className="input"
                      placeholder="キーワード検索（名前・コメント・タグ・エリア）"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, search: e.target.value }))
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <select
                        className="input"
                        style={{ flex: 1, minWidth: "120px" }}
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value as typeof filters.status,
                          }))
                        }
                      >
                        <option value="all">すべて</option>
                        <option value="visited">行った</option>
                        <option value="wishlist">行きたい</option>
                      </select>
                      <select
                        className="input"
                        style={{ flex: 1, minWidth: "120px" }}
                        value={filters.sort}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            sort: e.target.value as typeof filters.sort,
                          }))
                        }
                      >
                        <option value="recent">新しい順</option>
                        <option value="oldest">古い順</option>
                        <option value="ratingDesc">満足度が高い順</option>
                        <option value="ratingAsc">満足度が低い順</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>最低満足度</label>
                      <select
                        className="input"
                        style={{ maxWidth: "120px" }}
                        value={filters.minRating}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minRating: Number(e.target.value),
                          }))
                        }
                      >
                        <option value={0}>指定なし</option>
                        <option value={1}>★1以上</option>
                        <option value={2}>★2以上</option>
                        <option value={3}>★3以上</option>
                        <option value={4}>★4以上</option>
                        <option value={5}>★5のみ</option>
                      </select>
                    </div>
                  </div>
                  {visits.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: "center", marginTop: "2rem" }}>
                      まだ投稿がありません。<br />新しいピンを立ててみましょう！
                    </p>
                  ) : filteredVisits.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: "center", marginTop: "2rem" }}>
                      条件に合うサウナがありません。<br />
                      フィルタ条件を見直してみてください。
                    </p>
                  ) : (
                    filteredVisits.map((visit) => (
                      <div key={visit.id} className="sauna-card" onClick={() => startEditing(visit)}>
                        <h3 style={{ color: "var(--foreground)", marginBottom: "0.25rem" }}>
                          {visit.name}
                          {(visit.status ?? "visited") === "wishlist" && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>🏷 行きたい</span>
                          )}
                        </h3>
                        {visit.area && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              opacity: 0.75,
                              marginBottom: "0.25rem",
                            }}
                          >
                            {visit.area}
                          </div>
                        )}
                        {(visit.rating ?? 0) > 0 && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              marginBottom: "0.25rem",
                              color: "var(--primary)",
                            }}
                          >
                            {"★".repeat(visit.rating ?? 0)}
                            {"☆".repeat(5 - (visit.rating ?? 0))}
                          </div>
                        )}
                        {visit.tags && visit.tags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.25rem",
                              marginBottom: "0.25rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            {visit.tags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  padding: "0.1rem 0.35rem",
                                  borderRadius: "999px",
                                  background: "var(--glass)",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
                          {visit.comment}
                        </p>
                        {visit.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={visit.image} className="sauna-img-preview" alt="" />
                        )}
                        <div
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.5,
                            marginTop: "0.5rem",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                          }}
                        >
                          <span>日付: {visit.date}</span>
                          <span>タップで編集</span>
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
                <label
                  className="btn btn-ghost"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  📤 データを読み込む (JSON)
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        try {
                          const parsed = JSON.parse(reader.result as string) as SaunaVisit[];
                          const existingIds = new Set(visits.map((v) => v.id));
                          const normalizedImported = parsed
                            .map((v) => ({
                              ...v,
                              rating: v.rating ?? 0,
                              tags: v.tags ?? [],
                              status: v.status ?? "visited",
                              area: v.area ?? "",
                            }))
                            .filter((v) => !existingIds.has(v.id));
                          if (normalizedImported.length === 0) {
                            alert("新しく追加されるデータはありませんでした。");
                            return;
                          }
                          saveVisits([...normalizedImported, ...visits]);
                          alert(`データを${normalizedImported.length}件取り込みました。`);
                        } catch (error) {
                          console.error(error);
                          alert("JSONの読み込みに失敗しました。ファイル形式を確認してください。");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            )}
          </aside>
        </div>
      )}

      {isShareViewOpen && (
        <div
          className="share-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsShareViewOpen(false)}
        >
          <div
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "1.5rem",
              borderRadius: "16px",
              width: "min(640px, 90vw)",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "var(--primary)" }}>サウナイッタ シェアビュー</h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "0.25rem" }}>
                  この画面をスクリーンショットしてSNSに投稿できます
                </p>
              </div>
              <button
                onClick={() => setIsShareViewOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "var(--foreground)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.25rem" }}>
                合計サウナ数: <strong>{stats.total}</strong> （行った: {stats.visitedCount} / 行きたい: {stats.wishlistCount}）
              </div>
              {stats.firstDate && stats.lastDate && (
                <div style={{ marginBottom: "0.25rem" }}>
                  記録期間: <strong>{stats.firstDate}</strong> 〜 <strong>{stats.lastDate}</strong>
                </div>
              )}
              {stats.avgRating > 0 && (
                <div>
                  平均満足度: <strong>{stats.avgRating}</strong> / 5
                </div>
              )}
            </div>
            <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem", fontSize: "0.8rem" }}>
              {filteredVisits.slice(0, 30).map((visit) => (
                <div
                  key={visit.id}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div>
                      <strong>{visit.name}</strong>
                      {(visit.status ?? "visited") === "wishlist" && (
                        <span style={{ marginLeft: "0.25rem" }}>🏷 行きたい</span>
                      )}
                      {visit.area && (
                        <span style={{ marginLeft: "0.5rem", opacity: 0.8 }}>{visit.area}</span>
                      )}
                    </div>
                    <span style={{ opacity: 0.7 }}>{visit.date}</span>
                  </div>
                  {(visit.rating ?? 0) > 0 && (
                    <div style={{ marginTop: "0.1rem", color: "var(--primary)" }}>
                      {"★".repeat(visit.rating ?? 0)}
                      {"☆".repeat(5 - (visit.rating ?? 0))}
                    </div>
                  )}
                  {visit.tags && visit.tags.length > 0 && (
                    <div style={{ marginTop: "0.1rem" }}>
                      {visit.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "inline-block",
                            marginRight: "0.25rem",
                            fontSize: "0.75rem",
                            opacity: 0.85,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {visit.comment && (
                    <div style={{ marginTop: "0.15rem", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                      {visit.comment}
                    </div>
                  )}
                </div>
              ))}
              {filteredVisits.length > 30 && (
                <div style={{ marginTop: "0.5rem", textAlign: "center", opacity: 0.7 }}>
                  ほか {filteredVisits.length - 30} 件…
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
