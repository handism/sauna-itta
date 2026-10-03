import { SaunaVisit, VisitStatus } from "../types";

/**
 * 記録のステータス。旧形式のデータには status が無いため、既定は「訪問済み」。
 *
 * `visit.status ?? "visited"` を各所で直書きすると、既定値の解釈が
 * 地図・一覧・統計でずれる余地が残る。判定は必ずここを経由すること。
 */
export function getVisitStatus(visit: Pick<SaunaVisit, "status">): VisitStatus {
  return visit.status ?? "visited";
}

export function isVisited(visit: Pick<SaunaVisit, "status">): boolean {
  return getVisitStatus(visit) === "visited";
}

export function isWishlist(visit: Pick<SaunaVisit, "status">): boolean {
  return getVisitStatus(visit) === "wishlist";
}

/** 「行きたい」状態の表示名。一覧のチップと、タグとの重複判定で共有する。 */
export const WISHLIST_LABEL = "行きたい";

/**
 * 一覧に表示するタグ。行きたい記録は状態を {@link WISHLIST_LABEL} のチップで示すため、
 * 同名のタグを並べると「行きたい」が 2 回表示される。そのタグだけ表示から外す（保存値は変えない）。
 */
export function getDisplayTags(visit: Pick<SaunaVisit, "status" | "tags">): string[] {
  const tags = visit.tags ?? [];
  return isWishlist(visit) ? tags.filter((tag) => tag !== WISHLIST_LABEL) : tags;
}
