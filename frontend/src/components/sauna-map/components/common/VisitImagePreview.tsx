import Image from "next/image";

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
      <Image src={src} className="sauna-img-preview" alt={alt} width={300} height={120} unoptimized />
    </button>
  );
}
