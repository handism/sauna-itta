import { useCallback, useEffect, useState } from "react";
import type { SaunaVisit } from "../types";
import { RepositoryError, type SessionUser, type VisitRepository } from "../repositories";

export const LOAD_ERROR_FALLBACK = "記録の読み込みに失敗しました。";

/**
 * Repository の失敗を利用者向けの文言へ変換する。
 * 楽観ロックの競合（code: conflict）だけを再読み込みの案内へ置き換える。同じ 409 でも
 * 一意制約の重複（code: duplicate）はサーバーの文言をそのまま出す（status で判定すると隠れる）。
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof RepositoryError && error.code === "conflict") {
    return "別の画面で記録が更新されました。再読み込みしてからもう一度お試しください。";
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
  const reload = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);
    try {
      onVisitsLoaded(await repository.list());
      return true;
    } catch (error) {
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
      return false;
    } finally {
      setLoading(false);
    }
  }, [repository, onVisitsLoaded]);

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
    try {
      const session = await repository.getSession();
      setAuthenticated(session.authenticated);
      setUser(session.user);
      setCsrfToken(session.csrfToken);
    } catch (error) {
      setLoadError(toUserMessage(error, LOAD_ERROR_FALLBACK));
    }
  }, [repository]);

  return { loading, loadError, authenticated, csrfToken, user, reload, resetSession };
}
