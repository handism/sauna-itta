import { describe, it, expect } from "vitest";
import { getDisplayRating, getDisplayTags, getVisitStatus, isVisited, isWishlist } from "./visitStatus";

describe("visitStatus", () => {
  it("status を持つ記録はその値を返すこと", () => {
    expect(getVisitStatus({ status: "wishlist" })).toBe("wishlist");
    expect(getVisitStatus({ status: "visited" })).toBe("visited");
  });

  it("status が無い旧形式のデータは訪問済み扱いにすること", () => {
    expect(getVisitStatus({})).toBe("visited");
    expect(getVisitStatus({ status: undefined })).toBe("visited");
    expect(isVisited({})).toBe(true);
    expect(isWishlist({})).toBe(false);
  });

  it("isVisited と isWishlist が排他であること", () => {
    for (const visit of [{}, { status: "visited" as const }, { status: "wishlist" as const }]) {
      expect(isVisited(visit)).toBe(!isWishlist(visit));
    }
  });

  it("getDisplayTags は行きたい記録からだけ「行きたい」タグを外すこと", () => {
    expect(getDisplayTags({ status: "wishlist", tags: ["行きたい", "外気浴"] })).toEqual(["外気浴"]);
    expect(getDisplayTags({ status: "visited", tags: ["行きたい", "外気浴"] })).toEqual(["行きたい", "外気浴"]);
    expect(getDisplayTags({ status: "wishlist" })).toEqual([]);
  });
});

describe("getDisplayRating", () => {
  it("行った記録は保存された評価をそのまま返す", () => {
    expect(getDisplayRating({ status: "visited", rating: 4 })).toBe(4);
    expect(getDisplayRating({ rating: 3 })).toBe(3);
  });

  it("行きたい記録は評価を持っていても 0 を返す（行った→行きたいへ切り替えた記録）", () => {
    expect(getDisplayRating({ status: "wishlist", rating: 5 })).toBe(0);
  });

  it("評価が無いときは 0 を返す", () => {
    expect(getDisplayRating({ status: "visited" })).toBe(0);
  });
});
