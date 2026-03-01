import L from "leaflet";

export function getSaunaIcon(
  options: {
    selected?: boolean;
    wishlist?: boolean;
  } = {},
) {
  const { selected = false, wishlist = false } = options;

  const classes = [
    "sauna-marker",
    selected ? "sauna-marker--selected" : "",
    wishlist ? "sauna-marker--wishlist" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="${classes}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}
