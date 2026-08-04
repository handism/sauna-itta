import { MapClusterControl } from "./MapClusterControl";
import { MapZoomControl } from "./MapZoomControl";
import { LocationControl } from "./LocationControl";
import { CurrentLocation } from "../../types";

interface MapTopRightControlsProps {
  enableClustering: boolean;
  onToggleClustering: () => void;
  onLocationFound?: (location: CurrentLocation) => void;
  onNotify?: (message: string, tone?: "info" | "success" | "error") => void;
}

export function MapTopRightControls({
  enableClustering,
  onToggleClustering,
  onLocationFound,
  onNotify,
}: MapTopRightControlsProps) {
  return (
    <div className="map-top-right-controls">
      <MapClusterControl
        enableClustering={enableClustering}
        onToggleClustering={onToggleClustering}
      />
      <MapZoomControl />
      <LocationControl onLocationFound={onLocationFound} onNotify={onNotify} />
    </div>
  );
}
