import { Pencil } from "lucide-react";
import { SaunaVisit } from "../../types";
import { getVisitCount, sanitizeImageUrl } from "../../utils";
import {
  RatingStars,
  RouteLink,
  VisitComment,
  VisitImagePreview,
  VisitMetaInfo,
  WishlistChip,
} from "../common/common";

interface SaunaMarkerPopupProps {
  visit: SaunaVisit;
  isWishlist: boolean;
  onEdit: (visit: SaunaVisit) => void;
  onOpenImage?: (src: string) => void;
}

/**
 * 地図マーカーのポップアップ。日付・訪問回数・経路リンク・コメントは一覧カードと同じ
 * 共通部品を使い、文言と表示の条件を揃える（個別に組むと片方だけ表記が変わる）。
 */
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
      <VisitComment text={visit.comment} className="popup-comment" />
      <VisitMetaInfo date={visit.date} visitCount={visitCount} className="popup-meta" />
      <RouteLink lat={visit.lat} lng={visit.lng} className="route-link popup-link" />
      <button
        type="button"
        onClick={() => onEdit(visit)}
        className="popup-edit-btn"
        aria-label={`${visit.name}の記録を編集`}
        title="記録を編集"
      >
        <Pencil size={14} aria-hidden="true" /> 編集
      </button>
    </div>
  );
}
