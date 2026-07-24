import { MapClusterControl } from "./MapClusterControl";
import { MapZoomControl } from "./MapZoomControl";
import { LocationControl } from "./LocationControl";

interface MapTopRightControlsProps {
  enableClustering: boolean;
  onToggleClustering: () => void;
  onNotify?: (message: string, tone?: "info" | "success" | "error") => void;
}

export function MapTopRightControls({
  enableClustering,
  onToggleClustering,
  onNotify,
}: MapTopRightControlsProps) {
  return (
    <div className="map-top-right-controls">
      <MapClusterControl
        enableClustering={enableClustering}
        onToggleClustering={onToggleClustering}
      />
      <MapZoomControl />
      <LocationControl onNotify={onNotify} />
    </div>
  );
}
