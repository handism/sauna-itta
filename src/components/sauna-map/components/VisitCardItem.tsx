import { Dispatch, SetStateAction } from "react";
import { Navigation, Pencil, X } from "lucide-react";
import { SaunaVisit, VisitFilters } from "../types";
import { getDirectionsUrl, getVisitCount, sanitizeImageUrl } from "../utils";
import { RatingStars, WishlistChip } from "./common";

interface VisitCardItemProps {
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

export function VisitCardItem({
  visit,
  isHovered,
  isSelected,
  onHoverVisit,
  onSelectVisit,
  onDeselectVisit,
  onEdit,
  setFilters,
  onOpenImage,
}: VisitCardItemProps) {
  const visitCount = getVisitCount(visit);

  return (
    <div
      data-visit-id={visit.id}
      className={`sauna-card ${isHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelectVisit?.(visit)}
      onMouseEnter={() => onHoverVisit?.(visit.id)}
      onMouseLeave={() => onHoverVisit?.(null)}
    >
      <div className="sauna-card-header">
        <h3 className="sauna-card-title">
          {visit.name}
          {(visit.status ?? "visited") === "wishlist" && <WishlistChip />}
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
      <p className="sauna-card-comment">{visit.comment}</p>
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
    </div>
  );
}
