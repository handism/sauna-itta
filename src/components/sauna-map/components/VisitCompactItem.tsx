import { Dispatch, SetStateAction, memo } from "react";
import { ChevronRight, Pencil, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, RouteLink, VisitMetaInfo, VisitTagList, WishlistChip } from "./common";

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

  return (
    <div
      data-visit-id={visit.id}
      className={`sauna-compact-item ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
      onMouseEnter={() => onHoverVisit?.(visit.id)}
      onMouseLeave={() => onHoverVisit?.(null)}
    >
      <div
        className="sauna-compact-header"
        onClick={() => {
          if (isSelected) {
            onDeselectVisit?.();
          } else {
            onSelectVisit?.(visit);
          }
        }}
      >
        <div className="sauna-compact-main-info">
          <span className={`sauna-compact-chevron ${isSelected ? "is-expanded" : ""}`}>
            <ChevronRight size={14} />
          </span>
          <h3 className="sauna-compact-title">
            {visit.name}
            {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
          </h3>
          {visit.area && <span className="sauna-compact-area">{visit.area}</span>}
        </div>
        <div className="sauna-compact-side-info">
          {sanitizeImageUrl(visit.image) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sanitizeImageUrl(visit.image)}
              className="sauna-compact-thumb"
              alt=""
            />
          )}
          <RatingStars rating={visit.rating ?? 0} className="sauna-compact-rating" />
          <button
            type="button"
            className="sauna-card-edit-btn compact-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(visit);
            }}
            title="記録を編集"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="sauna-compact-body">
          <VisitTagList
            tags={visit.tags}
            onSelectTag={(tag) => setFilters((prev) => ({ ...prev, search: tag }))}
          />
          {visit.comment && <p className="sauna-card-comment">{visit.comment}</p>}
          {sanitizeImageUrl(visit.image) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sanitizeImageUrl(visit.image)}
              className="sauna-img-preview"
              alt={`${visit.name}の写真`}
              onClick={(e) => {
                e.stopPropagation();
                const src = sanitizeImageUrl(visit.image);
                if (src) onOpenImage(src);
              }}
            />
          )}
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
