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
