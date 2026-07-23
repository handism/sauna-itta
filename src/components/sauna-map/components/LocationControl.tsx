"use client";

import { useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";

interface LocationControlProps {
  onNotify?: (message: string, tone: "info" | "success" | "error") => void;
}

export function LocationControl({ onNotify }: LocationControlProps) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      onNotify?.("お使いのブラウザは位置情報に対応していません", "error");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14);
        setLocating(false);
      },
      () => {
        onNotify?.("位置情報を取得できませんでした", "error");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map, onNotify]);

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
        {locating ? <Loader2 size={18} className="spin-icon" /> : <LocateFixed size={18} />}
      </button>
    </div>
  );
}
