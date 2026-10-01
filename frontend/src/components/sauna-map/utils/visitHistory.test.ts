import { describe, it, expect } from "vitest";
import {
  buildHistoryEntry,
  getVisitCount,
  getVisitHistoryEntries,
  flattenVisitHistory,
  syncLatestFromHistory,
} from "./visitHistory";
import { getTodayDate } from "./date";
import { SaunaVisit } from "../types";

describe("flattenVisitHistory", () => {
  it("should return empty array for empty visits", () => {
    expect(flattenVisitHistory([])).toEqual([]);
  });

  it("should flatten a visited sauna with implicit history (no history array)", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Test Sauna",
        lat: 0,
        lng: 0,
        comment: "Great sauna",
        date: "2023-01-01",
        rating: 4,
        image: "test.jpg",
        status: "visited",
      },
    ];

    const result = flattenVisitHistory(visits);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      visitId: "1",
      status: "visited",
      date: "2023-01-01",
      comment: "Great sauna",
      rating: 4,
      image: "test.jpg",
    });
  });

  it("should flatten a wishlist sauna with implicit history", () => {
    const visits: SaunaVisit[] = [
      {
        id: "2",
        name: "Wishlist Sauna",
        lat: 0,
        lng: 0,
        comment: "Want to go",
        date: "2023-02-01",
        status: "wishlist",
      },
    ];

    const result = flattenVisitHistory(visits);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      visitId: "2",
      status: "wishlist",
      date: "2023-02-01",
      comment: "Want to go",
      rating: 0, // Fallback for undefined rating
      image: undefined,
    });
  });

  it("should flatten a sauna with explicit history array", () => {
    const visits: SaunaVisit[] = [
      {
        id: "3",
        name: "Multiple Visits Sauna",
        lat: 0,
        lng: 0,
        comment: "Overall good",
        date: "2023-01-01",
        status: "visited",
        history: [
          { date: "2023-01-01", comment: "First time", rating: 3 },
          { date: "2023-02-01", comment: "Second time", rating: 5, image: "visit2.jpg" },
        ],
      },
    ];

    const result = flattenVisitHistory(visits);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      visitId: "3",
      status: "visited",
      date: "2023-01-01",
      comment: "First time",
      rating: 3,
      image: undefined,
    });
    expect(result[1]).toEqual({
      visitId: "3",
      status: "visited",
      date: "2023-02-01",
      comment: "Second time",
      rating: 5,
      image: "visit2.jpg",
    });
  });

  it("should flatten multiple sauna visits correctly", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Sauna 1",
        lat: 0,
        lng: 0,
        comment: "Implicit",
        date: "2023-01-01",
        status: "visited",
      },
      {
        id: "2",
        name: "Sauna 2",
        lat: 0,
        lng: 0,
        comment: "Explicit",
        date: "2023-02-01",
        status: "visited",
        history: [
          { date: "2023-02-01", comment: "H1", rating: 4 },
          { date: "2023-03-01", comment: "H2", rating: 5 },
        ],
      },
      {
        id: "3",
        name: "Sauna 3",
        lat: 0,
        lng: 0,
        comment: "Wishlist",
        date: "2023-04-01",
        status: "wishlist",
      }
    ];

    const result = flattenVisitHistory(visits);
    expect(result).toHaveLength(4);

    expect(result[0].visitId).toBe("1");
    expect(result[0].comment).toBe("Implicit");
    expect(result[0].status).toBe("visited");

    expect(result[1].visitId).toBe("2");
    expect(result[1].comment).toBe("H1");
    expect(result[1].status).toBe("visited");

    expect(result[2].visitId).toBe("2");
    expect(result[2].comment).toBe("H2");
    expect(result[2].status).toBe("visited");

    expect(result[3].visitId).toBe("3");
    expect(result[3].comment).toBe("Wishlist");
    expect(result[3].status).toBe("wishlist");
  });

  it("should filter visits by status when filterStatus is provided", () => {
    const visits: SaunaVisit[] = [
      {
        id: "1",
        name: "Visited Sauna 1",
        lat: 0,
        lng: 0,
        comment: "Great sauna",
        date: "2023-01-01",
        status: "visited",
      },
      {
        id: "2",
        name: "Wishlist Sauna",
        lat: 0,
        lng: 0,
        comment: "Want to go",
        date: "2023-02-01",
        status: "wishlist",
      },
      {
        id: "3",
        name: "Visited Sauna 2",
        lat: 0,
        lng: 0,
        comment: "Awesome",
        date: "2023-03-01",
        status: "visited",
      },
    ];

    const visitedResult = flattenVisitHistory(visits, "visited");
    expect(visitedResult).toHaveLength(2);
    expect(visitedResult[0].visitId).toBe("1");
    expect(visitedResult[1].visitId).toBe("3");

    const wishlistResult = flattenVisitHistory(visits, "wishlist");
    expect(wishlistResult).toHaveLength(1);
    expect(wishlistResult[0].visitId).toBe("2");
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

describe("syncLatestFromHistory", () => {
  const history = [
    { date: "2026-01-01", comment: "1回目", rating: 3, image: "data:image/png;base64,AAA" },
    { date: "2026-02-01", comment: "2回目", rating: 5 },
  ];

  it("末尾の履歴を記録本体の date / comment / rating / image へ写すこと", () => {
    const result = syncLatestFromHistory(history);

    expect(result.history).toBe(history);
    expect(result.date).toBe("2026-02-01");
    expect(result.comment).toBe("2回目");
    expect(result.rating).toBe(5);
    // 末尾に写真が無ければ本体からも消す（1件前の写真を残さない）
    expect(result.image).toBeUndefined();
  });

  it("visitCount を渡すと履歴件数との大きい方を採ること", () => {
    expect(syncLatestFromHistory(history, 5).visitCount).toBe(5);
    expect(syncLatestFromHistory(history, 1).visitCount).toBe(2);
  });

  it("visitCount を渡さないと履歴件数へ揃えること（履歴削除の経路）", () => {
    expect(syncLatestFromHistory(history).visitCount).toBe(2);
    expect(syncLatestFromHistory(history.slice(0, 1)).visitCount).toBe(1);
  });
});

describe("buildHistoryEntry", () => {
  it("フォームの値から履歴 1 件を組み立てる", () => {
    expect(buildHistoryEntry({ date: "2026-01-01", comment: "最高", rating: 4, image: "data:x" })).toEqual({
      date: "2026-01-01",
      comment: "最高",
      rating: 4,
      image: "data:x",
    });
  });

  it("日付が空なら今日、評価が未入力なら 0 を補う", () => {
    expect(buildHistoryEntry({ date: "", comment: "" })).toEqual({
      date: getTodayDate(),
      comment: "",
      rating: 0,
      image: undefined,
    });
  });
});
