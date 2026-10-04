import { z } from "zod";
import { extractPrefecture } from "./geo";

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

// Nominatim互換の接続先へ差し替えられるようにし、公共APIからの移行を
// フロントコードの変更なしで行えるようにする。
function getSearchEndpoint(): string {
  return process.env.NEXT_PUBLIC_GEOCODING_ENDPOINT ?? DEFAULT_GEOCODING_ENDPOINT;
}

/**
 * 逆ジオコーディングの接続先。Nominatim は検索（/search）と同じ階層に /reverse を持つため、
 * 検索の接続先から導く（設定を 2 つに増やさない）。/search で終わらない接続先は
 * 導けないため null を返し、逆ジオコーディングを行わない。
 */
function getReverseEndpoint(): string | null {
  const endpoint = getSearchEndpoint();
  return /\/search\/?$/.test(endpoint) ? endpoint.replace(/\/search\/?$/, "/reverse") : null;
}

/** 1 つのキャッシュに保持する件数。超えたら最も古く入れたものから捨てる */
const CACHE_LIMIT = 100;

function createBoundedCache<V>(limit: number) {
  const entries = new Map<string, V>();
  return {
    has: (key: string) => entries.has(key),
    get: (key: string) => entries.get(key),
    set(key: string, value: V) {
      if (!entries.has(key) && entries.size >= limit) {
        entries.delete(entries.keys().next().value!);
      }
      entries.set(key, value);
    },
  };
}

const resultCache = createBoundedCache<GeocodingResult[]>(CACHE_LIMIT);

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

  const endpoint = getSearchEndpoint();
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

    resultCache.set(cacheKey, results);
    return results;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    throw error;
  }
}

const NominatimReverseResultSchema = z.object({
  address: NominatimRawAddressSchema.optional(),
});

const areaCache = createBoundedCache<string | null>(CACHE_LIMIT);

/**
 * 座標から「都道府県＋市区町村」（例: 東京都台東区）を返す。地図をクリックして場所を選んだときに
 * エリア欄を補い、統計の都道府県集計に載るようにするために使う。
 *
 * Nominatim は日本の都道府県を state と province のどちらに入れるかが一定しないため、
 * 都道府県として判定できる方を採る。判定できない（海外・海上など）ときは null。
 * 失敗しても登録は続けられるため、HTTP エラーや想定外の応答も例外にせず null を返す。
 */
export async function reverseGeocodeArea(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const endpoint = getReverseEndpoint();
  if (!endpoint) return null;

  // 同じ地点を選び直したときに再送しない（約 10m 単位で丸める）
  const cacheKey = `${endpoint}\n${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (areaCache.has(cacheKey)) return areaCache.get(cacheKey) ?? null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    "accept-language": "ja",
    // 市区町村の粒度で十分（細かくすると番地まで返り、エリア欄には長すぎる）
    zoom: "10",
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, { signal });
    if (!response.ok) return null;

    const parsed = NominatimReverseResultSchema.safeParse(await response.json());
    const address = parsed.success ? parsed.data.address : undefined;
    const prefecture = [address?.province, address?.state].find(
      (candidate) => extractPrefecture(candidate) !== null,
    );
    const area = prefecture
      ? `${prefecture}${address?.city ?? address?.town ?? address?.village ?? ""}`
      : null;

    areaCache.set(cacheKey, area);
    return area;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return null;
    console.warn("Reverse geocoding failed:", error);
    return null;
  }
}
