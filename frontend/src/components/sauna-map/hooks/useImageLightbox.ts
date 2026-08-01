import { useState, useCallback } from "react";

export function useImageLightbox() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const openImage = useCallback((src: string) => {
    setLightboxSrc(src);
  }, []);

  const closeImage = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  return {
    lightboxSrc,
    openImage,
    closeImage,
  };
}
