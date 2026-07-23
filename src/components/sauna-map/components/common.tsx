import { Star, Tag, X } from "lucide-react";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      role="presentation"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "拡大画像"}
        className="image-lightbox-img"
        onClick={(e) => e.stopPropagation()}
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
  );
}
