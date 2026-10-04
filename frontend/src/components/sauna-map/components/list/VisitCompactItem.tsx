import { memo } from "react";
import Image from "next/image";
import { ChevronRight, ChevronUp, Pencil } from "lucide-react";
import { formatShortDate, getDisplayRating, getDisplayTags, getVisitCount, isWishlist, sanitizeImageUrl } from "../../utils";
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

function VisitCompactItemComponent({
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
  const thumbSrc = sanitizeImageUrl(visit.image);
  const wishlist = isWishlist(visit);

  return (
    <div
      data-visit-id={visit.id}
      className={cx("sauna-compact-item", isHovered && "is-hovered", isSelected && "is-selected")}
      onMouseEnter={() => onHoverVisit?.(visit.id)}
      onMouseLeave={() => onHoverVisit?.(null)}
    >
      <div className="sauna-compact-header">
        {/*
          開閉トグルは見出しの中のボタンとして持たせる（WAI-ARIA のアコーディオンパターン）。
          編集ボタンをトグルの内側に置くとボタンの入れ子になるため、必ず兄弟要素にすること。
          button の子は phrasing content に限られるので中身は span で構成する。
        */}
        <h3 className="sauna-compact-heading">
          <button
            type="button"
            className="sauna-compact-toggle"
            aria-expanded={isSelected}
            aria-label={`${visit.name}の情報を${isSelected ? "折りたたむ" : "展開する"}`}
            onClick={() => {
              if (isSelected) {
                onDeselectVisit?.();
              } else {
                onSelectVisit?.(visit);
              }
            }}
          >
            <span className="sauna-compact-main-info">
              <span
                className={cx("sauna-compact-chevron", isSelected && "is-expanded")}
                aria-hidden="true"
              >
                <ChevronRight size={14} />
              </span>
              <span className="sauna-compact-text">
                {/*
                  1 行目は施設名だけにする。エリアを同じ行へ並べると、縮まないエリアに押されて
                  施設名がほとんど読めないほど省略される。
                */}
                <span className="sauna-compact-title">{visit.name}</span>
                {/*
                  2 行目はエリアと「何回・いつ行ったか」。行きたい記録も同じ 2 行構成にして、
                  一覧の行の高さを揃える。省略されるのはエリアだけ（回数・日付は縮めない）。
                */}
                <span className="sauna-compact-meta">
                  {wishlist && <WishlistChip compact />}
                  {visit.area && <span className="sauna-compact-area">{visit.area}</span>}
                  {!wishlist && visit.date && (
                    <span className="sauna-compact-visits">
                      {visitCount}回 · 最終 {formatShortDate(visit.date)}
                    </span>
                  )}
                </span>
              </span>
            </span>
            <span className="sauna-compact-side-info">
              {thumbSrc && (
                <Image src={thumbSrc} className="sauna-compact-thumb" alt="" width={28} height={28} unoptimized />
              )}
              <RatingStars rating={getDisplayRating(visit)} className="sauna-compact-rating" />
            </span>
          </button>
        </h3>
        <button
          type="button"
          className="sauna-card-edit-btn compact-edit-btn"
          onClick={() => onEdit(visit)}
          aria-label={`${visit.name}の記録を編集`}
          title="記録を編集"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
      </div>

      {isSelected && (
        <div className="sauna-compact-body">
          <VisitTagList
            tags={getDisplayTags(visit)}
            onSelectTag={(tag) => setFilters((prev) => ({ ...prev, selectedTag: tag }))}
          />
          <VisitComment text={visit.comment} className="sauna-card-comment" />
          <VisitImagePreview
            src={thumbSrc}
            alt={`${visit.name}の写真`}
            onOpenImage={onOpenImage}
          />
          <VisitMetaInfo date={visit.date} visitCount={visitCount} isWishlist={wishlist} />
          <div className="sauna-compact-footer-actions">
            <RouteLink lat={visit.lat} lng={visit.lng} />
            <RevisitButton
              visitName={visit.name}
              isWishlist={wishlist}
              onRevisit={() => onEdit(visit, { revisit: true })}
            />
            {onDeselectVisit && (
              <button
                type="button"
                className="sauna-card-deselect-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeselectVisit();
                }}
              >
                <ChevronUp size={13} aria-hidden="true" /> 閉じる
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const VisitCompactItem = memo(VisitCompactItemComponent, areVisitItemPropsEqual);
