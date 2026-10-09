import { useCallback, useEffect, useRef, useState } from "react";
import type { SaunaVisit } from "../types";
import { isSessionLostError, toUserMessage, type SessionUser, type VisitRepository } from "../repositories";

export const LOAD_ERROR_FALLBACK = "記録の読み込みに失敗しました。";

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

  // 初回取得・再読み込み・セッション再取得で共有し、最新の操作だけを反映する。
  const generation = useRef(0);

  useEffect(() => {
    const requestGeneration = ++generation.current;
    const isCurrent = () => requestGeneration === generation.current;
    // エフェクト本体で同期的に setState しない（react-hooks/set-state-in-effect）ため、
    // マイクロタスクへ送ってから読み込みと状態更新を始める
    queueMicrotask(async () => {
      if (!isCurrent()) return;
      try {
        const session = await repository.getSession();
        if (!isCurrent()) return;
        setAuthenticated(session.authenticated);
        setCsrfToken(session.csrfToken);
        setUser(session.user);
        if (session.authenticated && !skipInitialList) {
          const loaded = await repository.list();
          if (isCurrent()) onVisitsLoaded(loaded);
        }
      } catch (error) {
        if (isCurrent()) setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });
    return () => {
      generation.current += 1;
    };
  }, [repository, skipInitialList, onVisitsLoaded]);

  /**
   * セッションを取り直して状態へ反映し、ログイン中かを返す。未ログインになっていれば
   * 記録も空にする（ログイン画面の裏に前の利用者の記録を残さない）。
   * 取り直しにも失敗したときは false を返し、内容は loadError へ入れる。
   */
  const refreshSession = useCallback(async (requestGeneration = ++generation.current): Promise<boolean> => {
    const isCurrent = () => requestGeneration === generation.current;
    if (!isCurrent()) return false;
    setLoading(true);
    setLoadError(null);
    try {
      const session = await repository.getSession();
      if (!isCurrent()) return false;
      setAuthenticated(session.authenticated);
      setUser(session.user);
      setCsrfToken(session.csrfToken);
      if (!session.authenticated) onVisitsLoaded([]);
      return session.authenticated;
    } catch (error) {
      if (!isCurrent()) return false;
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return false;
    } finally {
      if (isCurrent()) setLoading(false);
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

  /**
   * 失敗は例外にせず loadError へ入れ、成否だけを返す。画面の再試行ボタンは
   * 結果を待たずに呼ぶため例外にすると未処理の reject になる一方、インポートのように
   * 再読み込みの失敗を利用者へ追記したい呼び出し側は戻り値で判定する
   * （「例外が来たら失敗」と書くと、この関数では一度も通らない分岐になる）。
   * 新しい操作に置き換えられた場合も、結果を反映せず false を返す。
   */
  const reload = useCallback(async (): Promise<boolean> => {
    const requestGeneration = ++generation.current;
    const isCurrent = () => requestGeneration === generation.current;
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await repository.list();
      if (!isCurrent()) return false;
      onVisitsLoaded(loaded);
      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      if (isSessionLostError(error)) {
        // 未ログインに戻っていたらログイン画面を出す。読み込みエラーにすると
        // ApiAccessGate はエラーを優先して「再読み込み」だけを出し、ログインへ進めない。
        // 取り直した時点でログイン済み（別タブで再ログインした）なら、再試行を促す
        if (await refreshSession(requestGeneration)) {
          if (isCurrent()) setLoadError(LOAD_ERROR_FALLBACK);
        }
        return false;
      }
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return false;
    } finally {
      if (isCurrent()) setLoading(false);
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
    onVisitsLoaded([]);
    await refreshSession();
  }, [refreshSession, onVisitsLoaded]);

  return { loading, loadError, authenticated, csrfToken, user, reload, resetSession, revalidateSessionOnError };
}
