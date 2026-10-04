import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reverseGeocodeArea, searchLocation } from "./geocoding";

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

describe("reverseGeocodeArea", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const mockResponse = (body: unknown, ok = true) =>
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok, json: async () => body });

  it("検索と同じ階層の /reverse へ問い合わせ、都道府県＋市区町村を返すこと", async () => {
    mockResponse({ address: { province: "東京都", city: "台東区", road: "上野" } });

    await expect(reverseGeocodeArea(35.7101, 139.7741)).resolves.toBe("東京都台東区");

    const url = new URL((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/reverse");
    expect(url.searchParams.get("lat")).toBe("35.7101");
    expect(url.searchParams.get("lon")).toBe("139.7741");
    expect(url.searchParams.get("accept-language")).toBe("ja");
  });

  it("state に地方名が入っていても、都道府県として判定できる方を採ること", async () => {
    mockResponse({ address: { state: "関東地方", province: "埼玉県", town: "三芳町" } });

    await expect(reverseGeocodeArea(35.8201, 139.5501)).resolves.toBe("埼玉県三芳町");
  });

  it("都道府県を判定できない地点（海外・海上など）は null を返すこと", async () => {
    mockResponse({ address: { state: "Uusimaa", city: "Helsinki" } });
    await expect(reverseGeocodeArea(60.1699, 24.9384)).resolves.toBeNull();

    mockResponse({ error: "Unable to geocode" });
    await expect(reverseGeocodeArea(30.0001, 140.0001)).resolves.toBeNull();
  });

  it("HTTP エラーや通信の失敗でも例外にせず null を返すこと（登録は続けられるため）", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockResponse({}, false);
    await expect(reverseGeocodeArea(34.0001, 135.0001)).resolves.toBeNull();

    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(reverseGeocodeArea(34.0002, 135.0002)).resolves.toBeNull();
  });

  it("同じ地点を選び直したときは問い合わせないこと", async () => {
    mockResponse({ address: { province: "大阪府", city: "大阪市" } });

    await expect(reverseGeocodeArea(34.6937, 135.5023)).resolves.toBe("大阪府大阪市");
    await expect(reverseGeocodeArea(34.69371, 135.50231)).resolves.toBe("大阪府大阪市");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("接続先が /search で終わらないときは逆ジオコーディングを行わないこと", async () => {
    vi.stubEnv("NEXT_PUBLIC_GEOCODING_ENDPOINT", "https://geo.example.com/api");

    await expect(reverseGeocodeArea(35.0001, 135.0001)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
