"use client";

import { useMap } from "react-leaflet";
import { Plus, Minus } from "lucide-react";
import { MapControlButton } from "./MapControlButton";

export function MapZoomControl() {
  const map = useMap();

  return (
    <div className="map-zoom-control">
      <div className="leaflet-control-zoom">
        <MapControlButton
          className="leaflet-control-zoom-in"
          onClick={() => map.zoomIn()}
          ariaLabel="拡大"
          title="拡大"
        >
          <Plus size={18} />
        </MapControlButton>
        <MapControlButton
          className="leaflet-control-zoom-out"
          onClick={() => map.zoomOut()}
          ariaLabel="縮小"
          title="縮小"
        >
          <Minus size={18} />
        </MapControlButton>
      </div>
    </div>
  );
}
