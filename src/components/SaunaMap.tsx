"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
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
  visitCount?: number;
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
// エリア文字列から都道府県名を抽出（例: "東京都 台東区 上野" → "東京都"）
function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
  const first = s.split(/\s/)[0];
  return /[都道府県]$/.test(first) ? first : null;
}

// サウナの緯度経度で Google Maps の「ここへ行く」URL を生成
function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function normalizeVisits(visits: SaunaVisit[]): SaunaVisit[] {
  return visits.map((v) => ({
    ...v,
    rating: v.rating ?? 0,
    tags: v.tags ?? [],
    status: v.status ?? "visited",
    area: v.area ?? "",
    visitCount: Math.max(1, v.visitCount ?? 1),
  }));
}

function getInitialVisits(): SaunaVisit[] {
  const baseVisits = normalizeVisits(initialVisits as SaunaVisit[]);
  if (typeof window === "undefined") {
    return baseVisits;
  }

  const savedVisits = localStorage.getItem("sauna-itta_visits");
  if (!savedVisits) {
    return baseVisits;
  }

  try {
    const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
    const normalizedSaved = normalizeVisits(parsedSaved);
    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customVisits = normalizedSaved.filter((v) => !initialIds.has(v.id));
    return [...customVisits, ...baseVisits];
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return baseVisits;
  }
}

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }
  const savedTheme = localStorage.getItem("sauna-itta_theme");
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
}

function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

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

// 現在地ボタン: クリックで現在地に地図を飛ばす
function LocationControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14);
        setLocating(false);
      },
      () => {
        setError("位置情報を取得できませんでした");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [map]);

  return (
    <div className="location-control" style={{
      position: "absolute",
      top: "2rem",
      right: "2rem",
      zIndex: 1000,
    }}>
      {error && (
        <div style={{ marginBottom: "0.25rem", fontSize: "0.7rem", color: "var(--error)", maxWidth: "140px" }}>
          {error}
        </div>
      )}
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
    </div>
  );
}

export default function SaunaMap() {
  const [visits, setVisits] = useState<SaunaVisit[]>(getInitialVisits);
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
    visitCount: number;
  }>({
    name: "",
    comment: "",
    image: "",
    date: "",
    rating: 0,
    tagsText: "",
    status: "visited",
    area: "",
    visitCount: 1,
  });
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!getInitialIsMobile());
  const [isMobile] = useState(getInitialIsMobile);
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
      visitCount: 1,
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
      visitCount: Math.max(1, visit.visitCount ?? 1),
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
      visitCount: 1,
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
          visitCount: Math.max(1, form.visitCount),
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
        visitCount: Math.max(1, form.visitCount),
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
        prefectures: [] as string[],
        prefectureCount: 0,
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
    const prefectures = Array.from(
      new Set(
        visits
          .filter((v) => (v.status ?? "visited") === "visited")
          .map((v) => extractPrefecture(v.area))
          .filter((p): p is string => p != null)
      )
    ).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      total,
      visitedCount,
      wishlistCount,
      firstDate,
      lastDate,
      avgRating,
      uniqueAreas: areas.size,
      prefectures,
      prefectureCount: prefectures.length,
    };
  }, [visits]);

  const isFilterActive =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.minRating > 0 ||
    filters.sort !== "recent";

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      minRating: 0,
      sort: "recent",
    });
  };

  // モバイルでの「場所待ち」状態: サイドバーを非表示にして地図を全面に
  const isMobilePickingLocation = isMobile && isAdding && !editingId && !selectedLocation;

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
          <LocationControl />
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
                <div className="popup-card">
                  <h3 className="popup-title">
                    {visit.name}
                    {(visit.status ?? "visited") === "wishlist" && (
                      <span className="wishlist-chip">🏷 行きたい</span>
                    )}
                  </h3>
                  {visit.area && (
                    <div className="popup-area">
                      {visit.area}
                    </div>
                  )}
                  {(visit.rating ?? 0) > 0 && (
                    <div className="popup-rating">
                      {"★".repeat(visit.rating ?? 0)}
                      {"☆".repeat(5 - (visit.rating ?? 0))}
                    </div>
                  )}
                  {visit.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visit.image}
                      alt={visit.name}
                      className="popup-image"
                    />
                  )}
                  <p className="popup-comment">{visit.comment}</p>
                  <small className="popup-meta">
                    {visit.date}
                    {(visit.visitCount ?? 1) > 1 && (
                      <span>・{visit.visitCount}回目</span>
                    )}
                  </small>
                  <a
                    href={getDirectionsUrl(visit.lat, visit.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="popup-link"
                  >
                    🧭 ここへ行く
                  </a>
                  <button
                    onClick={() => startEditing(visit)}
                    className="popup-edit-btn"
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
        <div className="ui-layer">
          <aside className={`sidebar ${!isSidebarExpanded ? "collapsed" : ""}`}>
            <button
              className="mobile-toggle"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              aria-label="Toggle Sidebar"
            >
              {isSidebarExpanded ? "↓" : "↑"}
            </button>
            <div className="sidebar-header">
              <div className="sidebar-header-main">
                <h1 className="text-primary">サウナイッタ</h1>
                <p>マイととのいマップ</p>
                <div className="sidebar-stats">
                  <span>{stats.total}件</span>
                  <span>行った {stats.visitedCount}</span>
                  <span>行きたい {stats.wishlistCount}</span>
                </div>
              </div>
              <div className="sidebar-actions">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="chip-btn"
                >
                  {theme === "dark" ? "☀️ ライト" : "🌙 ダーク"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareViewOpen(true)}
                  className="chip-btn"
                >
                  📸 シェア用ビュー
                </button>
                <Link href="/stats" className="chip-btn chip-link">
                  📊 詳細スタッツ
                </Link>
              </div>
            </div>

            <div className="sidebar-content">
              {isAdding ? (
                <form onSubmit={handleSubmit}>
                  <h2 className="panel-title mb-2">
                    {editingId ? "サウナの編集" : "新規サウナ登録"}
                  </h2>
                  <p className="panel-subtitle">
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
                    <div className="segmented">
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
                    <div className="rating-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, rating: star })}
                          className="rating-star-btn"
                          aria-label={`${star} star`}
                        >
                          {form.rating >= star ? "★" : "☆"}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, rating: 0 })}
                        className="clear-rating"
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
                      style={{ fontSize: "0.84rem", padding: "0.55rem" }}
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
                    <label>訪問回数</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      className="input"
                      value={form.visitCount}
                      onChange={(e) => setForm({ ...form, visitCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
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

                  <div className="cta-group">
                    <button type="submit" className="btn btn-primary" disabled={!selectedLocation}>
                      保存
                    </button>
                    {editingId && (
                      <button type="button" className="btn btn-danger" onClick={handleDelete}>
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
                  <h2 className="panel-title mb-2">
                    訪れたサウナ ({filteredVisits.length}/{visits.length})
                  </h2>
                  <div className="filters">
                    <input
                      className="input"
                      placeholder="キーワード検索（名前・コメント・タグ・エリア）"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, search: e.target.value }))
                      }
                    />
                    <div className="filters-row">
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
                    <div className="filters-row filters-inline">
                      <label className="filters-label">最低満足度</label>
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
                      {isFilterActive && (
                        <button
                          type="button"
                          className="btn btn-ghost filters-reset"
                          onClick={clearFilters}
                        >
                          フィルター解除
                        </button>
                      )}
                    </div>
                  </div>
                  {visits.length === 0 ? (
                    <p className="empty-state">
                      まだ投稿がありません。<br />新しいピンを立ててみましょう！
                    </p>
                  ) : filteredVisits.length === 0 ? (
                    <p className="empty-state">
                      条件に合うサウナがありません。<br />
                      フィルタ条件を見直してみてください。
                    </p>
                  ) : (
                    filteredVisits.map((visit) => (
                      <div key={visit.id} className="sauna-card" onClick={() => startEditing(visit)}>
                        <h3 className="sauna-card-title">
                          {visit.name}
                          {(visit.status ?? "visited") === "wishlist" && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>🏷 行きたい</span>
                          )}
                        </h3>
                        {visit.area && (
                          <div className="sauna-card-area">
                            {visit.area}
                          </div>
                        )}
                        {(visit.rating ?? 0) > 0 && (
                          <div className="sauna-card-rating">
                            {"★".repeat(visit.rating ?? 0)}
                            {"☆".repeat(5 - (visit.rating ?? 0))}
                          </div>
                        )}
                        {visit.tags && visit.tags.length > 0 && (
                          <div className="sauna-tag-list">
                            {visit.tags.map((tag) => (
                              <span key={tag} className="sauna-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="sauna-card-comment">
                          {visit.comment}
                        </p>
                        {visit.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={visit.image} className="sauna-img-preview" alt="" />
                        )}
                        <div className="sauna-card-meta">
                          <span>日付: {visit.date}</span>
                          {(visit.visitCount ?? 1) > 1 && (
                            <span>訪問 {visit.visitCount}回目</span>
                          )}
                          <span>タップで編集</span>
                        </div>
                        <a
                          href={getDirectionsUrl(visit.lat, visit.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="route-link"
                        >
                          🧭 ここへ行く
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {!isAdding && (
              <div className="sidebar-footer">
                <button className="btn btn-primary" onClick={startNewVisit}>
                  新しいピンを立てる
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={exportData}
                  style={{ fontSize: "0.84rem", padding: "0.56rem" }}
                >
                  📥 データを出力する (GitHub保存用)
                </button>
                <label
                  className="btn btn-ghost"
                  style={{ fontSize: "0.84rem", padding: "0.56rem", textAlign: "center", cursor: "pointer" }}
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
                              visitCount: Math.max(1, v.visitCount ?? 1),
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
        <div className="share-overlay" onClick={() => setIsShareViewOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <div>
                <h2>サウナイッタ シェアビュー</h2>
                <p>
                  この画面をスクリーンショットしてSNSに投稿できます
                </p>
              </div>
              <button
                onClick={() => setIsShareViewOpen(false)}
                className="share-close"
              >
                ✕
              </button>
            </div>
            <div className="share-summary">
              <div>
                合計サウナ数: <strong>{stats.total}</strong> （行った: {stats.visitedCount} / 行きたい: {stats.wishlistCount}）
              </div>
              {stats.firstDate && stats.lastDate && (
                <div>
                  記録期間: <strong>{stats.firstDate}</strong> 〜 <strong>{stats.lastDate}</strong>
                </div>
              )}
              {stats.avgRating > 0 && (
                <div>
                  平均満足度: <strong>{stats.avgRating}</strong> / 5
                </div>
              )}
            </div>
            <div className="share-list">
              {filteredVisits.slice(0, 30).map((visit) => (
                <div key={visit.id} className="share-item">
                  <div className="share-item-top">
                    <div>
                      <strong>{visit.name}</strong>
                      {(visit.status ?? "visited") === "wishlist" && (
                        <span style={{ marginLeft: "0.25rem" }}>🏷 行きたい</span>
                      )}
                      {visit.area && (
                        <span style={{ marginLeft: "0.5rem", opacity: 0.8 }}>{visit.area}</span>
                      )}
                    </div>
                    <span>{visit.date}</span>
                  </div>
                  {(visit.rating ?? 0) > 0 && (
                    <div className="share-rating">
                      {"★".repeat(visit.rating ?? 0)}
                      {"☆".repeat(5 - (visit.rating ?? 0))}
                    </div>
                  )}
                  {visit.tags && visit.tags.length > 0 && (
                    <div className="share-tags">
                      {visit.tags.map((tag) => (
                        <span key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {visit.comment && (
                    <div className="share-comment">
                      {visit.comment}
                    </div>
                  )}
                </div>
              ))}
              {filteredVisits.length > 30 && (
                <div className="share-more">
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
