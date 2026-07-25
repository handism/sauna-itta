import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { SaunaVisit } from "@/components/sauna-map/types";

const mockVisits: SaunaVisit[] = [
  {
    id: "visited-1",
    name: "サウナしきじ",
    lat: 34.96,
    lng: 138.41,
    date: "2026-03-01",
    comment: "2 回目",
    rating: 5,
    status: "visited",
    history: [
      { date: "2026-01-15", comment: "初訪問", rating: 4 },
      { date: "2026-03-01", comment: "2 回目", rating: 5 },
    ],
  },
  {
    id: "visited-2",
    name: "北欧",
    lat: 35.71,
    lng: 139.77,
    date: "2026-01-15",
    comment: "",
    rating: 3,
    status: "visited",
  },
  {
    id: "wishlist-1",
    name: "ウェルビー栄",
    lat: 35.16,
    lng: 136.9,
    date: "2026-02-01",
    comment: "",
    rating: 0,
    status: "wishlist",
  },
];

// getInitialVisits だけを差し替え、テーマ系ユーティリティは実物を使う
vi.mock("@/components/sauna-map/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/sauna-map/utils")>();
  return { ...actual, getInitialVisits: () => mockVisits };
});

const { useStatsData } = await import("./useStatsData");

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

/** useStatsData は setTimeout(0) 経由でマウント後の初期化を行うため、それを進める */
function renderMounted() {
  const rendered = renderHook(() => useStatsData());
  act(() => {
    vi.advanceTimersByTime(0);
  });
  return rendered;
}

describe("useStatsData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("マウント後に訪問データとテーマを読み込むこと", () => {
    const { result } = renderMounted();

    expect(result.current.mounted).toBe(true);
    expect(result.current.visits).toHaveLength(3);
    expect(result.current.theme).toBe("dark");
  });

  it("visitedEntries が履歴を平坦化し、行きたい記録を除外すること", () => {
    const { result } = renderMounted();

    // しきじ 2 件 + 北欧 1 件。wishlist の記録は含まれない
    expect(result.current.visitedEntries).toHaveLength(3);
    expect(result.current.visitedEntries.every((e) => e.status === "visited")).toBe(true);
    expect(result.current.visitedEntries.map((e) => e.date)).toEqual([
      "2026-01-15",
      "2026-03-01",
      "2026-01-15",
    ]);
    expect(
      result.current.visitedEntries.some((e) => e.visitId === "wishlist-1"),
    ).toBe(false);
  });

  it("visitedEntries が同一参照で安定し、再レンダリングで再計算されないこと", () => {
    const { result, rerender } = renderMounted();

    const first = result.current.visitedEntries;
    rerender();

    expect(result.current.visitedEntries).toBe(first);
  });

  it("visitDates が訪問済みの日付ごとの件数を返すこと", () => {
    const { result } = renderMounted();

    const dates = result.current.visitDates;
    // 同日 (2026-01-15) にしきじ初訪問と北欧の 2 件
    expect(dates.get(new Date("2026/01/15").toDateString())).toBe(2);
    expect(dates.get(new Date("2026/03/01").toDateString())).toBe(1);
    // 行きたい記録の日付は含まれない
    expect(dates.has(new Date("2026/02/01").toDateString())).toBe(false);
  });

  it("toggleTheme がテーマを切り替えて保存すること", () => {
    const { result } = renderMounted();

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });
});
