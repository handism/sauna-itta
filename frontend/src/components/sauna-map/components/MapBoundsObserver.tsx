"use client";

import { useEffect, useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import { LatLng } from "../types";

interface MapBoundsObserverProps {
  onBoundsChange: (bounds: { northEast: LatLng; southWest: LatLng }) => void;
}

export function MapBoundsObserver({ onBoundsChange }: MapBoundsObserverProps) {
  const handleBoundsUpdate = useCallback(
    (map: L.Map) => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange({
        northEast: { lat: ne.lat, lng: ne.lng },
        southWest: { lat: sw.lat, lng: sw.lng },
      });
    },
    [onBoundsChange]
  );

  const map = useMapEvents({
    moveend: () => {
      handleBoundsUpdate(map);
    },
    zoomend: () => {
      handleBoundsUpdate(map);
    },
  });

  useEffect(() => {
    handleBoundsUpdate(map);
  }, [map, handleBoundsUpdate]);

  return null;
}
