import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { getInitialFilters, useVisitFilters } from "./useVisitFilters";
import { SaunaVisit } from "../types";

const mockVisits: SaunaVisit[] = [
  {
    id: "1",
    name: "かるまる",
    lat: 35.7314,
    lng: 139.7111,
    comment: "池袋の最高サウナ",
    date: "2026-01-10",
    rating: 5,
    visitCount: 3,
    status: "visited",
  },
  {
    id: "2",
    name: "北欧",
    lat: 35.7118,
    lng: 139.7781,
    comment: "上野の老舗",
    date: "2026-02-15",
    rating: 4,
    visitCount: 10,
    status: "visited",
  },
  {
    id: "3",
    name: "しきじ",
    lat: 34.9542,
    lng: 138.4061,
    comment: "静岡の聖地",
    date: "2025-12-01",
    rating: 5,
    visitCount: 1,
    status: "visited",
  },
];

describe("useVisitFilters", () => {
  it("should sort by visitCountDesc correctly", () => {
    const { result } = renderHook(() => useVisitFilters(mockVisits));

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, sort: "visitCountDesc" }));
    });

    expect(result.current.filteredVisits.map((v) => v.name)).toEqual([
      "北欧", // 10回
      "かるまる", // 3回
      "しきじ", // 1回
    ]);
  });

  it("should sort by nameAsc correctly", () => {
    const { result } = renderHook(() => useVisitFilters(mockVisits));

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, sort: "nameAsc" }));
    });

    expect(result.current.filteredVisits.map((v) => v.name)).toEqual([
      "かるまる",
      "しきじ",
      "北欧",
    ]);
  });

  it("should filter by map bounds correctly", () => {
    const { result } = renderHook(() => useVisitFilters(mockVisits));

    // 東京エリア（池袋・上野）のみを囲む bounds
    act(() => {
      result.current.setFilters((prev) => ({
        ...prev,
        filterByBounds: true,
        mapBounds: {
          northEast: { lat: 35.8, lng: 139.85 },
          southWest: { lat: 35.6, lng: 139.6 },
        },
      }));
    });

    expect(result.current.filteredVisits.map((v) => v.name)).toEqual(["北欧", "かるまる"]);
  });

  it("should filter by search keyword across name, comment, area and tags", () => {
    const { result } = renderHook(() => useVisitFilters(mockVisits));

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, search: "聖地" }));
    });
    expect(result.current.filteredVisits.map((v) => v.name)).toEqual(["しきじ"]);

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, search: "池袋" }));
    });
    expect(result.current.filteredVisits.map((v) => v.name)).toEqual(["かるまる"]);
  });

  it("history のみを持つ記録も visitCountDesc で正しく並ぶこと", () => {
    // visitCount を持たない旧形式は history.length が訪問回数になる
    const visits: SaunaVisit[] = [
      { ...mockVisits[0], id: "a", name: "少ない", visitCount: undefined, history: [] },
      {
        ...mockVisits[0],
        id: "b",
        name: "多い",
        visitCount: undefined,
        history: [
          { date: "2026-01-01", comment: "", rating: 5 },
          { date: "2026-02-01", comment: "", rating: 4 },
          { date: "2026-03-01", comment: "", rating: 5 },
        ],
      },
    ];

    const { result } = renderHook(() => useVisitFilters(visits));

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, sort: "visitCountDesc" }));
    });

    expect(result.current.filteredVisits.map((v) => v.name)).toEqual(["多い", "少ない"]);
  });
});

describe("getInitialFilters", () => {
  const originalUrl = window.location.href;

  afterEach(() => {
    window.history.replaceState({}, "", originalUrl);
  });

  it("?tag= が無ければ既定のフィルターを返すこと", () => {
    expect(getInitialFilters().selectedTag).toBe("");
  });

  it("統計ページからの ?tag= をタグ絞り込みとして読むこと", () => {
    window.history.replaceState({}, "", "/?tag=" + encodeURIComponent("外気浴最高"));

    const filters = getInitialFilters();
    expect(filters.selectedTag).toBe("外気浴最高");
    // 他の条件は既定のまま
    expect(filters.status).toBe("all");
    expect(filters.search).toBe("");
  });
});