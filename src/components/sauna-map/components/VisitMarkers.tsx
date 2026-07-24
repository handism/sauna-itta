import { memo, useCallback } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { SaunaVisit } from "../types";
import { getVisitCount } from "../utils";
import { getSaunaIcon } from "./markerIcon";
import { flameIconSvg } from "./iconSvg";
import { SaunaMarkerPopup } from "./SaunaMarkerPopup";

interface VisitMarkersProps {
  visits: SaunaVisit[];
  editingId: string | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  showBadges?: boolean;
  enableClustering?: boolean;
  onEdit: (visit: SaunaVisit) => void;
  onSelectVisit?: (visit: SaunaVisit) => void;
}

interface MarkerClusterLike {
  getChildCount(): number;
}

const clusterIconCache = new Map<number, L.DivIcon>();

const createCustomClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  const cached = clusterIconCache.get(count);
  if (cached) return cached;

  let sizeClass = "sauna-cluster--small";
  if (count >= 20) {
    sizeClass = "sauna-cluster--large";
  } else if (count >= 5) {
    sizeClass = "sauna-cluster--medium";
  }

  const icon = L.divIcon({
    html: `<div class="sauna-cluster ${sizeClass}"><span class="sauna-cluster-icon">${flameIconSvg(16)}</span><span class="sauna-cluster-count">${count}</span></div>`,
    className: "custom-cluster-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

  clusterIconCache.set(count, icon);
  return icon;
};

function VisitMarkersComponent({
  visits,
  editingId,
  selectedId,
  hoveredId,
  showBadges = false,
  enableClustering = true,
  onEdit,
  onSelectVisit,
}: VisitMarkersProps) {
  const renderMarker = useCallback(
    (visit: SaunaVisit) => {
      const visitCount = getVisitCount(visit);
      const isHovered = visit.id === hoveredId;
      const isSelected = visit.id === selectedId;
      const isWishlist = (visit.status ?? "visited") === "wishlist";

      return (
        <Marker
          key={visit.id}
          position={[visit.lat, visit.lng]}
          zIndexOffset={
            isSelected ? 1000 : isHovered ? 500 : isWishlist ? 100 : undefined
          }
          icon={getSaunaIcon({
            selected: visit.id === editingId || isSelected,
            wishlist: isWishlist,
            hovered: isHovered,
            rating: visit.rating,
            visitCount,
            showBadges,
          })}
          eventHandlers={{
            click: () => onSelectVisit?.(visit),
          }}
        >
          <Popup autoPan={false}>
            <SaunaMarkerPopup
              visit={visit}
              isWishlist={isWishlist}
              onEdit={onEdit}
            />
          </Popup>
        </Marker>
      );
    },
    [editingId, hoveredId, onEdit, onSelectVisit, selectedId, showBadges],
  );

  if (!enableClustering) {
    return <>{visits.map(renderMarker)}</>;
  }

  const priorityVisits: SaunaVisit[] = [];
  const normalVisits: SaunaVisit[] = [];

  visits.forEach((visit) => {
    const isSelected = visit.id === selectedId || visit.id === editingId;
    const isWishlist = (visit.status ?? "visited") === "wishlist";
    if (isSelected || isWishlist) {
      priorityVisits.push(visit);
    } else {
      normalVisits.push(visit);
    }
  });

  return (
    <>
      <MarkerClusterGroup
        iconCreateFunction={createCustomClusterIcon}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        maxClusterRadius={50}
      >
        {normalVisits.map(renderMarker)}
      </MarkerClusterGroup>
      {priorityVisits.map(renderMarker)}
    </>
  );
}

const areVisitsEqual = (
  a: import("../types").SaunaVisit[],
  b: import("../types").SaunaVisit[],
) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].lat !== b[i].lat || a[i].lng !== b[i].lng) return false;
  }
  return true;
};

const propsAreEqual = (prev: VisitMarkersProps, next: VisitMarkersProps) => {
  if (prev.editingId !== next.editingId) return false;
  if (prev.selectedId !== next.selectedId) return false;
  if (prev.hoveredId !== next.hoveredId) return false;
  if (prev.showBadges !== next.showBadges) return false;
  if (prev.enableClustering !== next.enableClustering) return false;
  if (prev.onEdit !== next.onEdit) return false;
  if (prev.onSelectVisit !== next.onSelectVisit) return false;
  if (!areVisitsEqual(prev.visits, next.visits)) return false;
  return true;
};

export const VisitMarkers = memo(VisitMarkersComponent, propsAreEqual);
