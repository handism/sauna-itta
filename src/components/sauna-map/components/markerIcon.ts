import L from "leaflet";

export function getSaunaIcon(
  options: {
    selected?: boolean;
    wishlist?: boolean;
    hovered?: boolean;
  } = {},
) {
  const { selected = false, wishlist = false, hovered = false } = options;

  const classes = [
    "sauna-marker",
    selected ? "sauna-marker--selected" : "",
    wishlist ? "sauna-marker--wishlist" : "",
    hovered ? "sauna-marker--hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconEmoji = wishlist ? "⭐" : "♨️";

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"><span class="sauna-marker-icon">${iconEmoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

