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

    // ブラウザが落とす User-Agent を送らないこと（送れているように見せない）
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://nominatim.openstreetmap.org/search?"),
      { signal: undefined }
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

  it("座標が数値にならない結果は除外し、残りの結果を返す", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { place_id: 1, lat: "not-a-number", lon: "139.7", display_name: "壊れた結果" },
        { place_id: 2, lat: "", lon: "139.7", display_name: "空の座標" },
        { place_id: 3, lat: "95", lon: "139.7", display_name: "範囲外の座標" },
        { place_id: 4, lat: "35.7", lon: "139.7", display_name: "正しい結果" },
      ],
    });

    const results = await searchLocation("座標検証");

    expect(results.map((result) => result.placeId)).toEqual([4]);
    expect(results[0]).toMatchObject({ lat: 35.7, lng: 139.7 });
  });

  it("配列でない応答は0件ではなくエラーとして伝える", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "Unable to geocode" }),
    });

    await expect(searchLocation("配列でない応答")).rejects.toThrow("Geocoding response is not an array");
  });

  it("HTTPエラーを呼び出し側へ伝える", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(searchLocation("エラーテスト")).rejects.toThrow(
      "Geocoding HTTP error! status: 500",
    );
  });

  it("同じ検索語の結果をメモリキャッシュから返す", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await searchLocation("キャッシュ確認");
    await searchLocation("キャッシュ確認");

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("handles AbortError quietly", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

    const results = await searchLocation("キャンセルテスト");
    expect(results).toEqual([]);
  });

  it("throws generic error when fetch fails entirely (e.g. network error)", async () => {
    const error = new Error("Network connection lost");
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    await expect(searchLocation("network error test")).rejects.toThrow("Network connection lost");
  });

  it("throws non-Error objects correctly", async () => {
    const errorString = "String error thrown somehow";
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(errorString);

    await expect(searchLocation("string error test")).rejects.toEqual("String error thrown somehow");
  });
});
