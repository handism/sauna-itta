import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { TopSaunasCard } from "./TopSaunasCard";
import type { RankedVisit } from "@/components/sauna-map/utils";
import type { SaunaVisit } from "@/components/sauna-map/types";

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

  it("renders top 5 saunas correctly", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "Sauna 1", area: "Tokyo", rating: 5 }), count: 10 },
      { visit: createVisit({ id: "2", name: "Sauna 2", area: "Osaka", rating: 4 }), count: 8 },
    ];
    render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("よく行く施設 TOP 5")).toBeInTheDocument();
    expect(screen.getByText("Sauna 1")).toBeInTheDocument();
    expect(screen.getByText("10 回")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Rating

    expect(screen.getByText("Sauna 2")).toBeInTheDocument();
    expect(screen.getByText("8 回")).toBeInTheDocument();
  });

  it("truncates list to a maximum of 5 items", () => {
    const ranked: RankedVisit[] = Array.from({ length: 6 }).map((_, i) => ({
      visit: createVisit({ id: String(i), name: `Sauna ${i}` }),
      count: 10 - i,
    }));

    render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("Sauna 0")).toBeInTheDocument();
    expect(screen.getByText("Sauna 4")).toBeInTheDocument();
    expect(screen.queryByText("Sauna 5")).not.toBeInTheDocument();
  });

  it("handles visits without area or rating", () => {
    const ranked: RankedVisit[] = [
      { visit: createVisit({ id: "1", name: "No Meta Sauna" }), count: 5 },
    ];
    render(<TopSaunasCard ranked={ranked} />);

    expect(screen.getByText("No Meta Sauna")).toBeInTheDocument();
  });
});
