"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLng } from "../types";

interface MapControllerProps {
  target: LatLng | null;
}

export function MapController({ target }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const currentZoom = map.getZoom();
    const nextZoom = currentZoom < 8 ? 8 : currentZoom;
    map.flyTo([target.lat, target.lng], nextZoom);
  }, [target, map]);

  return null;
}
