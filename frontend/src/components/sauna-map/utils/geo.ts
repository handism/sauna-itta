export function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
  const match = s.match(/^(東京都|北海道|(?:京都|大阪)府|.+?県)/);
  if (match) return match[1];
  const first = s.split(/\s/)[0];
  return /[都道府県]$/.test(first) ? first : null;
}

export function getDirectionsUrl(lat: number, lng: number): string {
  const safeLat = encodeURIComponent(Number(lat).toString());
  const safeLng = encodeURIComponent(Number(lng).toString());
  return `https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}`;
}

export interface BoundingBox {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

/**
 * 指定された緯度・経度がマップ表示範囲 (バウンディングボックス) 内にあるかを判定する。
 *
 * **制約**: 日本国内のサウナ施設を対象としており、日付変更線（経度 180°）を
 * 跨ぐバウンディングボックスには対応していない。海外対応を行う場合は
 * `minLng > maxLng` のケースを考慮した判定ロジックに変更すること。
 */
export function isInBounds(
  lat: number,
  lng: number,
  bounds: BoundingBox | null | undefined,
): boolean {
  if (!bounds) return false;
  const { northEast, southWest } = bounds;
  const minLat = Math.min(southWest.lat, northEast.lat);
  const maxLat = Math.max(southWest.lat, northEast.lat);
  const minLng = Math.min(southWest.lng, northEast.lng);
  const maxLng = Math.max(southWest.lng, northEast.lng);

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

