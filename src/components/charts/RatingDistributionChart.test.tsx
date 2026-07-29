import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import RatingDistributionChart from "./RatingDistributionChart";
import { FlatVisitHistoryEntry } from "@/components/sauna-map/utils";

// Recharts is notoriously difficult to test in JSDOM because it relies on SVG and layout measurements
vi.mock("recharts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("recharts")>();
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children, data }: { children: React.ReactNode, data: unknown }) => <div data-testid="pie" data-pie-data={JSON.stringify(data)}>{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
  };
});

describe("RatingDistributionChart", () => {
  it("renders empty state when no entries", () => {
    render(<RatingDistributionChart entries={[]} avgRating={0} theme="light" />);
    expect(screen.getByText(/評価付きの訪問記録がありません/)).toBeInTheDocument();
  });

  it("renders chart correctly with valid entries", () => {
    const mockEntries = [
      { id: "1", visitId: "1", status: "visited", rating: 5 },
      { id: "2", visitId: "2", status: "visited", rating: 4 },
      { id: "3", visitId: "3", status: "visited", rating: 5 },
      { id: "4", visitId: "4", status: "visited", rating: 0 }, // Should be ignored
    ] as FlatVisitHistoryEntry[];

    render(<RatingDistributionChart entries={mockEntries} avgRating={4.5} theme="light" />);

    // Check if average rating and total are displayed
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/平均 \(3件\)/)).toBeInTheDocument();

    // Check if Pie component receives correct aggregated data
    const pieElement = screen.getByTestId("pie");
    const pieData = JSON.parse(pieElement.getAttribute("data-pie-data") || "[]") as Array<{rating: number, name: string, value: number}>;

    expect(pieData).toHaveLength(2); // 5 and 4 ratings

    // Check rating 5 group
    const rating5 = pieData.find((d) => d.rating === 5);
    expect(rating5).toBeDefined();
    expect(rating5?.value).toBe(2);
    expect(rating5?.name).toBe("★5 (最高)");

    // Check rating 4 group
    const rating4 = pieData.find((d) => d.rating === 4);
    expect(rating4).toBeDefined();
    expect(rating4?.value).toBe(1);
    expect(rating4?.name).toBe("★4 (満足)");
  });
});
