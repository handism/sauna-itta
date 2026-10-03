import { Tag } from "lucide-react";
import { WISHLIST_LABEL } from "../../utils/visitStatus";

interface WishlistChipProps {
  compact?: boolean;
}

export function WishlistChip({ compact = false }: WishlistChipProps) {
  const className = compact ? "wishlist-chip wishlist-chip--compact" : "wishlist-chip";
  return (
    <span className={className}>
      <Tag size={12} aria-hidden="true" /> {WISHLIST_LABEL}
    </span>
  );
}
