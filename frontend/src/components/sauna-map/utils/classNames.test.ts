import { describe, expect, it } from "vitest";
import { cx } from "./classNames";

describe("cx", () => {
  it("真のクラス名だけを空白1つでつなぐ", () => {
    expect(cx("btn", true && "is-active", false, null, undefined, "")).toBe("btn is-active");
  });

  it("条件がすべて偽なら固定のクラス名だけを返す（末尾に空白を残さない）", () => {
    expect(cx("sidebar", false && "collapsed")).toBe("sidebar");
  });
});
