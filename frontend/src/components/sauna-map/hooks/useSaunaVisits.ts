import { useCallback, useEffect, useRef, useState } from "react";
import { SaunaVisit, VisitFormState, LatLng } from "../types";
import {
  getVisitRepository,
  RepositoryError,
  type ImportResult,
  type SessionUser,
  type VisitRepository,
} from "../repositories";
import { useVisitImportExport } from "./useVisitImportExport";
import { useInitialVisits } from "./useInitialVisits";

type Toast = (message: string, type: "success" | "error" | "info") => void;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof RepositoryError && error.status === 409) {
    return "別の画面で記録が更新されました。再読み込みしてからもう一度お試しください。";
  }
  return error instanceof Error ? error.message : fallback;
}

const LOAD_ERROR_FALLBACK = "記録の読み込みに失敗しました。";
const SAVE_ERROR_FALLBACK = "保存に失敗しました。";

export function useSaunaVisits(showToast?: Toast, injectedRepository?: VisitRepository) {
  // useRef → useState でレンダリング中の ref アクセス (react-hooks/refs) を回避
  const [repository] = useState(() => injectedRepository ?? getVisitRepository());
  const { visits, setVisits, seededFromStorage, unreadableCount } = useInitialVisits(injectedRepository);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(repository.dataSource === "local");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await repository.list();
      setVisits(loaded);
    } catch (error) {
      setLoadError(errorMessage(error, LOAD_ERROR_FALLBACK));
    } finally {
      setLoading(false);
    }
  }, [repository, setVisits]);

  useEffect(() => {
    let active = true;
    // React 18/19 のエフェクト実行直後における状態不整合や「Cannot update a component while rendering」
    // の警告を避けるため、マイクロタスクキューにスケジュールしてから非同期読み込み・状態更新を開始する
    queueMicrotask(async () => {
      try {
        const session = await repository.getSession();
        if (!active) return;
        setAuthenticated(session.authenticated);
        setCsrfToken(session.csrfToken);
        setUser(session.user);
        // 初回の list() は上の初期値と同じ localStorage の読み込み＋zod検証になるため省く
        if (session.authenticated && !seededFromStorage) {
          const loaded = await repository.list();
          if (active) setVisits(loaded);
        }
      } catch (error) {
        if (active) setLoadError(errorMessage(error, LOAD_ERROR_FALLBACK));
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [repository, seededFromStorage, setVisits]);

  // 読めなかった記録は保存から消さずに残しているが、画面には出ないため存在を伝える
  useEffect(() => {
    if (unreadableCount > 0) {
      showToast?.(
        `保存データのうち${unreadableCount}件の記録を読み込めなかったため、表示から除外しています（データは削除せず残しています）。`,
        "error",
      );
    }
  }, [unreadableCount, showToast]);

  const runMutation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<{ success: boolean; value?: T }> => {
      setSaving(true);
      try {
        return { success: true, value: await operation() };
      } catch (error) {
        showToast?.(errorMessage(error, SAVE_ERROR_FALLBACK), "error");
        return { success: false };
      } finally {
        setSaving(false);
      }
    },
    [showToast],
  );

  const addVisit = useCallback(
    async (location: LatLng, form: VisitFormState) => {
      const result = await runMutation(() => repository.create(location, form));
      if (result.value) setVisits((current) => [result.value as SaunaVisit, ...current]);
      return { success: result.success, newVisit: result.value };
    },
    [repository, runMutation, setVisits],
  );

  /*
   * 更新系は対象の記録そのものを受け取る（楽観ロックの版 lockVersion も記録が持つ）。
   * ID から visits を引く形にすると操作関数が visits に依存し、記録が 1 件変わるたびに
   * VisitsActionsContext の参照が変わって、操作関数しか使わない消費側まで再レンダリングされる。
   */
  const editVisit = useCallback(
    async (target: SaunaVisit, location: LatLng, form: VisitFormState) => {
      const result = await runMutation(() => repository.update(target, location, form));
      if (result.value) {
        setVisits((items) => items.map((visit) => (visit.id === target.id ? result.value as SaunaVisit : visit)));
      }
      return { success: result.success };
    },
    [repository, runMutation, setVisits],
  );

  const deleteVisit = useCallback(
    async (id: string) => {
      const result = await runMutation(() => repository.delete(id));
      if (result.success) setVisits((current) => current.filter((visit) => visit.id !== id));
      return { success: result.success };
    },
    [repository, runMutation, setVisits],
  );

  const removeHistoryEntry = useCallback(
    async (target: SaunaVisit, index: number) => {
      const result = await runMutation(() => repository.deleteHistoryEntry(target, index));
      if (result.value) {
        setVisits((items) => items.map((visit) => (visit.id === target.id ? result.value as SaunaVisit : visit)));
      }
      return { success: result.success };
    },
    [repository, runMutation, setVisits],
  );

  const importBatch = useCallback(
    async (items: SaunaVisit[]): Promise<ImportResult> => repository.importBatch(items),
    [repository],
  );

  // インポートの重複判定とエクスポートはクリック時点の visits を読めれば足りる。
  // visits を直接渡すと操作関数が記録の変化ごとに作り直されるため、ref 経由で渡す
  // （ref の更新はコミット後のエフェクトで行い、レンダリング中には触らない）。
  const visitsRef = useRef(visits);
  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);
  const getVisits = useCallback(() => visitsRef.current, []);

  const importExport = useVisitImportExport(getVisits, importBatch, reload, showToast);

  const logout = useCallback(async () => {
    await repository.logout();
    setAuthenticated(false);
    setUser(null);
    setVisits([]);
  }, [repository, setVisits]);

  return {
    visits,
    loading,
    saving,
    loadError,
    authenticated,
    csrfToken,
    user,
    dataSource: repository.dataSource,
    reload,
    logout,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    ...importExport,
  };
}
