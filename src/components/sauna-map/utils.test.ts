import { calculateStats } from "./utils";
import { SaunaVisit } from "./types";

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

});
