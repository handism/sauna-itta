import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useImageLightbox } from "./useImageLightbox";

describe("useImageLightbox", () => {
  it("initializes with lightboxSrc as null", () => {
    const { result } = renderHook(() => useImageLightbox());
    expect(result.current.lightboxSrc).toBeNull();
  });

  it("updates lightboxSrc when openImage is called and clears it on closeImage", () => {
    const { result } = renderHook(() => useImageLightbox());

    act(() => {
      result.current.openImage("https://example.com/sauna.jpg");
    });
    expect(result.current.lightboxSrc).toBe("https://example.com/sauna.jpg");

    act(() => {
      result.current.closeImage();
    });
    expect(result.current.lightboxSrc).toBeNull();
  });
});
