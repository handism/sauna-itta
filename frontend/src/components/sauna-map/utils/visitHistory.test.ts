import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateStats,
  getVisitCount,
  getVisitHistoryEntries,
  getInitialVisits,
  getPopularTags,
  getPopularAreas,
  countTags,
  rankVisitsByCount,
} from "./visitHistory";
import { toNormalizedTags } from "./form";
import { SaunaVisit } from "../types";

describe("calculateStats", () => {
  it("should calculate correctly for empty visits", () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.visitedCount).toBe(0);
    expect(stats.wishlistCount).toBe(0);
    expect(stats.firstDate).toBeNull();
    expect(stats.lastDate).toBeNull();
    expect(stats.avgRating).toBe(0);
    expect(stats.uniqueAreas).toBe(0);
    expect(stats.prefectures).toEqual([]);
    expect(stats.prefectureCount).toBe(0);
  });

  it("should handle single visited entry without rating", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
        status: "visited",
        area: "東京都 港区",
      },
    ];
    const stats = calculateStats(visits);
    expect(stats.total).toBe(1);
    expect(stats.visitedCount).toBe(1);
    expect(stats.wishlistCount).toBe(0);
    expect(stats.firstDate).toBe("2023-01-01");
    expect(stats.lastDate).toBe("2023-01-01");
    expect(stats.avgRating).toBe(0);
    expect(stats.uniqueAreas).toBe(1);
    expect(stats.prefectures).toEqual(["東京都"]);
    expect(stats.prefectureCount).toBe(1);
  });

  it("should calculate correctly with mixed visited and wishlist statuses", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna 1",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
        status: "visited",
        area: "東京都 港区",
        rating: 4,
      },
      {
        id: "2",
        name: "Test Sauna 2",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-02",
        status: "wishlist",
        area: "神奈川県 横浜市",
      },
      {
        id: "3",
        name: "Test Sauna 3",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-03",
        status: "visited",
        area: "東京都 新宿区",
        rating: 3,
      },
    ];
    const stats = calculateStats(visits);
    expect(stats.total).toBe(3);
    expect(stats.visitedCount).toBe(2);
    expect(stats.wishlistCount).toBe(1);
    expect(stats.firstDate).toBe("2023-01-01");
    expect(stats.lastDate).toBe("2023-01-03");
    expect(stats.avgRating).toBe(3.5); // (4+3)/2
    expect(stats.uniqueAreas).toBe(3);
    expect(stats.prefectures).toEqual(["東京都"]); // Wishlist area should not be counted for prefectures
    expect(stats.prefectureCount).toBe(1);
  });

  it("should calculate ratings accurately including history entries", () => {
     const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna 1",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
        status: "visited",
        area: "東京都",
        history: [
            { date: "2023-01-01", comment: "", rating: 3 },
            { date: "2023-02-01", comment: "", rating: 5 }
        ]
      },
      {
        id: "2",
        name: "Test Sauna 2",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-03-01",
        status: "visited",
        area: "埼玉県",
        history: [
            { date: "2023-03-01", comment: "", rating: 0 }, // Rating 0 should be ignored
            { date: "2023-04-01", comment: "", rating: 4 }
        ]
      }
    ];

    const stats = calculateStats(visits);
    expect(stats.avgRating).toBe(4); // (3+5+4)/3 = 12/3 = 4
    expect(stats.firstDate).toBe("2023-01-01");
    expect(stats.lastDate).toBe("2023-04-01");
    expect(stats.prefectureCount).toBe(2);
    expect(stats.prefectures).toEqual(["埼玉県", "東京都"]); // Sorted alphabetically
  });

  it("should handle missing optional fields safely", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
      },
    ];
    const stats = calculateStats(visits);
    expect(stats.total).toBe(1);
    expect(stats.visitedCount).toBe(1); // Defaults to visited
    expect(stats.wishlistCount).toBe(0);
    expect(stats.avgRating).toBe(0);
    expect(stats.uniqueAreas).toBe(0); // Undefined area
    expect(stats.prefectures).toEqual([]);
    expect(stats.prefectureCount).toBe(0);
  });

  it("should handle empty strings for date and area safely", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna Empty Area",
        lat: 0,
        lng: 0,
        comment: "",
        date: "",
        area: "   ",
        status: "visited"
      },
      {
        id: "2",
        name: "Test Sauna Missing Date",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
        // missing area
        status: "visited"
      }
    ];
    const stats = calculateStats(visits);
    expect(stats.total).toBe(2);
    expect(stats.visitedCount).toBe(2);
    expect(stats.firstDate).toBe(""); // lexicographical comparison sets empty string as first
    expect(stats.lastDate).toBe("2023-01-01");
    expect(stats.uniqueAreas).toBe(0);
  });
});

describe("getVisitCount", () => {
  it("should return 1 when both visitCount and history are missing", () => {
    const visit = {} as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should return the correct count when visitCount is provided and history is missing", () => {
    const visit = { visitCount: 3 } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(3);
  });

  it("should return 1 when visitCount is 0 and history is missing", () => {
    const visit = { visitCount: 0 } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should return history length when history is provided and visitCount is missing", () => {
    const visit = {
      history: [
        { date: "2023-01-01", comment: "", rating: 5, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
        { date: "2023-01-03", comment: "", rating: 3, image: "" },
      ],
    } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(3);
  });

  it("should return history length when both visitCount and history are provided", () => {
    const visit = {
      visitCount: 2,
      history: [
        { date: "2023-01-01", comment: "", rating: 5, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
        { date: "2023-01-03", comment: "", rating: 3, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
      ],
    } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(5);
  });

  it("should handle empty history array", () => {
    const visit = { history: [] } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should handle negative visitCount by returning 1", () => {
    const visit = { visitCount: -5 } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should handle invalid history type", () => {
    const visit = { history: "invalid" as unknown } as unknown as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });
});

describe("getVisitHistoryEntries", () => {
  it("returns visit.history when it is a non-empty array", () => {
    const mockHistory = [
      { date: "2023-01-01", comment: "Great", rating: 5 },
      { date: "2023-02-01", comment: "Good", rating: 4 },
    ];

    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2022-01-01",
      comment: "Old",
      history: mockHistory,
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toBe(mockHistory);
    expect(result).toHaveLength(2);
  });

  it("returns a fallback entry when history is undefined", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "Nice place",
      rating: 4,
      image: "test.jpg",
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2023-01-01",
      comment: "Nice place",
      rating: 4,
      image: "test.jpg",
    });
  });

  it("returns a fallback entry when history is an empty array", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "Empty history",
      rating: 3,
      history: [],
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2023-01-01",
      comment: "Empty history",
      rating: 3,
      image: undefined,
    });
  });

  it("uses default values for missing comment and rating in fallback", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2023-01-01",
      comment: "",
      rating: 0,
      image: undefined,
    });
  });
});

describe("toNormalizedTags", () => {
  it("should split a comma-separated string into an array of tags", () => {
    expect(toNormalizedTags("sauna, relax, water")).toEqual(["sauna", "relax", "water"]);
  });

  it("should trim extra spaces around tags", () => {
    expect(toNormalizedTags("  hot  , cold bath ,  steam  ")).toEqual(["hot", "cold bath", "steam"]);
  });

  it("should return an empty array for an empty string", () => {
    expect(toNormalizedTags("")).toEqual([]);
  });

  it("should handle consecutive commas and trailing/leading commas by filtering empty tags", () => {
    expect(toNormalizedTags(",sauna,,relax,")).toEqual(["sauna", "relax"]);
  });

  it("should return an empty array for a string with only spaces and commas", () => {
    expect(toNormalizedTags("  , ,  , ")).toEqual([]);
  });

  it("should handle a single tag without commas", () => {
    expect(toNormalizedTags("sauna")).toEqual(["sauna"]);
  });
});

describe("getInitialVisits", () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { for (const key in store) delete store[key]; }),
  };

  beforeEach(() => {
    // restoreAllMocks は vi.fn の実装まで戻すため、先に呼んでから読み書きを張り直す
    vi.restoreAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => store[key] ?? null);
    vi.stubGlobal("localStorage", mockLocalStorage);
    for (const key in store) delete store[key];
  });

  it("should catch localStorage errors when reading visits, log warning and return baseVisits", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(mockLocalStorage, "getItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const visits = getInitialVisits();
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.length).toBeGreaterThan(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to read "sauna-itta_visits" from localStorage:',
      expect.any(Error),
    );
  });

  it("保存がまだ無い場合は同梱JSONを返すこと", () => {
    const visits = getInitialVisits();

    expect(visits.length).toBeGreaterThan(0);
  });

  it("保存がある場合は同梱JSONを足し戻さないこと（デモ記録の編集・削除が戻らない）", () => {
    const bundled = getInitialVisits();
    const edited = { ...bundled[0], name: "編集後の名前" };
    // 1件だけ編集して、残りは削除した状態を保存しておく
    store["sauna-itta_visits"] = JSON.stringify([edited]);

    const visits = getInitialVisits();

    expect(visits).toHaveLength(1);
    expect(visits[0].name).toBe("編集後の名前");
  });

  it("すべて削除した状態を保存していれば空のまま復元すること", () => {
    store["sauna-itta_visits"] = JSON.stringify([]);

    expect(getInitialVisits()).toEqual([]);
  });
});

describe("getPopularTags & getPopularAreas", () => {
  const dummyVisits: SaunaVisit[] = [
    { id: "1", name: "S1", lat: 0, lng: 0, date: "2023-01-01", comment: "", tags: ["ロウリュ", "水風呂"], area: "東京都渋谷区" },
    { id: "2", name: "S2", lat: 0, lng: 0, date: "2023-01-02", comment: "", tags: ["ロウリュ", "外気浴"], area: "東京都新宿区" },
    { id: "3", name: "S3", lat: 0, lng: 0, date: "2023-01-03", comment: "", tags: ["水風呂"], area: "神奈川県横浜市" },
  ];

  it("should extract popular tags sorted by frequency", () => {
    const tags = getPopularTags(dummyVisits, 2);
    expect(tags).toEqual(["ロウリュ", "水風呂"]);
  });

  it("should extract popular areas (prefectures) sorted by frequency", () => {
    const areas = getPopularAreas(dummyVisits, 2);
    expect(areas).toEqual(["東京都", "神奈川県"]);
  });
});

describe("countTags", () => {
  const dummyVisits: SaunaVisit[] = [
    { id: "1", name: "S1", lat: 0, lng: 0, date: "2023-01-01", comment: "", tags: ["ロウリュ", " 水風呂 "] },
    { id: "2", name: "S2", lat: 0, lng: 0, date: "2023-01-02", comment: "", tags: ["ロウリュ", "外気浴", "  "] },
    { id: "3", name: "S3", lat: 0, lng: 0, date: "2023-01-03", comment: "", tags: ["水風呂"], status: "wishlist" },
  ];

  it("件数の多い順に集計し、前後の空白を除去すること", () => {
    expect(countTags(dummyVisits)).toEqual([
      { name: "ロウリュ", count: 2 },
      { name: "水風呂", count: 2 },
      { name: "外気浴", count: 1 },
    ]);
  });

  it("excludeWishlist で「行きたい」の記録を除外すること", () => {
    expect(countTags(dummyVisits, { excludeWishlist: true })).toEqual([
      { name: "ロウリュ", count: 2 },
      { name: "外気浴", count: 1 },
      { name: "水風呂", count: 1 },
    ]);
  });

  it("タグが無い場合は空配列を返すこと", () => {
    expect(countTags([])).toEqual([]);
  });
});

describe("rankVisitsByCount", () => {
  const makeVisit = (overrides: Partial<SaunaVisit> & { id: string; name: string }): SaunaVisit => ({
    lat: 35.68,
    lng: 139.76,
    date: "2026-01-01",
    comment: "",
    rating: 4,
    status: "visited",
    ...overrides,
  });

  it("訪問回数の多い順に並べること", () => {
    const visits = [
      makeVisit({ id: "a", name: "少ない", visitCount: 1 }),
      makeVisit({ id: "b", name: "多い", visitCount: 5 }),
      makeVisit({ id: "c", name: "普通", visitCount: 3 }),
    ];

    expect(rankVisitsByCount(visits).map(({ visit, count }) => [visit.name, count])).toEqual([
      ["多い", 5],
      ["普通", 3],
      ["少ない", 1],
    ]);
  });

  it("「行きたい」の記録を除外すること", () => {
    const visits = [
      makeVisit({ id: "a", name: "行った", visitCount: 2 }),
      makeVisit({ id: "b", name: "イキタイ", status: "wishlist", visitCount: 9 }),
    ];

    expect(rankVisitsByCount(visits).map(({ visit }) => visit.name)).toEqual(["行った"]);
  });

  it("visitCount が無い旧形式でも history.length を訪問回数として扱うこと", () => {
    const visits = [
      makeVisit({ id: "a", name: "新形式", visitCount: 2 }),
      makeVisit({
        id: "b",
        name: "旧形式",
        history: [
          { date: "2026-01-01", comment: "", rating: 4 },
          { date: "2026-02-01", comment: "", rating: 5 },
          { date: "2026-03-01", comment: "", rating: 5 },
        ],
      }),
    ];

    expect(rankVisitsByCount(visits).map(({ visit, count }) => [visit.name, count])).toEqual([
      ["旧形式", 3],
      ["新形式", 2],
    ]);
  });

  it("同数のときは施設名の五十音順で安定させること（2 つのカードで 1 位が食い違わないため）", () => {
    const visits = [
      makeVisit({ id: "a", name: "ん湯", visitCount: 3 }),
      makeVisit({ id: "b", name: "あ湯", visitCount: 3 }),
    ];

    expect(rankVisitsByCount(visits).map(({ visit }) => visit.name)).toEqual(["あ湯", "ん湯"]);
  });

  it("訪問済みが無い場合は空配列を返すこと", () => {
    expect(rankVisitsByCount([])).toEqual([]);
  });
});
