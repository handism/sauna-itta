import { describe, expect, it } from "vitest";
import { FREQUENT_VISIT_MIN_COUNT, getSaunaIcon } from "./markerIcon";

function htmlOf(icon: ReturnType<typeof getSaunaIcon>): string {
  return String(icon.options.html);
}

describe("getSaunaIcon", () => {
  it("よく行く施設は大きいピンにし、先端が地点を指すようアンカーも合わせる", () => {
    const normal = getSaunaIcon({ visitCount: FREQUENT_VISIT_MIN_COUNT - 1 });
    const frequent = getSaunaIcon({ visitCount: FREQUENT_VISIT_MIN_COUNT });

    expect(htmlOf(normal)).not.toContain("sauna-marker--frequent");
    expect(normal.options.iconSize).toEqual([34, 34]);

    expect(htmlOf(frequent)).toContain("sauna-marker--frequent");
    expect(frequent.options.iconSize).toEqual([40, 40]);
    expect(frequent.options.iconAnchor).toEqual([20, 40]);
    expect(frequent.options.popupAnchor).toEqual([0, -40]);
  });

  it("行きたい記録は回数に関わらず通常の大きさにする", () => {
    const icon = getSaunaIcon({ wishlist: true, visitCount: 5 });

    expect(htmlOf(icon)).not.toContain("sauna-marker--frequent");
    expect(icon.options.iconSize).toEqual([34, 34]);
  });
});
