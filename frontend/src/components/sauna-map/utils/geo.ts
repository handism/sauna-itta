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

export type Prefecture = (typeof PREFECTURES)[number];

/**
 * 統計の「都道府県制覇」を日本地図の形に並べるときの位置（タイルグリッドマップ）。
 * col は西から 0 始まり、row は北から 0 始まり。隣り合う県がおおむね隣のマスになるようにしている。
 */
export const PREFECTURE_TILES: Record<Prefecture, { col: number; row: number }> = {
  北海道: { col: 13, row: 0 },
  青森県: { col: 12, row: 1 },
  秋田県: { col: 11, row: 2 }, 岩手県: { col: 12, row: 2 },
  山形県: { col: 11, row: 3 }, 宮城県: { col: 12, row: 3 },
  石川県: { col: 8, row: 4 }, 富山県: { col: 9, row: 4 }, 新潟県: { col: 10, row: 4 }, 福島県: { col: 11, row: 4 },
  福井県: { col: 7, row: 5 }, 岐阜県: { col: 8, row: 5 }, 長野県: { col: 9, row: 5 }, 群馬県: { col: 10, row: 5 },
  栃木県: { col: 11, row: 5 },
  島根県: { col: 3, row: 6 }, 鳥取県: { col: 4, row: 6 }, 兵庫県: { col: 5, row: 6 }, 京都府: { col: 6, row: 6 },
  滋賀県: { col: 7, row: 6 }, 愛知県: { col: 8, row: 6 }, 山梨県: { col: 9, row: 6 }, 埼玉県: { col: 10, row: 6 },
  茨城県: { col: 11, row: 6 },
  山口県: { col: 2, row: 7 }, 広島県: { col: 3, row: 7 }, 岡山県: { col: 4, row: 7 }, 大阪府: { col: 5, row: 7 },
  奈良県: { col: 6, row: 7 }, 三重県: { col: 7, row: 7 }, 静岡県: { col: 8, row: 7 }, 神奈川県: { col: 9, row: 7 },
  東京都: { col: 10, row: 7 }, 千葉県: { col: 11, row: 7 },
  佐賀県: { col: 1, row: 8 }, 福岡県: { col: 2, row: 8 }, 愛媛県: { col: 3, row: 8 }, 香川県: { col: 4, row: 8 },
  和歌山県: { col: 5, row: 8 },
  長崎県: { col: 1, row: 9 }, 熊本県: { col: 2, row: 9 }, 大分県: { col: 3, row: 9 }, 高知県: { col: 4, row: 9 },
  徳島県: { col: 5, row: 9 },
  鹿児島県: { col: 2, row: 10 }, 宮崎県: { col: 3, row: 10 },
  沖縄県: { col: 0, row: 11 },
};

/** 地方区分（8 地方）。都道府県制覇で、どの地方が残っているかを数で示す */
export const PREFECTURE_REGIONS: { name: string; prefectures: readonly Prefecture[] }[] = [
  { name: "北海道", prefectures: ["北海道"] },
  { name: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  {
    name: "中部",
    prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  {
    name: "九州・沖縄",
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  },
];

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

