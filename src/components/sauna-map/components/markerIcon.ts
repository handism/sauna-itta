import L from "leaflet";
import { flameIconSvg, starIconSvg } from "./iconSvg";

export function getSaunaIcon(
  options: {
    selected?: boolean;
    wishlist?: boolean;
    hovered?: boolean;
    rating?: number;
    visitCount?: number;
    showBadges?: boolean;
  } = {},
) {
  const {
    selected = false,
    wishlist = false,
    hovered = false,
    rating,
    visitCount,
    showBadges = false,
  } = options;

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

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"><span class="sauna-marker-icon">${iconSvg}</span>${badgesHtml}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}


