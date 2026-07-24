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

const createCustomClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  let sizeClass = "sauna-cluster--small";
  if (count >= 20) {
    sizeClass = "sauna-cluster--large";
  } else if (count >= 5) {
    sizeClass = "sauna-cluster--medium";
  }

  return L.divIcon({
    html: `<div class="sauna-cluster ${sizeClass}"><span class="sauna-cluster-icon">${flameIconSvg(16)}</span><span class="sauna-cluster-count">${count}</span></div>`,
    className: "custom-cluster-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

export function VisitMarkers({
  visits,
  editingId,
  selectedId,
  hoveredId,
  showBadges = false,
  enableClustering = true,
  onEdit,
  onSelectVisit,
}: VisitMarkersProps) {
  const renderMarker = (visit: SaunaVisit) => {
    const visitCount = getVisitCount(visit);
    const isHovered = visit.id === hoveredId;
    const isSelected = visit.id === selectedId;
    const isWishlist = (visit.status ?? "visited") === "wishlist";

    return (
      <Marker
        key={visit.id}
        position={[visit.lat, visit.lng]}
        zIndexOffset={isSelected ? 1000 : isHovered ? 500 : isWishlist ? 100 : undefined}
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
          <SaunaMarkerPopup visit={visit} isWishlist={isWishlist} onEdit={onEdit} />
        </Popup>
      </Marker>
    );
  };

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
