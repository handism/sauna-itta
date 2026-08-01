import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useModalBehavior } from "./useModalBehavior";

describe("useModalBehavior", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("should set body overflow to hidden when isOpen is true and restore on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(({ isOpen }) => useModalBehavior(isOpen, onClose), {
      initialProps: { isOpen: true },
    });

    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("should call onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    renderHook(() => useModalBehavior(true, onClose));

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
