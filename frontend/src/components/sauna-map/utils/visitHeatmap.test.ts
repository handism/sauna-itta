import { describe, it, expect } from "vitest";
import { buildVisitHeatmap, getLatestVisitDate, HEATMAP_WEEKS } from "./visitHeatmap";

const key = (y: number, m: number, d: number) => new Date(y, m - 1, d).toDateString();

describe("buildVisitHeatmap", () => {
  // 2025-08-20 は水曜日
  const end = new Date(2025, 7, 20);

  it("最終日を含む週を右端にして 53 週ぶん並べ、左上は日曜日になる", () => {
    const heatmap = buildVisitHeatmap(new Map(), end);

    expect(heatmap.weeks).toHaveLength(HEATMAP_WEEKS);
    expect(heatmap.weeks.every((w) => w.days.length === 7)).toBe(true);
    expect(heatmap.start.getDay()).toBe(0);
    const lastWeek = heatmap.weeks[HEATMAP_WEEKS - 1].days;
    expect(lastWeek[3].date.toDateString()).toBe(key(2025, 8, 20));
  });

  it("最終日より後の日は範囲外として扱う", () => {
    const lastWeek = buildVisitHeatmap(new Map(), end).weeks[HEATMAP_WEEKS - 1].days;

    expect(lastWeek.slice(0, 4).every((d) => d.inRange)).toBe(true);
    expect(lastWeek.slice(4).every((d) => !d.inRange)).toBe(true);
  });

  it("訪問回数を段階に分け、期間内の日数と回数を数える", () => {
    const visitDates = new Map([
      [key(2025, 8, 18), 1],
      [key(2025, 8, 19), 2],
      [key(2025, 8, 20), 5],
      // 期間より前の訪問は数えない
      [key(2023, 1, 1), 1],
    ]);
    const heatmap = buildVisitHeatmap(visitDates, end);
    const lastWeek = heatmap.weeks[HEATMAP_WEEKS - 1].days;

    expect(lastWeek[1].level).toBe(1);
    expect(lastWeek[2].level).toBe(2);
    expect(lastWeek[3].level).toBe(3);
    expect(lastWeek[0].level).toBe(0);
    expect(heatmap.activeDays).toBe(3);
    expect(heatmap.totalVisits).toBe(8);
  });

  it("月の 1 日を含む週にだけ月の見出しを付け、左端の列には付けない", () => {
    const heatmap = buildVisitHeatmap(new Map(), end);
    const labels = heatmap.weeks.map((w) => w.monthLabel);

    expect(labels[0]).toBeNull();
    expect(labels.filter((l) => l !== null)).toHaveLength(12);
    expect(labels.filter((l) => l !== null).at(-1)).toBe("8月");
  });
});

describe("getLatestVisitDate", () => {
  it("最も新しい日を返し、読めないキーは飛ばす", () => {
    const latest = getLatestVisitDate(new Map([[key(2024, 1, 1), 1], ["not a date", 1], [key(2025, 3, 4), 1]]));
    expect(latest?.toDateString()).toBe(key(2025, 3, 4));
  });

  it("空なら null を返す", () => {
    expect(getLatestVisitDate(new Map())).toBeNull();
  });
});
