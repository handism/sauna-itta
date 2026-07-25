import { Dispatch, SetStateAction, memo } from "react";
import { ChevronRight, Pencil, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { getVisitCount, sanitizeImageUrl } from "../utils";
import {
  RatingStars,
  RouteLink,
  VisitImagePreview,
  VisitMetaInfo,
  VisitTagList,
  WishlistChip,
} from "./common";

interface VisitCompactItemProps {
  visit: SaunaVisit;
  isHovered: boolean;
  isSelected: boolean;
  onHoverVisit?: (id: string | null) => void;
  onSelectVisit?: (visit: SaunaVisit) => void;
  onDeselectVisit?: () => void;
  onEdit: (visit: SaunaVisit) => void;
  setFilters: Dispatch<SetStateAction<VisitFilters>>;
  onOpenImage: (src: string) => void;
}

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
}: VisitCompactItemProps) {
  const visitCount = getVisitCount(visit);
  const thumbSrc = sanitizeImageUrl(visit.image);

  return (
    <div
      data-visit-id={visit.id}
      className={`sauna-compact-item ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
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
                className={`sauna-compact-chevron ${isSelected ? "is-expanded" : ""}`}
                aria-hidden="true"
              >
                <ChevronRight size={14} />
              </span>
              <span className="sauna-compact-title">
                {visit.name}
                {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
              </span>
              {visit.area && <span className="sauna-compact-area">{visit.area}</span>}
            </span>
            <span className="sauna-compact-side-info">
              {thumbSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc} className="sauna-compact-thumb" alt="" />
              )}
              <RatingStars rating={visit.rating ?? 0} className="sauna-compact-rating" />
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
            tags={visit.tags}
            onSelectTag={(tag) => setFilters((prev) => ({ ...prev, search: tag }))}
          />
          {visit.comment && <p className="sauna-card-comment">{visit.comment}</p>}
          <VisitImagePreview
            image={visit.image}
            visitName={visit.name}
            onOpenImage={onOpenImage}
          />
          <VisitMetaInfo date={visit.date} visitCount={visitCount} />
          <div className="sauna-compact-footer-actions">
            <RouteLink lat={visit.lat} lng={visit.lng} />
            {onDeselectVisit && (
              <button
                type="button"
                className="sauna-card-deselect-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeselectVisit();
                }}
              >
                <X size={13} /> 解除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function areCompactItemPropsEqual(
  prevProps: VisitCompactItemProps,
  nextProps: VisitCompactItemProps,
): boolean {
  return (
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.visit === nextProps.visit
  );
}

export const VisitCompactItem = memo(VisitCompactItemComponent, areCompactItemPropsEqual);
