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

/**
 * Formats a raw Nominatim address object into a human-readable Japanese address string.
 */
function formatJapaneseAddress(address?: NominatimRawAddress): string {
  if (!address) return "";
  const parts = [
    address.state || address.province || "",
    address.city || address.town || address.village || "",
    address.suburb || address.city_district || address.quarter || address.neighbourhood || "",
    address.road || "",
    address.house_number || "",
  ];
  return parts.filter(Boolean).join("");
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

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "sauna-itta/1.0",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error! status: ${response.status}`);
    }

    const data: NominatimRawResult[] = await response.json();

    return data.map((item) => {
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
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    console.error("Geocoding search failed:", error);
    return [];
  }
}
