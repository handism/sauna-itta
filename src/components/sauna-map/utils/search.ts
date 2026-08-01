import { SaunaVisit } from "../types";

/**
 * 検索キーワード文字列から大文字小文字を区別しない安全な正規表現を生成する。
 * 空欄の場合は null を返す。
 */
export function createSearchRegex(keyword: string): RegExp | null {
  const trimmed = keyword.trim();
  if (!trimmed) return null;
  return new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

/**
 * 訪問記録 (SaunaVisit) が検索キーワードの正規表現にマッチするかを判定する。
 * サウナ名・コメント・地域・タグを横断して検索する。
 */
export function matchesSearchKeyword(visit: SaunaVisit, regex: RegExp | null): boolean {
  if (!regex) return true;
  if (regex.test(visit.name)) return true;
  if (visit.comment && regex.test(visit.comment)) return true;
  if (visit.area && regex.test(visit.area)) return true;
  if (visit.tags && visit.tags.some((tag) => regex.test(tag))) return true;
  return false;
}
