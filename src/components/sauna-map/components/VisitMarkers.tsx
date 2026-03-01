import { Marker, Popup } from "react-leaflet";
import { SaunaVisit } from "../types";
import { getDirectionsUrl } from "../utils";
import { getSaunaIcon } from "./markerIcon";

interface VisitMarkersProps {
  visits: SaunaVisit[];
  editingId: string | null;
  onEdit: (visit: SaunaVisit) => void;
}

export function VisitMarkers({ visits, editingId, onEdit }: VisitMarkersProps) {
  return (
    <>
      {visits.map((visit) => (
        <Marker
          key={visit.id}
          position={[visit.lat, visit.lng]}
          icon={getSaunaIcon({
            selected: visit.id === editingId,
            wishlist: (visit.status ?? "visited") === "wishlist",
          })}
        >
          <Popup>
            <div className="popup-card">
              <h3 className="popup-title">
                {visit.name}
                {(visit.status ?? "visited") === "wishlist" && (
                  <span className="wishlist-chip">🏷 行きたい</span>
                )}
              </h3>
              {visit.area && <div className="popup-area">{visit.area}</div>}
              {(visit.rating ?? 0) > 0 && (
                <div className="popup-rating">
                  {"★".repeat(visit.rating ?? 0)}
                  {"☆".repeat(5 - (visit.rating ?? 0))}
                </div>
              )}
              {visit.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visit.image} alt={visit.name} className="popup-image" />
              )}
              <p className="popup-comment">{visit.comment}</p>
              <small className="popup-meta">
                {visit.date}
                {(visit.visitCount ?? 1) > 1 && <span>・{visit.visitCount}回目</span>}
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
      ))}
    </>
  );
}
