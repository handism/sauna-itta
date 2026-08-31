export interface GeocodingResult {
  placeId: number;
  lat: number;
  lng: number;
  displayName: string;
  name: string;
  addressText: string;
}

interface NominatimRawAddress {
  province?: string;
  state?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  city_district?: string;
  quarter?: string;
  neighbourhood?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  [key: string]: string | undefined;
}

interface NominatimRawResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimRawAddress;
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

    const data: NominatimRawResult[] = await response.json();

    const results = data.map((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const formattedAddress = formatJapaneseAddress(item.address);
      const displayName = item.display_name || "";
      // Extract specific location/building name if available, or first chunk of display_name
      const name = item.name || displayName.split(",")[0] || "";

      return {
        placeId: item.place_id,
        lat,
        lng,
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
    console.error("Geocoding search failed:", error);
    throw error;
  }
}
