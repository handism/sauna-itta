"use client";

import { Layers } from "lucide-react";
import { MapControlButton } from "./MapControlButton";

interface MapClusterControlProps {
  enableClustering: boolean;
  onToggleClustering: () => void;
}

export function MapClusterControl({
  enableClustering,
  onToggleClustering,
}: MapClusterControlProps) {
  return (
    <div className="map-cluster-control">
      <MapControlButton
        onClick={onToggleClustering}
        active={enableClustering}
        className="map-cluster-control-btn"
        ariaLabel={enableClustering ? "ピンの集約を解除" : "ピンをまとめて集約"}
        title={enableClustering ? "ピンの集約を解除（クラスタリング）" : "ピンをまとめて集約（クラスタリング）"}
      >
        <Layers size={18} />
      </MapControlButton>
    </div>
  );
}
