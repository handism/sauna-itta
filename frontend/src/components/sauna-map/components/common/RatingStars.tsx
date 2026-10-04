import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  className?: string;
  size?: number;
  /**
   * 評価が 0 のとき「未評価」と出すか。行った記録だけで true にする（行きたい記録は
   * 評価を付けないのが普通なので、出すと全件に「未評価」が並ぶ）。
   * 何も描画しないと、付け忘れと意図的に付けていないことの区別が付かない。
   */
  showUnrated?: boolean;
}

export function RatingStars({ rating, className, size = 14, showUnrated = false }: RatingStarsProps) {
  if (rating <= 0) {
    return showUnrated ? (
      <span className={`rating-unrated ${className ?? ""}`}>未評価</span>
    ) : null;
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
