import { Pencil } from "lucide-react";
import { EditVisitHandler, SaunaVisit } from "../../types";
import { getDisplayRating, getDisplayTags, getVisitCount, sanitizeImageUrl } from "../../utils";
import { RatingStars } from "../common/RatingStars";
import { RevisitButton } from "../common/RevisitButton";
import { RouteLink } from "../common/RouteLink";
import { VisitComment } from "../common/VisitComment";
import { VisitImagePreview } from "../common/VisitImagePreview";
import { VisitMetaInfo } from "../common/VisitMetaInfo";
import { VisitTagList } from "../common/VisitTagList";
import { WishlistChip } from "../common/WishlistChip";

interface SaunaMarkerPopupProps {
  visit: SaunaVisit;
  isWishlist: boolean;
  onEdit: EditVisitHandler;
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
      {/* 一覧カードと同じく、写真があれば先頭に置く */}
      <VisitImagePreview
        src={imageUrl}
        alt={`${visit.name}の写真`}
        onOpenImage={onOpenImage || (() => {})}
        className="sauna-img-preview-btn--cover"
      />
      <h3 className="popup-title">
        {visit.name}
        {isWishlist && <WishlistChip />}
      </h3>
      {visit.area && <div className="popup-area">{visit.area}</div>}
      <RatingStars rating={getDisplayRating(visit)} className="popup-rating" showUnrated={!isWishlist} />
      {/* タグは一覧カードと揃えて出す。ポップアップからはタグの絞り込みを持たないため表示だけ */}
      <VisitTagList tags={getDisplayTags(visit)} />
      <VisitComment text={visit.comment} className="popup-comment" />
      <VisitMetaInfo
        date={visit.date}
        visitCount={visitCount}
        isWishlist={isWishlist}
        className="popup-meta"
      />
      <RouteLink lat={visit.lat} lng={visit.lng} className="route-link popup-link" />
      {/* 地図から開いたときに一番多い操作は再訪の記録なので、塗りのボタンはこちらにする */}
      <RevisitButton
        visitName={visit.name}
        isWishlist={isWishlist}
        onRevisit={() => onEdit(visit, { revisit: true })}
        className="revisit-btn--primary popup-revisit-btn"
      />
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
