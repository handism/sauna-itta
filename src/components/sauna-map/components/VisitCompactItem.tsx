import { Dispatch, SetStateAction, memo } from "react";
import { ChevronRight, Navigation, Pencil, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";

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
          {visit.tags && visit.tags.length > 0 && (
            <div className="sauna-tag-list">
              {visit.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="sauna-tag sauna-tag-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters((prev) => ({ ...prev, search: tag }));
                  }}
                  title={`タグ「${tag}」で絞り込み`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
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
          <div className="sauna-card-meta">
            <span>日付: {visit.date}</span>
            {visitCount > 1 && <span>訪問 {visitCount}回目</span>}
          </div>
          <div className="sauna-compact-footer-actions">
            <a
              href={getDirectionsUrl(visit.lat, visit.lng)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="route-link"
            >
              <span className="route-link-icon"><Navigation size={14} /></span>
              <span className="route-link-text">ここへ行く</span>
            </a>
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

export const VisitCompactItem = memo(VisitCompactItemComponent);
