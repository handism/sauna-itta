import { describe, it, expect } from "vitest";
import { normalizeVisits, extractPrefecture } from "./utils";
import { SaunaVisit } from "./types";

describe("normalizeVisits", () => {
  it("should return an empty array when given an empty array", () => {
    expect(normalizeVisits([])).toEqual([]);
  });

  it("should provide default values for missing optional fields", () => {
    const visits = [
      {
        id: "1",
        name: "Test Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Great place",
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "1",
        name: "Test Sauna",
        tags: [],
        status: "visited",
        area: "",
      })
    );
  });

  it("should preserve existing optional fields", () => {
    const visits = [
      {
        id: "2",
        name: "Another Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Awesome",
        tags: ["relaxing"],
        status: "wishlist",
        area: "Tokyo",
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "2",
        name: "Another Sauna",
        tags: ["relaxing"],
        status: "wishlist",
        area: "Tokyo",
      })
    );
  });

  it("should generate history array when missing, using root fields", () => {
    const visits = [
      {
        id: "3",
        name: "History Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Initial visit",
        rating: 4,
        image: "test.jpg",
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0].history).toEqual([
      {
        date: "2023-10-01",
        comment: "Initial visit",
        rating: 4,
        image: "test.jpg",
      },
    ]);
    expect(result[0].visitCount).toBe(1);
    expect(result[0].date).toBe("2023-10-01");
    expect(result[0].comment).toBe("Initial visit");
    expect(result[0].rating).toBe(4);
    expect(result[0].image).toBe("test.jpg");
  });

  it("should handle empty history array by falling back to root fields", () => {
    const visits = [
      {
        id: "4",
        name: "Empty History Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Fallback visit",
        history: [],
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0].history).toEqual([
      {
        date: "2023-10-01",
        comment: "Fallback visit",
        rating: 0,
        image: undefined,
      },
    ]);
  });

  it("should normalize root fields based on the latest history entry", () => {
    const visits = [
      {
        id: "5",
        name: "Multi Visit Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01", // This root field should be overwritten by the latest history entry
        comment: "First visit", // This should be overwritten
        history: [
          {
            date: "2023-10-01",
            comment: "First visit",
            rating: 3,
          },
          {
            date: "2023-11-01",
            comment: "Second visit, much better",
            rating: 5,
            image: "new.jpg",
          },
        ],
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0].history).toHaveLength(2);
    expect(result[0].date).toBe("2023-11-01");
    expect(result[0].comment).toBe("Second visit, much better");
    expect(result[0].rating).toBe(5);
    expect(result[0].image).toBe("new.jpg");
    expect(result[0].visitCount).toBe(2);
  });

  it("should calculate visitCount correctly, falling back to 1", () => {
    const visits = [
      {
        id: "6",
        name: "Count Sauna",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Nice",
        visitCount: -1, // Should max with 1
      } as SaunaVisit,
      {
        id: "7",
        name: "Count Sauna 2",
        lat: 35.0,
        lng: 135.0,
        date: "2023-10-01",
        comment: "Nice",
        visitCount: 5, // Explicitly set count should be preserved if greater than history length
      } as SaunaVisit,
    ];

    const result = normalizeVisits(visits);

    expect(result[0].visitCount).toBe(1);
    expect(result[1].visitCount).toBe(5);
  });
});

describe("extractPrefecture", () => {
  it("should extract valid prefectures", () => {
    expect(extractPrefecture("東京都")).toBe("東京都");
    expect(extractPrefecture("北海道")).toBe("北海道");
    expect(extractPrefecture("大阪府")).toBe("大阪府");
    expect(extractPrefecture("京都府")).toBe("京都府");
    expect(extractPrefecture("神奈川県")).toBe("神奈川県");
  });

  it("should extract prefecture when there is a space and city name", () => {
    expect(extractPrefecture("東京都 新宿区")).toBe("東京都");
    expect(extractPrefecture("北海道 札幌市")).toBe("北海道");
    expect(extractPrefecture("愛知県 名古屋市 中区")).toBe("愛知県");
  });

  it("should extract prefecture when there are full-width spaces", () => {
    expect(extractPrefecture("福岡県　福岡市")).toBe("福岡県");
    expect(extractPrefecture("長野県　松本市")).toBe("長野県");
  });

  it("should return null for undefined or empty string", () => {
    expect(extractPrefecture(undefined)).toBeNull();
    expect(extractPrefecture("")).toBeNull();
    expect(extractPrefecture("   ")).toBeNull();
  });

  it("should return null for strings that do not end with prefecture suffixes", () => {
    expect(extractPrefecture("東京")).toBeNull();
    expect(extractPrefecture("アメリカ")).toBeNull();
    expect(extractPrefecture("日本")).toBeNull();
    expect(extractPrefecture("Hawaii")).toBeNull();
  });

  it("should return null if the first part doesn't end with suffix", () => {
    expect(extractPrefecture("東京 新宿区")).toBeNull();
    expect(extractPrefecture("Osaka City")).toBeNull();
  });
});
