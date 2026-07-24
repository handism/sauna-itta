import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchLocation } from "./geocoding";

describe("searchLocation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for empty or whitespace query without calling fetch", async () => {
    const results = await searchLocation("   ");
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses and formats Nominatim API response successfully", async () => {
    const mockApiResponse = [
      {
        place_id: 12345,
        lat: "35.7302",
        lon: "139.7111",
        display_name: "かるまる池袋, 豊島区, 東京都, 日本",
        name: "かるまる池袋",
        address: {
          state: "東京都",
          city: "豊島区",
          suburb: "池袋",
          road: "2-40-12",
        },
      },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const results = await searchLocation("かるまる");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://nominatim.openstreetmap.org/search?"),
      expect.objectContaining({
        headers: { "User-Agent": "sauna-itta/1.0" },
      })
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      placeId: 12345,
      lat: 35.7302,
      lng: 139.7111,
      displayName: "かるまる池袋, 豊島区, 東京都, 日本",
      name: "かるまる池袋",
      addressText: "東京都豊島区池袋2-40-12",
    });
  });

  it("handles HTTP errors gracefully and returns empty array", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const results = await searchLocation("エラーテスト");

    expect(results).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("handles AbortError quietly", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

    const results = await searchLocation("キャンセルテスト");
    expect(results).toEqual([]);
  });
});
