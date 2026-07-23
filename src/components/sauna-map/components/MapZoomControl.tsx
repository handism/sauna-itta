"use client";

import { useMap } from "react-leaflet";
import { Plus, Minus } from "lucide-react";

export function MapZoomControl() {
  const map = useMap();

  return (
    <div className="map-zoom-control">
      <div className="leaflet-control-zoom">
        <button
          type="button"
          className="leaflet-control-zoom-in"
          onClick={() => map.zoomIn()}
          aria-label="拡大"
          title="拡大"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          className="leaflet-control-zoom-out"
          onClick={() => map.zoomOut()}
          aria-label="縮小"
          title="縮小"
        >
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}
