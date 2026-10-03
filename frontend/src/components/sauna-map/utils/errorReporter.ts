import { getVisitRepository } from "../repositories";

/**
 * 1回のページ表示で送る報告の上限。描画のたびに同じエラーが起きる不具合で、
 * 利用者の回線とサーバーのログを埋め尽くさないようにする（サーバー側にも rate_limit がある）。
 */
export const MAX_REPORTS_PER_PAGE = 5;

const reportedKeys = new Set<string>();

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

/**
 * ブラウザで起きたエラーを開発者へ届ける（apiモードはサーバーのログ、localモードは送らない）。
 * 報告の失敗は握りつぶす。エラー処理の中から呼ばれるため、ここで例外を投げると元の処理を壊す。
 *
 * repositories/ は utils/ を参照するため、このファイルは utils/index.ts から再エクスポートしない
 * （循環参照になる）。使う側はこのファイルを直接 import すること。
 */
export function reportError(error: unknown, source: string, extra: { componentStack?: string } = {}): void {
  const normalized = toError(error);
  const key = `${source}\n${normalized.message}`;
  if (reportedKeys.has(key) || reportedKeys.size >= MAX_REPORTS_PER_PAGE) return;
  reportedKeys.add(key);

  try {
    getVisitRepository()
      .reportClientError({
        message: normalized.message || normalized.name,
        stack: normalized.stack,
        componentStack: extra.componentStack,
        source,
        url: typeof window === "undefined" ? undefined : window.location.href.split("#")[0],
      })
      .catch(() => {});
  } catch {
    // Repository の生成に失敗しても、報告のために元の処理を止めない
  }
}

/** テスト間で送信済みの記録を消す */
export function resetErrorReporter(): void {
  reportedKeys.clear();
}
