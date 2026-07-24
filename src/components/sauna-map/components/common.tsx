import { Navigation, Star, Tag, X } from "lucide-react";
import { useModalBehavior } from "../hooks/useModalBehavior";
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
    <span className={`rating-stars ${className ?? ""}`}>
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

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const isOpen = Boolean(src);
  const containerRef = useModalBehavior(isOpen, onClose);

  if (!src) return null;

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="写真拡大表示"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ display: "contents" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? "拡大画像"}
          className="image-lightbox-img"
        />
        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

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

