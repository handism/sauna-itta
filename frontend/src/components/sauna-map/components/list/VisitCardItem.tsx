import { memo } from "react";
import { Pencil, X } from "lucide-react";
import { getDisplayRating, getDisplayTags, getVisitCount, isWishlist, sanitizeImageUrl } from "../../utils";
import { VisitItemProps, areVisitItemPropsEqual } from "./visitItem";
import { RatingStars } from "../common/RatingStars";
import { RevisitButton } from "../common/RevisitButton";
import { RouteLink } from "../common/RouteLink";
import { VisitComment } from "../common/VisitComment";
import { VisitImagePreview } from "../common/VisitImagePreview";
import { VisitMetaInfo } from "../common/VisitMetaInfo";
import { VisitTagList } from "../common/VisitTagList";
import { WishlistChip } from "../common/WishlistChip";
import { cx } from "../../utils/classNames";

function VisitCardItemComponent({
  visit,
  isHovered,
  isSelected,
  onHoverVisit,
  onSelectVisit,
  onDeselectVisit,
  onEdit,
  setFilters,
  onOpenImage,
}: VisitItemProps) {
  const visitCount = getVisitCount(visit);
  const imageSrc = sanitizeImageUrl(visit.image);
  const wishlist = isWishlist(visit);

  return (
    // カードは編集ボタン・タグ・経路リンクを内包するため、カード自体を role="button" に
    // すると対話要素の入れ子になる。キーボード／支援技術からの選択は見出し内のボタンが担い、
    // ここでのクリックはポインタ操作の利便性のための補助に留める。
    <div
      data-visit-id={visit.id}
      className={cx("sauna-card", isHovered && "is-hovered", isSelected && "is-selected")}
      onClick={() => onSelectVisit?.(visit)}
      onMouseEnter={() => onHoverVisit?.(visit.id)}
      onMouseLeave={() => onHoverVisit?.(null)}
    >
      {/*
        写真は記録を思い出す一番の手がかりなので、一覧を眺めたときに目に入るよう先頭に置く。
        コメントの下に置くと、カードを読み進めないと写真があるかどうかも分からない。
      */}
      <VisitImagePreview
        src={imageSrc}
        alt={`${visit.name}の写真`}
        onOpenImage={onOpenImage}
        className="sauna-img-preview-btn--cover"
      />
      <div className="sauna-card-header">
        <h3 className="sauna-card-title">
          <button
            type="button"
            className="sauna-card-select-btn"
            aria-pressed={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelectVisit?.(visit);
            }}
          >
            {visit.name}
            {wishlist && <WishlistChip />}
          </button>
        </h3>
        <div className="sauna-card-actions">
          {isSelected && onDeselectVisit && (
            <button
              type="button"
              className="sauna-card-deselect-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeselectVisit();
              }}
            >
              <X size={13} aria-hidden="true" /> 選択を解除
            </button>
          )}
          <button
            type="button"
            className="sauna-card-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(visit);
            }}
            aria-label={`${visit.name}の記録を編集`}
            title="記録を編集"
          >
            <Pencil size={14} aria-hidden="true" /> 編集
          </button>
        </div>
      </div>
      {/*
        エリアと満足度は 1 行にまとめる。別々の行にすると、カードの上半分が細い行の積み重ねになり、
        一覧を眺めたときに名前と写真以外がどれも同じ重みに見える。
      */}
      <div className="sauna-card-summary">
        {visit.area && <span className="sauna-card-area">{visit.area}</span>}
        <RatingStars rating={getDisplayRating(visit)} className="sauna-card-rating" showUnrated={!wishlist} />
      </div>
      <VisitTagList
        tags={getDisplayTags(visit)}
        onSelectTag={(tag) => setFilters((prev) => ({ ...prev, selectedTag: tag }))}
      />
      <VisitComment text={visit.comment} className="sauna-card-comment" />
      <VisitMetaInfo date={visit.date} visitCount={visitCount} isWishlist={wishlist} />
      {/*
        経路と「また行った」は選んだカードにだけ出す（コンパクト行の展開時と同じ）。
        全カードに枠線のボタンが 2 つずつ並ぶと、一覧の大半がボタンの列になって記録の中身が埋もれる。
        カードはどこを押しても選択されるため、1 回押せば届く。
      */}
      {isSelected && (
        <div className="sauna-card-footer-actions">
          <RouteLink lat={visit.lat} lng={visit.lng} />
          <RevisitButton
            visitName={visit.name}
            isWishlist={wishlist}
            onRevisit={() => onEdit(visit, { revisit: true })}
          />
        </div>
      )}
    </div>
  );
}

export const VisitCardItem = memo(VisitCardItemComponent, areVisitItemPropsEqual);
