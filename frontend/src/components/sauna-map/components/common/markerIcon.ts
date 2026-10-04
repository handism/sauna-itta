import L from "leaflet";
import { flameIconSvg, starIconSvg } from "./iconSvg";

const iconCache = new Map<string, L.DivIcon>();

/**
 * この回数以上行った施設のピンを一回り大きくし、金の縁取りを付ける。
 * 地図を眺めるだけで「よく行く場所」が分かるようにするため。2 回（リピートの境目）だと
 * 大きなピンが増えすぎて差が読めなくなるので 3 回にしている。
 */
export const FREQUENT_VISIT_MIN_COUNT = 3;

const MARKER_SIZE = 34;
const FREQUENT_MARKER_SIZE = 40;

interface SaunaIconOptions {
  selected?: boolean;
  wishlist?: boolean;
  hovered?: boolean;
  rating?: number;
  visitCount?: number;
  showBadges?: boolean;
}

export function getSaunaIcon(options: SaunaIconOptions = {}): L.DivIcon {
  const {
    selected = false,
    wishlist = false,
    hovered = false,
    rating,
    visitCount,
    showBadges = false,
  } = options;

  const key = `${selected ? 1 : 0}_${wishlist ? 1 : 0}_${hovered ? 1 : 0}_${showBadges ? 1 : 0}_${rating ?? 0}_${visitCount ?? 0}`;

  const cached = iconCache.get(key);
  if (cached) {
    return cached;
  }

  const frequent = !wishlist && (visitCount ?? 0) >= FREQUENT_VISIT_MIN_COUNT;
  const size = frequent ? FREQUENT_MARKER_SIZE : MARKER_SIZE;

  const classes = [
    "sauna-marker",
    frequent ? "sauna-marker--frequent" : "",
    selected ? "sauna-marker--selected" : "",
    wishlist ? "sauna-marker--wishlist" : "",
    hovered ? "sauna-marker--hovered" : "",
    showBadges ? "sauna-marker--has-badges" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconSvg = wishlist ? starIconSvg(16) : flameIconSvg(16);

  let badgesHtml = "";
  if (showBadges) {
    const pills: string[] = [];
    if (rating && rating > 0) {
      pills.push(
        `<span class="sauna-marker-pill sauna-marker-pill--rating">${starIconSvg(11)}${rating.toFixed(1)}</span>`,
      );
    }
    if (visitCount && visitCount > 1) {
      pills.push(`<span class="sauna-marker-pill sauna-marker-pill--count">${visitCount}回</span>`);
    } else if (wishlist) {
      pills.push(`<span class="sauna-marker-pill sauna-marker-pill--wishlist">行きたい</span>`);
    }

    if (pills.length > 0) {
      badgesHtml = `<div class="sauna-marker-badges">${pills.join("")}</div>`;
    }
  }

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"><span class="sauna-marker-icon">${iconSvg}</span>${badgesHtml}</div>`,
    // 大きさを変えても先端（左下の角）が地点を指すよう、アンカーも大きさに合わせる
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

  iconCache.set(key, icon);
  return icon;
}
