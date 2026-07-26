import { describe, it, expect } from "vitest";
import { getVisitStatus, isVisited, isWishlist } from "./visitStatus";

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
});
