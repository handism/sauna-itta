import { Navigation } from "lucide-react";
import { SaunaVisit } from "../../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../../utils";
import { RatingStars, VisitImagePreview, WishlistChip } from "../common/common";

interface SaunaMarkerPopupProps {
  visit: SaunaVisit;
  isWishlist: boolean;
  onEdit: (visit: SaunaVisit) => void;
  onOpenImage?: (src: string) => void;
}

export function SaunaMarkerPopup({ visit, isWishlist, onEdit, onOpenImage }: SaunaMarkerPopupProps) {
  const visitCount = getVisitCount(visit);
  const imageUrl = sanitizeImageUrl(visit.image);

  return (
    <div className="popup-card">
      <h3 className="popup-title">
        {visit.name}
        {isWishlist && <WishlistChip />}
      </h3>
      {visit.area && <div className="popup-area">{visit.area}</div>}
      <RatingStars rating={visit.rating ?? 0} className="popup-rating" />
      <VisitImagePreview
        src={imageUrl}
        alt={`${visit.name}の写真`}
        onOpenImage={onOpenImage || (() => {})}
      />
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
        <span className="popup-link-icon">
          <Navigation size={14} />
        </span>
        <span className="popup-link-text">ここへ行く</span>
      </a>
      <button onClick={() => onEdit(visit)} className="popup-edit-btn">
        編集する
      </button>
    </div>
  );
}
