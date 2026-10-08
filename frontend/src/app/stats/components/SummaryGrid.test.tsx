import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SummaryGrid, formatPeriodLength } from "./SummaryGrid";
import { VisitStats } from "@/components/sauna-map/types/domain";

describe("SummaryGrid", () => {
  afterEach(() => {
    cleanup();
  });

  const mockStats: VisitStats = {
    total: 10,
    visitedCount: 6,
    wishlistCount: 4,
    totalVisits: 15,
    firstDate: "2023-01-01",
    lastDate: "2023-12-31",
    avgRating: 4.5,
    uniqueAreas: 3,
    prefectures: ["Tokyo", "Osaka"],
    prefectureCount: 2,
  };

  it("renders correctly with full stats", () => {
    render(<SummaryGrid stats={mockStats} />);

    // 先頭は延べ訪問回数。登録施設数は「行った施設＋行きたい」と重なるため出さない
    const totalArticle = screen.getByRole("listitem", { name: "延べ訪問回数" });
    expect(totalArticle).toHaveTextContent("15 回");
    expect(screen.queryByText("登録サウナ総数")).toBeNull();

    // Check visited / wishlist
    // 主の値は行った施設の数で、行きたいの件数は補足に回す
    const visitedArticle = screen.getByRole("listitem", { name: "行った施設" });
    expect(visitedArticle).toHaveTextContent("6 施設");
    expect(visitedArticle).toHaveTextContent("ほかに行きたい 4 件");

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
    // 他のカードと同じく長さを大きな数値で出し、範囲は年月の補足、日単位の期間は title に残す
    expect(periodArticle).toHaveTextContent("1年");
    expect(periodArticle).toHaveTextContent("2023.01 〜 2023.12");
    expect(periodArticle.querySelector("p[title]")).toHaveAttribute("title", "2023-01-01 〜 2023-12-31");
    expect(periodArticle.querySelector("time")).toHaveAttribute("dateTime", "2023-01-01");
  });

  it("renders correctly with empty/zero stats", () => {
    const emptyStats: VisitStats = {
      total: 0,
      visitedCount: 0,
      wishlistCount: 0,
      totalVisits: 0,
      firstDate: null,
      lastDate: null,
      avgRating: 0,
      uniqueAreas: 0,
      prefectures: [],
      prefectureCount: 0,
    };
    render(<SummaryGrid stats={emptyStats} />);

    const totalArticle = screen.getByRole("listitem", { name: "延べ訪問回数" });
    expect(totalArticle).toHaveTextContent("0 回");

    // 行きたいが 0 件のときは補足を出さない
    const visitedArticle = screen.getByRole("listitem", { name: "行った施設" });
    expect(visitedArticle).toHaveTextContent("0 施設");
    expect(visitedArticle).not.toHaveTextContent("行きたい");

    const areasArticle = screen.getByRole("listitem", { name: "訪問エリア数" });
    expect(areasArticle).toHaveTextContent("0");

    // Average rating should display '-' when 0
    const ratingArticle = screen.getByRole("listitem", { name: "平均満足度" });
    expect(ratingArticle).toHaveTextContent("-");
    expect(ratingArticle).not.toHaveTextContent("/ 5.0"); // ensure suffix isn't rendered

    // 0 件を「1 つも行っていない」と読ませないよう、数値の代わりに集計できない旨を出す
    const prefecturesArticle = screen.getByRole("listitem", { name: "都道府県制覇" });
    expect(prefecturesArticle).toHaveTextContent("-");
    expect(prefecturesArticle).not.toHaveTextContent("/ 47 都道府県");
    expect(prefecturesArticle).toHaveTextContent("エリアに都道府県名を入れると集計されます");

    const periodArticle = screen.getByRole("listitem", { name: "記録期間" });
    expect(periodArticle).toHaveTextContent("-");
  });
});

describe("formatPeriodLength", () => {
  it("始まりと終わりの月を含めて数える", () => {
    expect(formatPeriodLength("2026-01-04", "2026-04-04")).toEqual([{ value: "4", unit: "ヶ月" }]);
    expect(formatPeriodLength("2026-03-01", "2026-03-31")).toEqual([{ value: "1", unit: "ヶ月" }]);
  });

  it("12 ヶ月以上は年とヶ月に分ける", () => {
    expect(formatPeriodLength("2024-05-01", "2026-04-30")).toEqual([{ value: "2", unit: "年" }]);
    expect(formatPeriodLength("2024-05-01", "2026-07-01")).toEqual([
      { value: "2", unit: "年" },
      { value: "3", unit: "ヶ月" },
    ]);
  });
});
