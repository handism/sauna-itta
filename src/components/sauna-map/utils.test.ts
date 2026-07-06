/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import imageCompression from "browser-image-compression";
import { normalizeVisits, extractPrefecture, compressAndGetBase64, getVisitHistoryEntries, getVisitCount, calculateStats } from "./utils";
import { SaunaVisit } from "./types";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));

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

describe("getVisitCount", () => {
  it("should return 1 when both visitCount and history are missing", () => {
    const visit = {} as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should return the correct count when visitCount is provided and history is missing", () => {
    const visit = { visitCount: 3 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(3);
  });

  it("should return 1 when visitCount is 0 and history is missing", () => {
    const visit = { visitCount: 0 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should return history length when history is provided and visitCount is missing", () => {
    const visit = {
      history: [
        { date: "2023-01-01", comment: "", rating: 3, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(2);
  });

  it("should return the maximum of visitCount and history length when both are provided", () => {
    const visit = {
      visitCount: 1,
      history: [
        { date: "2023-01-01", comment: "", rating: 3, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(2);
  });

  it("should return visitCount when visitCount is larger than history length", () => {
    const visit = {
      visitCount: 5,
      history: [
        { date: "2023-01-01", comment: "", rating: 3, image: "" },
        { date: "2023-01-02", comment: "", rating: 4, image: "" },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(5);
  });

  it("should handle empty history array", () => {
    const visit = { history: [] } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should handle negative visitCount by returning 1", () => {
    const visit = { visitCount: -5 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it("should handle invalid history type", () => {
    const visit = { history: "invalid" as any } as SaunaVisit;
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

describe("compressAndGetBase64", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compress file and return base64 string on success", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const readAsDataURLMock = vi.fn();
    class MockFileReader {
      result = "data:image/png;base64,compressed";
      onloadend: (() => void) | null = null;
      readAsDataURL(file: File) {
        readAsDataURLMock(file);
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    const result = await compressAndGetBase64(mockFile);

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
    });
    expect(readAsDataURLMock).toHaveBeenCalledWith(mockCompressedFile);
    expect(result).toBe("data:image/png;base64,compressed");

    global.FileReader = originalFileReader;
  });

  it("should reject when FileReader encounters an error", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const mockError = new Error("Specific file read error");

    class MockFileReader {
      error = mockError;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow("Specific file read error");

    global.FileReader = originalFileReader;
  });

  it("should reject with default error when FileReader error is null", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const mockCompressedFile = new File(["compressed"], "test.png", { type: "image/png" });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    class MockFileReader {
      error = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow("Failed to read file");

    global.FileReader = originalFileReader;
  });
});

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
