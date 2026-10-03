import { z } from "zod";

export interface GeocodingResult {
  placeId: number;
  lat: number;
  lng: number;
  displayName: string;
  name: string;
  addressText: string;
}

/*
 * Nominatim の応答は外部サービスの値のため、型注釈だけで信用せず zod で検証する
 * （apiVisitRepository と同じ方針）。座標が数値にならない結果を地図へ渡すと、
 * 選択した時点で Leaflet が NaN の座標で例外を投げる。
 */
const coordinate = (min: number, max: number) =>
  z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max));

const NominatimRawAddressSchema = z.object({
  province: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  town: z.string().optional(),
  village: z.string().optional(),
  suburb: z.string().optional(),
  city_district: z.string().optional(),
  quarter: z.string().optional(),
  neighbourhood: z.string().optional(),
  road: z.string().optional(),
  house_number: z.string().optional(),
});

const NominatimRawResultSchema = z.object({
  place_id: z.number(),
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
  display_name: z.string(),
  name: z.string().optional(),
  address: NominatimRawAddressSchema.optional(),
});

type NominatimRawAddress = z.infer<typeof NominatimRawAddressSchema>;
type NominatimRawResult = z.infer<typeof NominatimRawResultSchema>;

/**
 * 応答の配列から、検証に通った結果だけを返す。1 件の不正で検索全体を失敗にはしないが、
 * 配列ですらない応答は接続先の誤りや障害のため例外にする（0 件として扱わないこと）。
 */
function parseNominatimResponse(body: unknown): NominatimRawResult[] {
  if (!Array.isArray(body)) {
    throw new Error("Geocoding response is not an array");
  }
  return body.flatMap((item) => {
    const result = NominatimRawResultSchema.safeParse(item);
    if (result.success) return [result.data];
    console.warn("Ignored unexpected geocoding result:", result.error);
    return [];
  });
}

const DEFAULT_GEOCODING_ENDPOINT = "https://nominatim.openstreetmap.org/search";

const resultCache = new Map<string, GeocodingResult[]>();

/**
 * Formats a raw Nominatim address object into a human-readable Japanese address string.
 */
function formatJapaneseAddress(address?: NominatimRawAddress): string {
  if (!address) return "";
  return [
    address.state ?? address.province,
    address.city ?? address.town ?? address.village,
    address.suburb ?? address.city_district ?? address.quarter ?? address.neighbourhood,
    address.road,
    address.house_number,
  ]
    .filter(Boolean)
    .join("");
}

/**
 * Searches for geographical locations using OpenStreetMap Nominatim API.
 */
export async function searchLocation(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    countrycodes: "jp",
    "accept-language": "ja",
    limit: "5",
  });

  // Nominatim互換の接続先へ差し替えられるようにし、公共APIからの移行を
  // フロントコードの変更なしで行えるようにする。
  const endpoint = process.env.NEXT_PUBLIC_GEOCODING_ENDPOINT ?? DEFAULT_GEOCODING_ENDPOINT;
  const cacheKey = `${endpoint}\n${trimmed}`;
  const cached = resultCache.get(cacheKey);
  if (cached) return cached;

  const url = `${endpoint}?${params.toString()}`;

  try {
    // User-Agent は Fetch 仕様の禁止ヘッダ名でブラウザが必ず落とすため指定しない
    // （Nominatim へのアプリ識別は Referer に依存する）。利用ポリシー上のリクエスト
    // 間隔は LocationSearchInput 側のデバウンスで守ること。
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error! status: ${response.status}`);
    }

    const data = parseNominatimResponse(await response.json());

    const results = data.map((item) => {
      const formattedAddress = formatJapaneseAddress(item.address);
      const displayName = item.display_name || "";
      // Extract specific location/building name if available, or first chunk of display_name
      const name = item.name || displayName.split(",")[0] || "";

      return {
        placeId: item.place_id,
        lat: item.lat,
        lng: item.lon,
        displayName,
        name,
        addressText: formattedAddress || displayName,
      };
    });

    if (resultCache.size >= 100) {
      resultCache.delete(resultCache.keys().next().value!);
    }
    resultCache.set(cacheKey, results);
    return results;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    throw error;
  }
}
