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
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -14],
    });
  }, []);

  if (!location) return null;

  return (
    <>
      {location.accuracy !== undefined && location.accuracy > 0 && (
        <Circle
          center={[location.lat, location.lng]}
          radius={location.accuracy}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            weight: 1.5,
          }}
        />
      )}
      <Marker position={[location.lat, location.lng]} icon={icon}>
        <Popup autoPan={false}>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", textAlign: "center" }}>
            📍 現在地
          </div>
        </Popup>
      </Marker>
    </>
  );
}
