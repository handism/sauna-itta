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
    <div className="map-cluster-control">
      <button
        type="button"
        onClick={onToggleClustering}
        className={`map-cluster-control-btn ${enableClustering ? "map-cluster-control-btn--active" : ""}`}
        aria-label={enableClustering ? "ピンの集約を解除" : "ピンをまとめて集約"}
        title={enableClustering ? "ピンの集約を解除（クラスタリング）" : "ピンをまとめて集約（クラスタリング）"}
      >
        <Layers size={18} />
      </button>
    </div>
  );
}
