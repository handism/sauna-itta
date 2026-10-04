import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitHeatmap } from "./VisitHeatmap";

function dateKey(iso: string): string {
  return new Date(`${iso}T00:00:00`).toDateString();
}

describe("VisitHeatmap", () => {
  afterEach(() => {
    cleanup();
  });

  const visitDates = new Map([
    [dateKey("2026-10-01"), 2],
    [dateKey("2026-09-01"), 1],
    // 表示期間（最終日を含む週から53週）より前の訪問は数えない
    [dateKey("2024-01-01"), 5],
  ]);

  it("期間と訪問日数・回数の要約を読み上げ用に渡す", () => {
    render(<VisitHeatmap visitDates={visitDates} end={new Date(2026, 9, 3)} />);

    // 2026/10/3 は土曜日のため、右端の週は 9/27〜10/3、左端は 52 週前の日曜
    expect(screen.getByRole("img")).toHaveAccessibleName("2025/9/28〜2026/10/3の2日に3回訪問");
    expect(screen.getByRole("figure")).toHaveTextContent("直近1年で 2 日 訪問");
  });

  it("各マスの title に日付と訪問回数を出す", () => {
    const { container } = render(<VisitHeatmap visitDates={visitDates} end={new Date(2026, 9, 3)} />);

    expect(container.querySelector('[title="2026/10/1：2回"]')).not.toBeNull();
    expect(container.querySelector('[title="2026/9/1：1回"]')).not.toBeNull();
    // 訪問の無い日は回数を付けない
    expect(container.querySelector('[title="2026/10/2"]')).not.toBeNull();
  });

  it("最終日より後の日はマスを描かない", () => {
    // 2026/9/30 は水曜日。同じ週の木〜土は期間外
    const { container } = render(<VisitHeatmap visitDates={visitDates} end={new Date(2026, 8, 30)} />);

    expect(container.querySelector('[title="2026/9/30"]')).not.toBeNull();
    expect(container.querySelector('[title^="2026/10/1"]')).toBeNull();
    expect(screen.getByRole("img")).toHaveAccessibleName(/の1日に1回訪問$/);
  });
});
