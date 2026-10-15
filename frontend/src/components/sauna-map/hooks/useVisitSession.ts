import { useCallback, useEffect, useRef, useState } from "react";
import type { SaunaVisit } from "../types";
import { isSessionLostError, toUserMessage, type SessionUser, type VisitRepository } from "../repositories";

export const LOAD_ERROR_FALLBACK = "記録の読み込みに失敗しました。";

/**
 * セッションを取り直した結果。
 * - authenticated: 同じ利用者のままログイン中
 * - switched: 別の利用者でログインし直されていたため、その利用者の記録を読み込み直した
 * - unauthenticated: 未ログインに戻っていた（記録は空にした）
 * - failed: 取り直し（または読み込み直し）に失敗した、または新しい操作に置き換えられた
 */
type SessionRefreshResult = "authenticated" | "switched" | "unauthenticated" | "failed";

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
  // 表示中の記録の持ち主。セッションを取り直したときに別の利用者へ替わったかを判定する
  // （コールバックの依存に user の state を入れると、取り直すたびに操作関数の参照が変わる）
  const userEmail = useRef<string | null>(null);

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
        userEmail.current = session.user?.email ?? null;
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
   * セッションを取り直して状態へ反映する。未ログインになっていれば記録も空にする
   * （ログイン画面の裏に前の利用者の記録を残さない）。別タブで別の利用者がログインし直して
   * いれば、前の利用者の記録を消してから新しい利用者の記録を読み込む（残すと、操作のたびに
   * 404 になり続けるうえ、前の利用者の記録が見えたままになる）。
   * 取り直しにも失敗したときは "failed" を返し、内容は loadError へ入れる。
   */
  const refreshSession = useCallback(async (requestGeneration = ++generation.current): Promise<SessionRefreshResult> => {
    const isCurrent = () => requestGeneration === generation.current;
    if (!isCurrent()) return "failed";
    setLoading(true);
    setLoadError(null);
    try {
      const session = await repository.getSession();
      if (!isCurrent()) return "failed";
      const nextEmail = session.user?.email ?? null;
      const switched = session.authenticated && nextEmail !== userEmail.current;
      setAuthenticated(session.authenticated);
      setUser(session.user);
      setCsrfToken(session.csrfToken);
      userEmail.current = nextEmail;
      if (!session.authenticated) {
        onVisitsLoaded([]);
        return "unauthenticated";
      }
      if (!switched) return "authenticated";
      onVisitsLoaded([]);
      const loaded = await repository.list();
      if (!isCurrent()) return "failed";
      onVisitsLoaded(loaded);
      return "switched";
    } catch (error) {
      if (!isCurrent()) return "failed";
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return "failed";
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
        // 取り直した時点で同じ利用者のままログイン済み（別タブで再ログインした）なら、再試行を促す。
        // 別の利用者へ替わっていた場合は refreshSession がその利用者の記録を読み込み済み
        if ((await refreshSession(requestGeneration)) === "authenticated") {
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
    userEmail.current = null;
    onVisitsLoaded([]);
    await refreshSession();
  }, [refreshSession, onVisitsLoaded]);

  return { loading, loadError, authenticated, csrfToken, user, reload, resetSession, revalidateSessionOnError };
}
