"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLng } from "../types";

interface MapControllerProps {
  target: LatLng | null;
  isMobile?: boolean;
}

export function MapController({ target, isMobile = false }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = currentZoom < 14 ? 14 : currentZoom;

    // モバイル表示の際、下部のBottomSheetに隠れないよう緯度を少し南へオフセット（マーカーを画面上寄りに表示）
    const latOffset = isMobile ? (nextZoom >= 15 ? 0.0025 : 0.0045) : 0;
    const targetCenter: [number, number] = [target.lat - latOffset, target.lng];

    map.flyTo(targetCenter, nextZoom, {
      duration: 1.2,
    });
  }, [target, isMobile, map]);

  return null;
}
