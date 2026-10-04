import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { getSaunaIcon } from "../common/markerIcon";
import { CurrentLocationMarker } from "./CurrentLocationMarker";
import { InitialViewFitter } from "./InitialViewFitter";
import { LocationPicker } from "./LocationPicker";
import { MapBoundsObserver } from "./MapBoundsObserver";
import { MapController } from "./MapController";
import { MapTopRightControls } from "./MapTopRightControls";
import { SelectedLocationFocus } from "./SelectedLocationFocus";
import { VisitMarkers } from "./VisitMarkers";
import { ZoomObserver } from "./ZoomObserver";
import { CurrentLocation } from "../../types";
import {
  useSaunaViewport,
  useSaunaUIActions,
  useVisitFiltersContext,
  useVisitsData,
  useSaunaEditorState,
  useSaunaEditorActions,
  useSaunaMapState,
} from "../../context";

interface SaunaMapLayerProps {
  currentLocation: CurrentLocation | null;
  setCurrentLocation: (loc: CurrentLocation | null) => void;
}

export function SaunaMapLayer({
  currentLocation,
  setCurrentLocation,
}: SaunaMapLayerProps) {
  // useSaunaUI() は UI 状態全体（トースト・モーダル・メニューの開閉）を購読するため、
  // 通知 1 件でも地図とマーカー全体が再描画される。画面幅と操作関数だけを購読すること
  const { isMobile } = useSaunaViewport();
  const { showToast } = useSaunaUIActions();
  const { filteredVisits } = useVisitFiltersContext();
  // 初期表示の範囲は絞り込み前の全件から決める（「表示範囲内だけ」の絞り込みは地図の範囲から
  // 求めるため、絞り込み後の記録で範囲を決めると循環する）
  const { visits } = useVisitsData();
  const { editingId, selectedLocation, isCreating } = useSaunaEditorState();
  const { handleLocationSelect, handleBoundsChange } = useSaunaEditorActions();
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
        // 記録が読み込まれるまでの仮の表示。読み込み後は InitialViewFitter が記録の範囲へ合わせる
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
        {/*
         * crossOrigin を外さないこと。未指定だとタイルは no-cors で読まれ、Service Worker が
         * 受け取る応答は status 0 の opaque になるため、sw.js のタイルキャッシュ
         * （status 200 のみ保存）に一度も入らずオフラインで地図が出なくなる。
         */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin="anonymous"
          className="dark-map-tiles"
        />

        <InitialViewFitter visits={visits} skip={activeMapTarget != null} />
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
        {isCreating && <SelectedLocationFocus location={selectedLocation} />}

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
