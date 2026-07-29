import { X } from "lucide-react";
import Image from "next/image";
import { useModalBehavior } from "../hooks/useModalBehavior";

export interface ImageLightboxProps {
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
        <Image width={800} height={600}
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
