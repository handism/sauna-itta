import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SummaryGrid } from "./SummaryGrid";
import { VisitStats } from "@/components/sauna-map/types/domain";

describe("SummaryGrid", () => {
  afterEach(() => {
    cleanup();
  });

  const mockStats: VisitStats = {
    total: 10,
    visitedCount: 6,
    wishlistCount: 4,
    firstDate: "2023-01-01",
    lastDate: "2023-12-31",
    avgRating: 4.5,
    uniqueAreas: 3,
    prefectures: ["Tokyo", "Osaka"],
    prefectureCount: 2,
  };

  it("renders correctly with full stats", () => {
    render(<SummaryGrid stats={mockStats} />);

    // Check total saunas
    expect(screen.getByText("登録サウナ総数")).toBeInTheDocument();

    // Using testid or specific querying is better, but since this is just text content:
    const totalArticle = screen.getByRole("listitem", { name: "登録サウナ総数" });
    expect(totalArticle).toHaveTextContent("10");

    // Check visited / wishlist
    const visitedArticle = screen.getByRole("listitem", { name: "行った / イキタイ" });
    expect(visitedArticle).toHaveTextContent("6");
    expect(visitedArticle).toHaveTextContent("/ 4 行きたい");

    // Check areas
    const areasArticle = screen.getByRole("listitem", { name: "訪問エリア数" });
    expect(areasArticle).toHaveTextContent("3");

    // Check average rating
    const ratingArticle = screen.getByRole("listitem", { name: "平均満足度" });
    expect(ratingArticle).toHaveTextContent("4.5");
    expect(ratingArticle).toHaveTextContent("/ 5.0");

    // Check prefectures
    const prefecturesArticle = screen.getByRole("listitem", { name: "都道府県制覇" });
    expect(prefecturesArticle).toHaveTextContent("2");
    expect(prefecturesArticle).toHaveTextContent("/ 47 都道府県");

    // Check recording period
    const periodArticle = screen.getByRole("listitem", { name: "記録期間" });
    expect(periodArticle).toHaveTextContent("2023-01-01 〜 2023-12-31");
  });

  it("renders correctly with empty/zero stats", () => {
    const emptyStats: VisitStats = {
      total: 0,
      visitedCount: 0,
      wishlistCount: 0,
      firstDate: null,
      lastDate: null,
      avgRating: 0,
      uniqueAreas: 0,
      prefectures: [],
      prefectureCount: 0,
    };
    render(<SummaryGrid stats={emptyStats} />);

    const totalArticle = screen.getByRole("listitem", { name: "登録サウナ総数" });
    expect(totalArticle).toHaveTextContent("0");

    const visitedArticle = screen.getByRole("listitem", { name: "行った / イキタイ" });
    expect(visitedArticle).toHaveTextContent("0");
    expect(visitedArticle).toHaveTextContent("/ 0 行きたい");

    const areasArticle = screen.getByRole("listitem", { name: "訪問エリア数" });
    expect(areasArticle).toHaveTextContent("0");

    // Average rating should display '-' when 0
    const ratingArticle = screen.getByRole("listitem", { name: "平均満足度" });
    expect(ratingArticle).toHaveTextContent("-");
    expect(ratingArticle).not.toHaveTextContent("/ 5.0"); // ensure suffix isn't rendered

    const prefecturesArticle = screen.getByRole("listitem", { name: "都道府県制覇" });
    expect(prefecturesArticle).toHaveTextContent("0");
    expect(prefecturesArticle).toHaveTextContent("/ 47 都道府県");

    const periodArticle = screen.getByRole("listitem", { name: "記録期間" });
    expect(periodArticle).toHaveTextContent("-");
  });
});
