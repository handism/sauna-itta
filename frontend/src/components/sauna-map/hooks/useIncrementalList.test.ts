import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIncrementalList } from "./useIncrementalList";
import { SaunaVisit } from "../types";

vi.mock("../utils/motion", () => ({
  getScrollBehavior: vi.fn(() => "auto"),
}));

const makeVisit = (index: number): SaunaVisit => ({
  id: `visit-${index}`,
  name: `サウナ ${index}`,
  lat: 35.68,
  lng: 139.76,
  date: "2026-07-25",
  rating: 5,
  comment: "",
  tags: [],
  image: "",
  status: "visited",
  area: "東京",
  visitCount: 1,
});

describe("useIncrementalList", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should render initial count", () => {
    const visits = Array.from({ length: 50 }, (_, i) => makeVisit(i));
    const { result } = renderHook(() =>
      useIncrementalList(visits, null, 10, 10)
    );

    expect(result.current.renderedVisits.length).toBe(10);
    expect(result.current.hasMore).toBe(true);
  });

  it("should load more when requested", () => {
    const visits = Array.from({ length: 50 }, (_, i) => makeVisit(i));
    const { result } = renderHook(() =>
      useIncrementalList(visits, null, 10, 10)
    );

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.renderedVisits.length).toBe(20);
  });

  it("should expand to show selected item", () => {
    const visits = Array.from({ length: 50 }, (_, i) => makeVisit(i));
    const { result } = renderHook(() =>
      useIncrementalList(visits, "visit-25", 10, 10)
    );

    expect(result.current.renderedVisits.length).toBe(26);
  });
});
