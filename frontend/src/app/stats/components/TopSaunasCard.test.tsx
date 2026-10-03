/** @vitest-environment jsdom */
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { TopSaunasCard } from "./TopSaunasCard";
import type { RankedVisit } from "@/components/sauna-map/utils";
import type { SaunaVisit } from "@/components/sauna-map/types";

afterEach(() => {
  cleanup();
});

const createVisit = (overrides: Partial<SaunaVisit>): SaunaVisit => ({
  id: "test-id",
  name: "Test Sauna",
  lat: 35.0,
  lng: 139.0,
  comment: "test",
  date: "2024-01-01",
  status: "visited",
  ...overrides,
});

describe("TopSaunasCard", () => {
  it("renders nothing when ranked visits are empty", () => {
    const { container } = render(<TopSaunasCard ranked={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders top 5 saunas correctly with details and progress bar percentages", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Sauna 1", area: "Tokyo", rating: 5 }), count: 10 },
      { visit: createVisit({ id: "2", name: "Sauna 2", area: "Osaka", rating: 4 }), count: 5 },
    ];
    const { container } = render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("よく行く施設 TOP 5")).toBeInTheDocument();
    expect(screen.getByText("Sauna 1")).toBeInTheDocument();
    expect(screen.getByText("10 回")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Rating

    expect(screen.getByText("Sauna 2")).toBeInTheDocument();
    expect(screen.getByText("5 回")).toBeInTheDocument();

    // Verify progress bar widths (Sauna 1: 10/10 = 100%, Sauna 2: 5/10 = 50%)
    const barFills = container.querySelectorAll('[class*="topSaunaBarFill"]');
    expect(barFills).toHaveLength(2);
    expect(barFills[0]).toHaveStyle({ width: "100%" });
    expect(barFills[1]).toHaveStyle({ width: "50%" });
  });

  it("truncates list to a maximum of 5 items and renders rank badges 1-5", () => {
    const ranked: RankedVisit[] = Array.from({ length: 6 }).map((_, i) => ({
      visit: createVisit({ id: String(i), name: `Sauna ${i}` }),
      count: 10 - i,
    }));

    const { container } = render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("Sauna 0")).toBeInTheDocument();
    expect(screen.getByText("Sauna 4")).toBeInTheDocument();
    expect(screen.queryByText("Sauna 5")).not.toBeInTheDocument();

    // Verify rank badges from 1 to 5 exist in rankBadge elements
    const rankBadges = Array.from(container.querySelectorAll('[class*="rankBadge"]')).map(
      (el) => el.textContent?.trim()
    );
    expect(rankBadges).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("handles visits without area or with rating equal to 0", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Zero Rating Sauna", rating: 0 }), count: 5 },
    ];
    const { container } = render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("Zero Rating Sauna")).toBeInTheDocument();
    // Rating 0 should not render rating span
    expect(container.querySelector('[class*="topSaunaRating"]')).toBeNull();
  });

  it("renders a link to view sauna on the map for each row", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "sauna-top-1", name: "Top 1 Sauna" }), count: 5 },
    ];
    render(<TopSaunasCard ranked={ranked} />);

    const link = screen.getByRole("link", { name: "Top 1 Saunaを地図で見る" });
    expect(link).toHaveAttribute("href", "/?id=sauna-top-1");
  });

  it("2 回以上行った施設だけを訪問回数順に並べ、1 回の施設で枠を埋めないこと", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Repeat", rating: 3 }), count: 3 },
      { visit: createVisit({ id: "2", name: "Once", rating: 5 }), count: 1 },
    ];
    render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("よく行く施設 TOP 5")).toBeInTheDocument();
    expect(screen.getByText("Repeat")).toBeInTheDocument();
    expect(screen.queryByText("Once")).not.toBeInTheDocument();
  });

  it("どの施設も 1 回ずつのときは満足度順に切り替え、回数を出さないこと", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Low", rating: 3 }), count: 1 },
      { visit: createVisit({ id: "2", name: "High", rating: 5 }), count: 1 },
    ];
    const { container } = render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("満足度の高い施設 TOP 5")).toBeInTheDocument();
    expect(screen.getByText(/2回以上行った施設がまだ無いため満足度順/)).toBeInTheDocument();
    expect(screen.queryByText("1 回")).not.toBeInTheDocument();

    // 満足度の高い High が先に並ぶ
    expect(
      screen.getByText("High").compareDocumentPosition(screen.getByText("Low")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // 満足度は同点が並びやすくバーが揃って満タンになるだけなので、バーは出さない
    expect(container.querySelector('[class*="topSaunaBarFill"]')).toBeNull();
  });
});
