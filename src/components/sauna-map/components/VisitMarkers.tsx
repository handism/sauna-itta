import { Marker, Popup } from "react-leaflet";
import { SaunaVisit } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { getSaunaIcon } from "./markerIcon";
import { RatingStars, WishlistChip } from "./common";
import Image from "next/image";

interface VisitMarkersProps {
  visits: SaunaVisit[];
  editingId: string | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  onEdit: (visit: SaunaVisit) => void;
  onSelectVisit?: (visit: SaunaVisit) => void;
}

export function VisitMarkers({
  visits,
  editingId,
  selectedId,
  hoveredId,
  onEdit,
  onSelectVisit,
}: VisitMarkersProps) {
  return (
    <>
      {visits.map((visit) => {
        const visitCount = getVisitCount(visit);
        const imageUrl = sanitizeImageUrl(visit.image);
        const isHovered = visit.id === hoveredId;
        const isSelected = visit.id === selectedId;
        return (
          <Marker
            key={visit.id}
            position={[visit.lat, visit.lng]}
            zIndexOffset={isSelected ? 1000 : isHovered ? 500 : undefined}
            icon={getSaunaIcon({
              selected: visit.id === editingId || isSelected,
              wishlist: (visit.status ?? "visited") === "wishlist",
              hovered: isHovered,
            })}
            eventHandlers={{
              click: () => onSelectVisit?.(visit),
            }}
          >
            <Popup>
              <div className="popup-card">
                <h3 className="popup-title">
                  {visit.name}
                  {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
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
                  🧭 ここへ行く
                </a>
                <button onClick={() => onEdit(visit)} className="popup-edit-btn">
                  編集する
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
