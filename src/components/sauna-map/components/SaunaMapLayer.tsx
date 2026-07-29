import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { getSaunaIcon } from "./markerIcon";
import { CurrentLocationMarker } from "./CurrentLocationMarker";
import { LocationPicker } from "./LocationPicker";
import { MapBoundsObserver } from "./MapBoundsObserver";
import { MapController } from "./MapController";
import { MapTopRightControls } from "./MapTopRightControls";
import { VisitMarkers } from "./VisitMarkers";
import { ZoomObserver } from "./ZoomObserver";
import { CurrentLocation } from "../types";
import {
  useSaunaUI,
  useVisitFiltersContext,
  useSaunaEditor,
  useSaunaMapState,
} from "../context";

interface SaunaMapLayerProps {
  currentLocation: CurrentLocation | null;
  setCurrentLocation: (loc: CurrentLocation | null) => void;
}

export function SaunaMapLayer({
  currentLocation,
  setCurrentLocation,
}: SaunaMapLayerProps) {
  const { isMobile, showToast } = useSaunaUI();
  const { filteredVisits } = useVisitFiltersContext();
  const {
    editingId,
    selectedLocation,
    isCreating,
    handleLocationSelect,
    handleBoundsChange,
  } = useSaunaEditor();
  const {
    hoveredId,
    selectedId,
    activeMapTarget,
    handleZoomChange,
    enableClustering,
    toggleClustering,
    showBadges,
    handleSelectVisit,
    handleEditVisit,
  } = useSaunaMapState();

  return (
    <div className="map-container" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <MapContainer
        center={[36.0, 138.0]}
        zoom={6}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapTopRightControls
          enableClustering={enableClustering}
          onToggleClustering={toggleClustering}
          onLocationFound={setCurrentLocation}
          onNotify={showToast}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        <MapController target={activeMapTarget} isMobile={isMobile} />
        <ZoomObserver onZoomChange={handleZoomChange} />
        <MapBoundsObserver onBoundsChange={handleBoundsChange} />
        <CurrentLocationMarker location={currentLocation} />
        <VisitMarkers
          visits={filteredVisits}
          editingId={editingId}
          selectedId={selectedId}
          hoveredId={hoveredId}
          showBadges={showBadges}
          enableClustering={enableClustering}
          onEdit={handleEditVisit}
          onSelectVisit={handleSelectVisit}
        />

        {isCreating && <LocationPicker onLocationSelect={handleLocationSelect} />}

        {selectedLocation && !editingId && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={getSaunaIcon({ selected: true })}
          >
            <Popup autoPan={false}>ここにピンを立てますか？</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
