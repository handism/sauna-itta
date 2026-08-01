"use client";

import { useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import { MapControlButton } from "./MapControlButton";

import { CurrentLocation } from "../types";
import { prefersReducedMotion } from "../utils/motion";

interface LocationControlProps {
  onLocationFound?: (location: CurrentLocation) => void;
  onNotify?: (message: string, tone: "info" | "success" | "error") => void;
}

export function LocationControl({ onLocationFound, onNotify }: LocationControlProps) {
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
        const { latitude, longitude, accuracy } = pos.coords;
        onLocationFound?.({ lat: latitude, lng: longitude, accuracy });
        map.flyTo([latitude, longitude], 14, { animate: !prefersReducedMotion() });
        setLocating(false);
      },
      () => {
        onNotify?.("位置情報を取得できませんでした", "error");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map, onLocationFound, onNotify]);

  return (
    <div className="location-control">
      <MapControlButton
        onClick={handleLocate}
        disabled={locating}
        className="location-control-btn"
        ariaLabel="現在地へ移動"
        title="現在地へ移動"
      >
        {locating ? <Loader2 size={18} className="spin-icon" /> : <LocateFixed size={18} />}
      </MapControlButton>
    </div>
  );
}
