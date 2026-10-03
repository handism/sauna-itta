import { RepositoryError } from "./types";

/*
 * Repository の失敗（RepositoryError）の解釈。保存・インポート・エクスポート・読み込みの
 * どの経路でも同じ判定と文言を使うため、フックではなく Repository の層に置く
 * （純粋関数のため、フックのファイルから import させないこと）。
 */

/**
 * サーバー側でセッションが失われたことを表す code。別タブでのログアウトなどで起きる。
 * GET は require_login の 401（unauthenticated）になるが、変更系は CSRF の検証が
 * require_login より先に走るため 422（invalid_csrf）になる。片方だけを見ると、
 * 保存・削除の失敗からログイン画面へ戻れない。
 */
const SESSION_LOST_CODES: ReadonlySet<string> = new Set(["unauthenticated", "invalid_csrf"]);

export function isSessionLostError(error: unknown): boolean {
  return error instanceof RepositoryError && SESSION_LOST_CODES.has(error.code);
}

/**
 * Repository の失敗を利用者向けの文言へ変換する。
 * 楽観ロックの競合（code: conflict）は再読み込みの案内へ置き換える。同じ 409 でも
 * 一意制約の重複（code: duplicate）はサーバーの文言をそのまま出す（status で判定すると隠れる）。
 * セッションの喪失（isSessionLostError）は、ログイン画面へ戻るか再試行するかを案内する。
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof RepositoryError && error.code === "conflict") {
    return "別の画面で記録が更新されました。再読み込みしてからもう一度お試しください。";
  }
  if (error instanceof RepositoryError && error.code === "unauthenticated") {
    return "ログインの有効期限が切れました。もう一度ログインしてください。";
  }
  if (error instanceof RepositoryError && error.code === "invalid_csrf") {
    return "ログイン状態が変わったため操作を完了できませんでした。もう一度お試しください。";
  }
  return error instanceof Error ? error.message : fallback;
}
