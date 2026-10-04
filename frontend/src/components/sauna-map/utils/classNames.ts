/**
 * 条件付きのクラス名を空白区切りでつなぐ。偽の値は捨てるため、
 * `` `a ${cond ? "b" : ""}` `` のように空白が余ることがない。
 */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
