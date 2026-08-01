/** @vitest-environment jsdom */
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { HomeSaunaCard } from "./HomeSaunaCard";
import type { RankedVisit } from "@/components/sauna-map/utils";
import type { SaunaVisit } from "@/components/sauna-map/types";

afterEach(() => {
  cleanup();
});

const createVisit = (overrides: Partial<SaunaVisit>): SaunaVisit => ({
  id: "test-id",
  name: "Test Home Sauna",
  lat: 35.0,
  lng: 139.0,
  comment: "test",
  date: "2024-01-01",
  status: "visited",
  ...overrides,
});

describe("HomeSaunaCard", () => {
  it("renders nothing when ranked visits are empty", () => {
    const { container } = render(<HomeSaunaCard ranked={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when max visit count is 0", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Sauna 1" }), count: 0 },
    ];
    const { container } = render(<HomeSaunaCard ranked={ranked} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders home sauna information correctly with area, percentage, and dates", () => {
    const ranked: RankedVisit[] = [
      {
        visit: createVisit({
          id: "1",
          name: "Main Sauna",
          area: "Tokyo",
          date: "2024-01-01",
          history: [
            { date: "2024-01-01", comment: "first visit" },
            { date: "2024-06-01", comment: "recent visit" },
          ],
        }),
        count: 6,
      },
      {
        visit: createVisit({ id: "2", name: "Sub Sauna" }),
        count: 4,
      },
    ];

    render(<HomeSaunaCard ranked={ranked} />);

    expect(screen.getByText("MY HOME SAUNA")).toBeInTheDocument();
    expect(screen.getByText("Main Sauna")).toBeInTheDocument();
    expect(screen.getByText("計 6 回訪問")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();

    // Total visits = 6 + 4 = 10. Main sauna share = 6/10 = 60%
    expect(screen.getByText("60%")).toBeInTheDocument();

    // Dates verification
    expect(screen.getByText("初訪問: 2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("最新訪問: 2024-06-01")).toBeInTheDocument();
  });

  it("falls back to main visit date when history entries are empty", () => {
    const ranked: RankedVisit[] = [
      {
        visit: createVisit({ id: "1", name: "Single Visit Sauna", date: "2024-03-15", history: [] }),
        count: 1,
      },
    ];

    render(<HomeSaunaCard ranked={ranked} />);

    expect(screen.getByText("Single Visit Sauna")).toBeInTheDocument();
    expect(screen.getByText("初訪問: 2024-03-15")).toBeInTheDocument();
    expect(screen.getByText("最新訪問: 2024-03-15")).toBeInTheDocument();
  });

  it("renders a link to view sauna on the map", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "home-sauna-id", name: "Home Sauna" }), count: 10 },
    ];

    render(<HomeSaunaCard ranked={ranked} />);

    const link = screen.getByRole("link", { name: "Home Saunaを地図で見る" });
    expect(link).toHaveAttribute("href", "/?id=home-sauna-id");
  });
});

