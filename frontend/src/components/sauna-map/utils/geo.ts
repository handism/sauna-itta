/**
 * 都道府県（JIS X 0401 の都道府県コード順＝おおむね北から南）。
 * 統計の「都道府県制覇」はこの順に並べ、未訪問の都道府県も同じ位置に出す。
 * 五十音順にすると隣り合う県が地理的に無関係になり、どの地方が埋まっているか読めない。
 */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

const PREFECTURE_ORDER = new Map<string, number>(PREFECTURES.map((p, i) => [p, i]));

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

