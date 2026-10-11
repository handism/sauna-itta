import { PREFECTURES, PREFECTURE_TILES, PREFECTURE_REGIONS, Prefecture } from "../data/prefectures";
export { PREFECTURES, PREFECTURE_TILES, PREFECTURE_REGIONS, type Prefecture };


const PREFECTURE_ORDER = new Map<string, number>(PREFECTURES.map((p, i) => [p, i]));







/**
 * 都道府県名を「県」「府」「都」を除いた短い名前と接尾辞に分ける（北海道はそのまま）。
 * タイルの幅に「神奈川県」が収まらないため、地図の形の表示では短い名前だけを見せる。
 */
export function splitPrefectureSuffix(name: string): { short: string; suffix: string } {
  const match = /^(.+?)([都府県])$/.exec(name);
  return match ? { short: match[1], suffix: match[2] } : { short: name, suffix: "" };
}

/**
 * 都道府県名の並べ替え。PREFECTURES の順に並べ、一覧に無い名前（表記揺れ等）は末尾に五十音順で置く。
 */
export function comparePrefectures(a: string, b: string): number {
  const ia = PREFECTURE_ORDER.get(a) ?? Number.POSITIVE_INFINITY;
  const ib = PREFECTURE_ORDER.get(b) ?? Number.POSITIVE_INFINITY;
  if (ia !== ib) return ia - ib;
  return a.localeCompare(b, "ja");
}

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

