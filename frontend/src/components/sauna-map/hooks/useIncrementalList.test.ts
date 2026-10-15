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

  it("does not scroll back to the selected item when more items are loaded", () => {
    const visits = Array.from({ length: 50 }, (_, i) => makeVisit(i));
    const container = document.createElement("div");
    const target = document.createElement("div");
    target.dataset.visitId = "visit-3";
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    container.appendChild(target);

    const { result, rerender } = renderHook(
      ({ selectedId }: { selectedId: string | null }) => {
        const list = useIncrementalList(visits, selectedId, 10, 10);
        list.containerRef.current = container;
        return list;
      },
      { initialProps: { selectedId: "visit-3" as string | null } }
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // 一覧を下へ読み進めて描画件数が増えても、選択中の行へ引き戻さない
    act(() => {
      result.current.loadMore();
    });
    expect(result.current.renderedVisits.length).toBe(20);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // 別の記録を選び直したときは寄せる
    target.dataset.visitId = "visit-4";
    rerender({ selectedId: "visit-4" });
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
