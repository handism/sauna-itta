import { Navigation, Star, Tag } from "lucide-react";
import Image from "next/image";
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

interface VisitImagePreviewProps {
  /** sanitizeImageUrl() を通した URL。呼び出し側で 1 回だけ計算して渡すこと */
  src: string | null | undefined;
  /** 画像の代替テキスト。拡大ボタンの名前は「〜を拡大表示」として組み立てる */
  alt: string;
  onOpenImage: (src: string) => void;
}

/**
 * 写真プレビュー。画像が無い（またはサニタイズで弾かれた）場合は何も描画しない。
 *
 * 素の `img` に onClick を付けるとキーボードから開けないため、拡大は必ずこの
 * コンポーネント（= button）経由にすること。sanitizeImageUrl は同一レンダー内で
 * 何度も呼ばないよう、呼び出し側が計算済みの src を渡す。
 */
export function VisitImagePreview({ src, alt, onOpenImage }: VisitImagePreviewProps) {
  if (!src) return null;

  return (
    <button
      type="button"
      className="sauna-img-preview-btn"
      onClick={(e) => {
        e.stopPropagation();
        onOpenImage(src);
      }}
      aria-label={`${alt}を拡大表示`}
    >

      <Image src={src} className="sauna-img-preview" alt={alt} width={400} height={120} />
    </button>
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

