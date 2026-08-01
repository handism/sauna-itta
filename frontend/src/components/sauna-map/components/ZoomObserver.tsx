import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";

interface ZoomObserverProps {
  onZoomChange: (zoom: number) => void;
}

export function ZoomObserver({ onZoomChange }: ZoomObserverProps) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}
