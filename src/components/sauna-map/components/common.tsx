import { Navigation, Star, Tag } from "lucide-react";
import { getDirectionsUrl } from "../utils";

interface RatingStarsProps {
  rating: number;
  className?: string;
  size?: number;
}

export function RatingStars({ rating, className, size = 14 }: RatingStarsProps) {
  if (rating <= 0) {
    return null;
  }

  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className={`rating-stars ${className ?? ""}`}
      role="img"
      aria-label={`満足度: ${safeRating}/5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < safeRating ? "currentColor" : "none"}
          className={i < safeRating ? "rating-star rating-star--filled" : "rating-star"}
        />
      ))}
    </span>
  );
}

interface WishlistChipProps {
  compact?: boolean;
}

export function WishlistChip({ compact = false }: WishlistChipProps) {
  const className = compact ? "wishlist-chip wishlist-chip--compact" : "wishlist-chip";
  return (
    <span className={className}>
      <Tag size={12} /> 行きたい
    </span>
  );
}

export { ImageLightbox } from "./ImageLightbox";
export type { ImageLightboxProps } from "./ImageLightbox";

interface VisitTagListProps {
  tags?: string[];
  onSelectTag?: (tag: string) => void;
}

export function VisitTagList({ tags, onSelectTag }: VisitTagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="sauna-tag-list">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="sauna-tag sauna-tag-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTag?.(tag);
          }}
          title={`タグ「${tag}」で絞り込み`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

interface VisitMetaInfoProps {
  date: string;
  visitCount?: number;
  className?: string;
}

export function VisitMetaInfo({ date, visitCount = 1, className = "sauna-card-meta" }: VisitMetaInfoProps) {
  return (
    <div className={className}>
      <span>日付: {date}</span>
      {visitCount > 1 && <span>訪問 {visitCount}回目</span>}
    </div>
  );
}

interface RouteLinkProps {
  lat: number;
  lng: number;
  className?: string;
}

export function RouteLink({ lat, lng, className = "route-link" }: RouteLinkProps) {
  return (
    <a
      href={getDirectionsUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      <span className="route-link-icon">
        <Navigation size={14} />
      </span>
      <span className="route-link-text">ここへ行く</span>
    </a>
  );
}

