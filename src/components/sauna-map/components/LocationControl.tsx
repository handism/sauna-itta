"use client";

import { useState, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";

export function LocationControl() {
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
