import { memo } from "react";
import { Pencil, X } from "lucide-react";
import { getVisitCount, sanitizeImageUrl } from "../utils";
import { VisitItemProps, areVisitItemPropsEqual } from "./visitItem";
import {
  RatingStars,
  RouteLink,
  VisitImagePreview,
  VisitMetaInfo,
  VisitTagList,
  WishlistChip,
} from "./common";

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

  return (
    // カードは編集ボタン・タグ・経路リンクを内包するため、カード自体を role="button" に
    // すると対話要素の入れ子になる。キーボード／支援技術からの選択は見出し内のボタンが担い、
    // ここでのクリックはポインタ操作の利便性のための補助に留める。
    <div
      data-visit-id={visit.id}
      className={`sauna-card ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelectVisit?.(visit)}
      onMouseEnter={() => onHoverVisit?.(visit.id)}
      onMouseLeave={() => onHoverVisit?.(null)}
    >
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
            {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
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
              title="選択を解除"
              aria-label="選択を解除"
            >
              <X size={13} /> 解除
            </button>
          )}
          <button
            type="button"
            className="sauna-card-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(visit);
            }}
            title="記録を編集"
          >
            <Pencil size={14} /> 編集
          </button>
        </div>
      </div>
      {visit.area && <div className="sauna-card-area">{visit.area}</div>}
      <RatingStars rating={visit.rating ?? 0} className="sauna-card-rating" />
      <VisitTagList
        tags={visit.tags}
        onSelectTag={(tag) => setFilters((prev) => ({ ...prev, search: tag }))}
      />
      <p className="sauna-card-comment">{visit.comment}</p>
      <VisitImagePreview
        src={imageSrc}
        alt={`${visit.name}の写真`}
        onOpenImage={onOpenImage}
      />
      <VisitMetaInfo date={visit.date} visitCount={visitCount} />
      <RouteLink lat={visit.lat} lng={visit.lng} />
    </div>
  );
}

export const VisitCardItem = memo(VisitCardItemComponent, areVisitItemPropsEqual);
