import { describe, it, expect, vi, afterEach } from "vitest";
import { prefersReducedMotion, getScrollBehavior } from "./motion";

describe("motion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
    expect(getScrollBehavior()).toBe("smooth");
  });

  it("detects the reduce preference", () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }));
    vi.stubGlobal("matchMedia", matchMedia);

    expect(prefersReducedMotion()).toBe(true);
    expect(getScrollBehavior()).toBe("auto");
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("keeps smooth scrolling when the preference is not set", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));

    expect(prefersReducedMotion()).toBe(false);
    expect(getScrollBehavior()).toBe("smooth");
  });
});
