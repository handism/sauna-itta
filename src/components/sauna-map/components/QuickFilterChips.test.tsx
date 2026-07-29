import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { QuickFilterChips } from "./QuickFilterChips";
import type { SaunaVisit, VisitFilters } from "../types";

const filters: VisitFilters = {
  search: "",
  status: "all",
  minRating: 0,
  selectedTag: "",
  selectedArea: "",
  filterByBounds: false,
  sort: "recent",
};

const visits: SaunaVisit[] = [
  {
    id: "1",
    name: "サウナA",
    lat: 35,
    lng: 139,
    area: "東京",
    date: "2026-07-01",
    comment: "",
    rating: 5,
    tags: ["外気浴", "水風呂"],
    status: "visited",
  },
  {
    id: "2",
    name: "サウナB",
    lat: 36,
    lng: 140,
    area: "神奈川",
    date: "2026-07-02",
    comment: "",
    rating: 4,
    tags: ["ロウリュ"],
    status: "visited",
  },
];

describe("QuickFilterChips", () => {
  it("横スクロールが必要な候補数では視覚的なスワイプヒントを表示すること", () => {
    render(
      <QuickFilterChips
        filters={filters}
        setFilters={vi.fn()}
        visits={visits}
      />
    );

    expect(screen.getByText("横にスワイプ")).toBeInTheDocument();
  });
});
