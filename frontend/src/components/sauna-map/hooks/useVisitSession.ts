import { useCallback, useEffect, useState } from "react";
import type { SaunaVisit } from "../types";
import { RepositoryError, type SessionUser, type VisitRepository } from "../repositories";

export const LOAD_ERROR_FALLBACK = "記録の読み込みに失敗しました。";

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

interface VisitSessionOptions {
  /** 読み込んだ記録の受け取り先。参照が変わると初回読み込みをやり直すため、安定した関数を渡すこと */
  onVisitsLoaded: (visits: SaunaVisit[]) => void;
  /** 初期の記録をすでに持っている（localモードの同期読み込み）ため、初回の list() を省く */
  skipInitialList?: boolean;
}

/**
 * セッションの確認と、ログイン済みなら記録一覧の初回読み込みを行う。
 * 地図（useSaunaVisits）と統計ページ（useStatsData）で共通の手順のため、
 * 各画面で getSession → list を書き直さずにこれを使うこと。
 *
 * セッション情報は一覧の読み込みより先に反映する。一覧だけが失敗したときに、
 * 未ログイン扱いではなく読み込みエラーとして利用者へ伝えるため。
 */
export function useVisitSession(
  repository: VisitRepository,
  { onVisitsLoaded, skipInitialList = false }: VisitSessionOptions,
) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(repository.dataSource === "local");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // エフェクト本体で同期的に setState しない（react-hooks/set-state-in-effect）ため、
    // マイクロタスクへ送ってから読み込みと状態更新を始める
    queueMicrotask(async () => {
      try {
        const session = await repository.getSession();
        if (!active) return;
        setAuthenticated(session.authenticated);
        setCsrfToken(session.csrfToken);
        setUser(session.user);
        if (session.authenticated && !skipInitialList) {
          const loaded = await repository.list();
          if (active) onVisitsLoaded(loaded);
        }
      } catch (error) {
        if (active) setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [repository, skipInitialList, onVisitsLoaded]);

  /**
   * 失敗は例外にせず loadError へ入れ、成否だけを返す。画面の再試行ボタンは
   * 結果を待たずに呼ぶため例外にすると未処理の reject になる一方、インポートのように
   * 再読み込みの失敗を利用者へ追記したい呼び出し側は戻り値で判定する
   * （「例外が来たら失敗」と書くと、この関数では一度も通らない分岐になる）。
   */
  /**
   * セッションを取り直して状態へ反映し、ログイン中かを返す。未ログインになっていれば
   * 記録も空にする（ログイン画面の裏に前の利用者の記録を残さない）。
   * 取り直しにも失敗したときは false を返し、内容は loadError へ入れる。
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const session = await repository.getSession();
      setAuthenticated(session.authenticated);
      setUser(session.user);
      setCsrfToken(session.csrfToken);
      if (!session.authenticated) onVisitsLoaded([]);
      return session.authenticated;
    } catch (error) {
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return false;
    }
  }, [repository, onVisitsLoaded]);

  /**
   * Repository の失敗がセッションの喪失（isSessionLostError）なら、セッションを取り直す。
   * 未ログインならログイン画面（ApiAccessGate）へ切り替わり、別タブで再ログイン済みなら
   * 新しい CSRF トークンへ差し替わるため、次の操作はそのまま通る。
   * 取り直さないと、ログアウト後も画面はログイン中のまま、保存のたびに失敗し続ける。
   */
  const revalidateSessionOnError = useCallback(
    async (error: unknown): Promise<void> => {
      if (isSessionLostError(error)) await refreshSession();
    },
    [refreshSession],
  );

  const reload = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);
    try {
      onVisitsLoaded(await repository.list());
      return true;
    } catch (error) {
      if (isSessionLostError(error)) {
        // 未ログインに戻っていたらログイン画面を出す。読み込みエラーにすると
        // ApiAccessGate はエラーを優先して「再読み込み」だけを出し、ログインへ進めない。
        // 取り直した時点でログイン済み（別タブで再ログインした）なら、再試行を促す
        if (await refreshSession()) setLoadError(LOAD_ERROR_FALLBACK);
        return false;
      }
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return false;
    } finally {
      setLoading(false);
    }
  }, [repository, onVisitsLoaded, refreshSession]);

  /**
   * ログアウト後の状態へ戻す（Repository の logout 自体は呼び出し側で行う）。
   * Rails は reset_session で CSRF トークンを作り直すため、セッションを取り直して
   * 新しいトークンへ差し替える。ログイン前のトークンを持ち続けると、ログイン画面の
   * POST（/auth/google_oauth2）が invalid_csrf で失敗する。
   */
  const resetSession = useCallback(async (): Promise<void> => {
    setAuthenticated(false);
    setUser(null);
    setCsrfToken(null);
    await refreshSession();
  }, [refreshSession]);

  return { loading, loadError, authenticated, csrfToken, user, reload, resetSession, revalidateSessionOnError };
}
