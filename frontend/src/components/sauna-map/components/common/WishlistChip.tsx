import { Star } from "lucide-react";
import { WISHLIST_LABEL } from "../../utils/visitStatus";

interface WishlistChipProps {
  compact?: boolean;
}

export function WishlistChip({ compact = false }: WishlistChipProps) {
  const className = compact ? "wishlist-chip wishlist-chip--compact" : "wishlist-chip";
  return (
    <span className={className}>
      {/*
       * 地図の「行きたい」ピンと同じ星にそろえる。タグのアイコンだと、
       * 記録に付けたタグ（.sauna-tag）と同じ種類のものに見える。
       */}
      <Star size={12} aria-hidden="true" /> {WISHLIST_LABEL}
    </span>
  );
}
