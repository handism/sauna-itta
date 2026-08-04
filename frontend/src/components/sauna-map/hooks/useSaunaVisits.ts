import { useCallback, useEffect, useState } from "react";
import { SaunaVisit, VisitFormState, LatLng } from "../types";
import {
  DATA_SOURCE,
  getVisitRepository,
  RepositoryError,
  type ImportResult,
  type SessionUser,
  type VisitRepository,
} from "../repositories";
import { getInitialVisits } from "../utils";
import { useVisitImportExport } from "./useVisitImportExport";

type Toast = (message: string, type: "success" | "error" | "info") => void;

function mutationErrorMessage(error: unknown): string {
  if (error instanceof RepositoryError && error.status === 409) {
    return "別の画面で記録が更新されました。再読み込みしてからもう一度お試しください。";
  }
  return error instanceof Error ? error.message : "保存に失敗しました。";
}

export function useSaunaVisits(showToast?: Toast, injectedRepository?: VisitRepository) {
  // useRef → useState でレンダリング中の ref アクセス (react-hooks/refs) を回避
  const [repository] = useState(() => injectedRepository ?? getVisitRepository());
  // localモードは初期描画を空にしないため同期的に読み込む（ちらつき防止）
  const seededFromStorage = DATA_SOURCE === "local" && !injectedRepository;
  const [visits, setVisits] = useState<SaunaVisit[]>(() =>
    seededFromStorage ? getInitialVisits() : [],
  );
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
      setLoadError(mutationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [repository]);

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
        if (active) setLoadError(mutationErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [repository, seededFromStorage]);

  const runMutation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<{ success: boolean; value?: T }> => {
      setSaving(true);
      try {
        return { success: true, value: await operation() };
      } catch (error) {
        showToast?.(mutationErrorMessage(error), "error");
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
    [repository, runMutation],
  );

  const editVisit = useCallback(
    async (id: string, location: LatLng, form: VisitFormState) => {
      const result = await runMutation(() => repository.update(id, location, form));
      if (result.value) {
        setVisits((current) => current.map((visit) => (visit.id === id ? result.value as SaunaVisit : visit)));
      }
      return { success: result.success };
    },
    [repository, runMutation],
  );

  const deleteVisit = useCallback(
    async (id: string) => {
      const result = await runMutation(() => repository.delete(id));
      if (result.success) setVisits((current) => current.filter((visit) => visit.id !== id));
      return { success: result.success };
    },
    [repository, runMutation],
  );

  const removeHistoryEntry = useCallback(
    async (id: string, index: number) => {
      const current = visits.find((visit) => visit.id === id);
      if (!current) return { success: false };
      const result = await runMutation(() => repository.deleteHistoryEntry(current, index));
      if (result.value) {
        setVisits((items) => items.map((visit) => (visit.id === id ? result.value as SaunaVisit : visit)));
      }
      return { success: result.success };
    },
    [repository, runMutation, visits],
  );

  const importBatch = useCallback(
    async (items: SaunaVisit[]): Promise<ImportResult> => repository.importBatch(items),
    [repository],
  );

  const importExport = useVisitImportExport(visits, undefined, showToast, importBatch, reload);

  const logout = useCallback(async () => {
    await repository.logout();
    setAuthenticated(false);
    setUser(null);
    setVisits([]);
  }, [repository]);

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
