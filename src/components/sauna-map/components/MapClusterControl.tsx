"use client";

import { Layers } from "lucide-react";

interface MapClusterControlProps {
  enableClustering: boolean;
  onToggleClustering: () => void;
}

export function MapClusterControl({
  enableClustering,
  onToggleClustering,
}: MapClusterControlProps) {
  return (
    <div className="map-cluster-control" style={{ position: "absolute", zIndex: 1000 }}>
      <button
        type="button"
        onClick={onToggleClustering}
        className={`map-cluster-control-btn ${enableClustering ? "map-cluster-control-btn--active" : ""}`}
        aria-label={enableClustering ? "ピンの集約を解除" : "ピンをまとめて集約"}
        title={enableClustering ? "ピンの集約を解除" : "ピンをまとめて集約（クラスタリング）"}
      >
        <span className="map-cluster-control-icon"><Layers size={15} /></span>
        <span className="map-cluster-control-text">{enableClustering ? "集約 ON" : "集約 OFF"}</span>
      </button>
    </div>
  );
}
