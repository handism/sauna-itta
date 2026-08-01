"use client";

import { useMemo } from "react";
import { Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import { CurrentLocation } from "../types";

interface CurrentLocationMarkerProps {
  location: CurrentLocation | null;
}

export function CurrentLocationMarker({ location }: CurrentLocationMarkerProps) {
  const icon = useMemo(() => {
    return L.divIcon({
      className: "current-location-marker-wrapper",
      html: `
        <div class="current-location-marker">
          <div class="current-location-pulse"></div>
          <div class="current-location-dot"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -16],
    });
  }, []);

  if (!location) return null;

  // 精度範囲（メートル）。極端に巨大な精度円による表示崩れを防ぐため上限を設定
  const displayAccuracy = location.accuracy ? Math.min(location.accuracy, 2000) : undefined;

  return (
    <>
      {displayAccuracy !== undefined && displayAccuracy > 0 && (
        <Circle
          center={[location.lat, location.lng]}
          radius={displayAccuracy}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.08,
            weight: 1,
            dashArray: "4, 4",
          }}
        />
      )}
      <Marker position={[location.lat, location.lng]} icon={icon}>
        <Popup autoPan={false}>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", textAlign: "center", padding: "2px 4px" }}>
            📍 現在地
          </div>
        </Popup>
      </Marker>
    </>
  );
}
