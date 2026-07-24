import L from "leaflet";
import { flameIconSvg, starIconSvg } from "./iconSvg";

const iconCache = new Map<string, L.DivIcon>();

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

  const classes = [
    "sauna-marker",
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
      pills.push(`<span class="sauna-marker-pill sauna-marker-pill--wishlist">イキタイ</span>`);
    }

    if (pills.length > 0) {
      badgesHtml = `<div class="sauna-marker-badges">${pills.join("")}</div>`;
    }
  }

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"><span class="sauna-marker-icon">${iconSvg}</span>${badgesHtml}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });

  iconCache.set(key, icon);
  return icon;
}
