interface RatingStarsProps {
  rating: number;
  className?: string;
}

export function RatingStars({ rating, className }: RatingStarsProps) {
  if (rating <= 0) {
    return null;
  }

  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={className}>
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </span>
  );
}

interface WishlistChipProps {
  compact?: boolean;
}

export function WishlistChip({ compact = false }: WishlistChipProps) {
  const className = compact ? "wishlist-chip wishlist-chip--compact" : "wishlist-chip";
  return <span className={className}>🏷 行きたい</span>;
}
