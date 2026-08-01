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

vi.mock("@/components/sauna-map/repositories", () => {
  return {
    getVisitRepository: () => ({
      dataSource: "local",
      getSession: vi.fn().mockResolvedValue({ authenticated: true, user: null, csrfToken: null }),
      list: vi.fn().mockResolvedValue(mockVisits),
    }),
  };
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
async function renderMounted() {
  const rendered = renderHook(() => useStatsData());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
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

  it("マウント後に訪問データとテーマを読み込むこと", async () => {
    const { result } = await renderMounted();

    expect(result.current.mounted).toBe(true);
    expect(result.current.visits).toHaveLength(3);
    expect(result.current.theme).toBe("dark");
  });

  it("visitedEntries が履歴を平坦化し、行きたい記録を除外すること", async () => {
    const { result } = await renderMounted();

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

  it("visitedEntries が同一参照で安定し、再レンダリングで再計算されないこと", async () => {
    const { result, rerender } = await renderMounted();

    const first = result.current.visitedEntries;
    rerender();

    expect(result.current.visitedEntries).toBe(first);
  });

  it("rankedVisits が訪問回数順に並び、行きたい記録を除外すること", async () => {
    const { result } = await renderMounted();

    // しきじは履歴 2 件で 2 回、北欧は 1 回。wishlist は順位付けの対象外
    expect(result.current.rankedVisits.map(({ visit, count }) => [visit.id, count])).toEqual([
      ["visited-1", 2],
      ["visited-2", 1],
    ]);
  });

  it("rankedVisits が同一参照で安定し、再レンダリングで並べ替え直されないこと", async () => {
    const { result, rerender } = await renderMounted();

    const first = result.current.rankedVisits;
    rerender();

    expect(result.current.rankedVisits).toBe(first);
  });

  it("visitDates が訪問済みの日付ごとの件数を返すこと", async () => {
    const { result } = await renderMounted();

    const dates = result.current.visitDates;
    // 同日 (2026-01-15) にしきじ初訪問と北欧の 2 件
    expect(dates.get(new Date("2026/01/15").toDateString())).toBe(2);
    expect(dates.get(new Date("2026/03/01").toDateString())).toBe(1);
    // 行きたい記録の日付は含まれない
    expect(dates.has(new Date("2026/02/01").toDateString())).toBe(false);
  });

  it("toggleTheme がテーマを切り替えて保存すること", async () => {
    const { result } = await renderMounted();

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  });
});
