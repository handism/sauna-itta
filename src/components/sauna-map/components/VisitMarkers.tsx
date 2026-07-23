import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Navigation } from "lucide-react";
import { SaunaVisit } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { getSaunaIcon } from "./markerIcon";
import { flameIconSvg } from "./iconSvg";
import { RatingStars, WishlistChip } from "./common";
import Image from "next/image";

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
    const imageUrl = sanitizeImageUrl(visit.image);
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
          <div className="popup-card">
            <h3 className="popup-title">
              {visit.name}
              {isWishlist && <WishlistChip />}
            </h3>
            {visit.area && <div className="popup-area">{visit.area}</div>}
            <RatingStars rating={visit.rating ?? 0} className="popup-rating" />
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={visit.name}
                className="popup-image"
                width={400}
                height={300}
                unoptimized
              />
            )}
            <p className="popup-comment">{visit.comment}</p>
            <small className="popup-meta">
              {visit.date}
              {visitCount > 1 && <span>・{visitCount}回目</span>}
            </small>
            <a
              href={getDirectionsUrl(visit.lat, visit.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-link"
            >
              <span className="popup-link-icon"><Navigation size={14} /></span>
              <span className="popup-link-text">ここへ行く</span>
            </a>
            <button onClick={() => onEdit(visit)} className="popup-edit-btn">
              編集する
            </button>
          </div>
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
