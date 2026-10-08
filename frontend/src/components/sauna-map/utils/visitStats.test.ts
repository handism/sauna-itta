import { describe, it, expect } from "vitest";
import {
  calculateStats,
  getPopularTags,
  getPopularAreas,
  countTags,
  rankVisitsByCount,
  getMonthlyVisitCounts,
  getRepeatVisits,
  sortRankedByRating,
  getTagSuggestions,
  PRESET_TAGS,
  getVisitYears,
  filterVisitsByYear,
  getVisitEntriesInMonth,
} from "./visitStats";
import { flattenVisitHistory } from "./visitHistory";
import { SaunaVisit } from "../types";

describe("calculateStats", () => {
  it("should calculate correctly for empty visits", () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.visitedCount).toBe(0);
    expect(stats.totalVisits).toBe(0);
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
    // 延べ訪問回数に「行きたい」は含めない
    expect(stats.totalVisits).toBe(2);
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
    expect(stats.totalVisits).toBe(4); // 履歴 2 件ずつ
    expect(stats.firstDate).toBe("2023-01-01");
    expect(stats.lastDate).toBe("2023-04-01");
    expect(stats.prefectureCount).toBe(2);
    expect(stats.prefectures).toEqual(["埼玉県", "東京都"]); // 都道府県コード順（北から南）
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

describe("calculateStats の延べ訪問回数", () => {
  it("旧形式から引き継いだ visitCount も一覧の「N回」と同じく数えること", () => {
    const stats = calculateStats([
      {
        id: "1",
        name: "旧形式",
        lat: 0,
        lng: 0,
        comment: "",
        date: "2023-01-01",
        status: "visited",
        visitCount: 5,
      },
    ]);
    expect(stats.totalVisits).toBe(5);
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

describe("getMonthlyVisitCounts", () => {
  it("訪問の無い月も 0 件として最初の月から最後の月まで埋めること", () => {
    const result = getMonthlyVisitCounts([
      { date: "2026-05-10" },
      { date: "2026-07-01" },
      { date: "2026-07-20" },
    ]);
    expect(result).toEqual([
      { month: "2026-05", visits: 1 },
      { month: "2026-06", visits: 0 },
      { month: "2026-07", visits: 2 },
    ]);
  });

  it("年をまたいでも月を連続させること", () => {
    const result = getMonthlyVisitCounts([{ date: "2025-11-03" }, { date: "2026-02-14" }]);
    expect(result.map((d) => d.month)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("記録が無い・日付が読めない場合は空配列を返すこと", () => {
    expect(getMonthlyVisitCounts([])).toEqual([]);
    expect(getMonthlyVisitCounts([{ date: "" }])).toEqual([]);
  });
});

describe("getRepeatVisits / sortRankedByRating", () => {
  const ranked = (name: string, count: number, rating?: number) => ({
    visit: { id: name, name, lat: 0, lng: 0, date: "2026-01-01", comment: "", rating, status: "visited" as const },
    count,
  });

  it("getRepeatVisits は 2 回以上行った施設だけを順序を保って返すこと", () => {
    const list = [ranked("A", 5), ranked("B", 2), ranked("C", 1)];
    expect(getRepeatVisits(list).map(({ visit }) => visit.name)).toEqual(["A", "B"]);
    expect(getRepeatVisits([ranked("C", 1)])).toEqual([]);
  });

  it("sortRankedByRating は満足度の高い順に並べ、同点は元の順を保つこと", () => {
    const list = [ranked("A", 1, 3), ranked("B", 1, 5), ranked("C", 1), ranked("D", 1, 5)];
    expect(sortRankedByRating(list).map(({ visit }) => visit.name)).toEqual(["B", "D", "A", "C"]);
    // 元の配列は変更しない
    expect(list.map(({ visit }) => visit.name)).toEqual(["A", "B", "C", "D"]);
  });
});

describe("getTagSuggestions", () => {
  const makeVisit = (id: string, tags: string[]): SaunaVisit => ({
    id,
    name: id,
    lat: 35.68,
    lng: 139.76,
    date: "2026-01-01",
    comment: "",
    rating: 4,
    status: "visited",
    tags,
  });

  it("記録が無ければプリセットだけを返す", () => {
    expect(getTagSuggestions([])).toEqual([...PRESET_TAGS]);
  });

  it("よく使うタグを先に並べ、プリセットとの重複は 1 つにまとめる", () => {
    const visits = [
      makeVisit("a", ["薪ストーブ", "サウナ飯"]),
      makeVisit("b", ["薪ストーブ"]),
    ];

    const result = getTagSuggestions(visits);

    expect(result.slice(0, 2)).toEqual(["薪ストーブ", "サウナ飯"]);
    expect(result.filter((tag) => tag === "サウナ飯")).toHaveLength(1);
    expect(result).toHaveLength(PRESET_TAGS.length + 1);
  });

  it("「行きたい」は候補に出さず、上限で打ち切る", () => {
    const visits = [makeVisit("a", ["行きたい", "A", "B", "C"])];

    const result = getTagSuggestions(visits, 4);

    expect(result).toEqual(["A", "B", "C", PRESET_TAGS[0]]);
  });
});

describe("getVisitYears / filterVisitsByYear", () => {
  const makeVisit = (overrides: Partial<SaunaVisit> & { id: string }): SaunaVisit => ({
    name: overrides.id,
    lat: 35.68,
    lng: 139.76,
    date: "2026-01-01",
    comment: "",
    rating: 0,
    status: "visited",
    ...overrides,
  });

  const twoYears = makeVisit({
    id: "a",
    history: [
      { date: "2025-03-01", comment: "初回", rating: 3 },
      { date: "2026-02-01", comment: "2回目", rating: 4 },
      { date: "2026-05-01", comment: "3回目", rating: 5 },
    ],
    date: "2026-05-01",
    rating: 5,
    visitCount: 3,
  });
  const onlyOld = makeVisit({ id: "b", date: "2024-08-10", rating: 2 });
  const wishlist = makeVisit({ id: "c", status: "wishlist", date: "2023-01-01" });

  it("行った記録の訪問がある年を新しい順に返し、行きたい記録の日付は数えない", () => {
    expect(getVisitYears([twoYears, onlyOld, wishlist])).toEqual(["2026", "2025", "2024"]);
  });

  it("null なら全期間としてそのまま返す", () => {
    const visits = [twoYears, onlyOld, wishlist];
    expect(filterVisitsByYear(visits, null)).toBe(visits);
  });

  it("行った記録はその年の履歴だけに絞り、本体の値と回数も揃える", () => {
    const [a] = filterVisitsByYear([twoYears], "2026");

    expect(a.history?.map((entry) => entry.date)).toEqual(["2026-02-01", "2026-05-01"]);
    expect(a.visitCount).toBe(2);
    expect(a.date).toBe("2026-05-01");
    expect(a.rating).toBe(5);

    const [old] = filterVisitsByYear([twoYears], "2025");
    // 最新の写しも、その年の最後の訪問から取る
    expect(old.date).toBe("2025-03-01");
    expect(old.comment).toBe("初回");
    expect(old.visitCount).toBe(1);
  });

  it("その年に行っていない記録は除き、行きたい記録は残す", () => {
    const ids = filterVisitsByYear([twoYears, onlyOld, wishlist], "2025").map((visit) => visit.id);
    expect(ids).toEqual(["a", "c"]);
  });

  it("旧形式の訪問回数（履歴より多い回数）は年で絞ると数えない", () => {
    const legacy = makeVisit({ id: "d", date: "2026-04-01", visitCount: 10 });
    const [filtered] = filterVisitsByYear([legacy], "2026");
    expect(filtered.visitCount).toBe(1);
  });
});

describe("getVisitEntriesInMonth", () => {
  const makeVisit = (overrides: Partial<SaunaVisit> & { id: string }): SaunaVisit => ({
    name: overrides.id,
    lat: 35.68,
    lng: 139.76,
    date: "2025-08-01",
    comment: "",
    rating: 0,
    status: "visited",
    ...overrides,
  });

  const repeat = makeVisit({
    id: "b-sauna",
    history: [
      { date: "2025-07-30", comment: "", rating: 3 },
      { date: "2025-08-20", comment: "", rating: 5 },
    ],
    date: "2025-08-20",
    rating: 5,
  });
  const sameDay = makeVisit({ id: "a-sauna", date: "2025-08-20", rating: 4 });
  const early = makeVisit({ id: "c-sauna", date: "2025-08-03", rating: 2 });

  it("その月の訪問だけを日付順（同じ日は施設名順）に、その回の評価付きで返す", () => {
    const visits = [repeat, sameDay, early];
    const entries = flattenVisitHistory(visits, "visited");

    const result = getVisitEntriesInMonth(visits, entries, 2025, 7);

    expect(result.map((e) => [e.date, e.visit.id, e.rating])).toEqual([
      ["2025-08-03", "c-sauna", 2],
      ["2025-08-20", "a-sauna", 4],
      ["2025-08-20", "b-sauna", 5],
    ]);
  });

  it("訪問の無い月は空配列を返す", () => {
    const visits = [repeat];
    expect(getVisitEntriesInMonth(visits, flattenVisitHistory(visits, "visited"), 2025, 0)).toEqual([]);
  });
});
