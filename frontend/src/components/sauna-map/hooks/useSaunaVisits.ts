import { useCallback, useEffect, useRef, useState } from "react";
import { SaunaVisit, VisitFormState, LatLng } from "../types";
import {
  getVisitRepository,
  type ImportResult,
  type VisitRepository,
} from "../repositories";
import type { ShowToast } from "../components/common/Toast";
import { VISITS_STORAGE_KEY } from "../utils";
import { useVisitImportExport } from "./useVisitImportExport";
import { useInitialVisits } from "./useInitialVisits";
import { toUserMessage, useVisitSession } from "./useVisitSession";

const SAVE_ERROR_FALLBACK = "保存に失敗しました。";

type MutationResult<T> = { success: true; value: T } | { success: false };

export function useSaunaVisits(showToast?: ShowToast, injectedRepository?: VisitRepository) {
  // useRef → useState でレンダリング中の ref アクセス (react-hooks/refs) を回避。
  // localStorage から先読みするかも同じ Repository の dataSource で決め、判定の出所を 1 つにする
  // （注入された Repository はテスト等で list() の結果を制御するため、保存からは先読みしない）。
  const [{ repository, seedFromStorage }] = useState(() => {
    const resolved = injectedRepository ?? getVisitRepository();
    return { repository: resolved, seedFromStorage: !injectedRepository && resolved.dataSource === "local" };
  });
  const { visits, setVisits, unreadableCount } = useInitialVisits(seedFromStorage);
  const session = useVisitSession(repository, {
    onVisitsLoaded: setVisits,
    // 初回の list() は初期値と同じ localStorage の読み込み＋zod検証になるため省く
    skipInitialList: seedFromStorage,
  });
  const { reload, clearSession } = session;

  // 実行中の更新系操作の数。真偽値 1 つで持つと、並行した操作の片方が終わった時点で
  // もう片方の実行中に saving が false へ戻ってしまう
  const [pendingMutations, setPendingMutations] = useState(0);

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
    async <T,>(operation: () => Promise<T>): Promise<MutationResult<T>> => {
      setPendingMutations((count) => count + 1);
      try {
        return { success: true, value: await operation() };
      } catch (error) {
        showToast?.(toUserMessage(error, SAVE_ERROR_FALLBACK), "error");
        return { success: false };
      } finally {
        setPendingMutations((count) => count - 1);
      }
    },
    [showToast],
  );

  const addVisit = useCallback(
    async (location: LatLng, form: VisitFormState) => {
      const result = await runMutation(() => repository.create(location, form));
      if (!result.success) return { success: false, newVisit: undefined };
      setVisits((current) => [result.value, ...current]);
      return { success: true, newVisit: result.value };
    },
    [repository, runMutation, setVisits],
  );

  const replaceVisit = useCallback(
    (id: string, updated: SaunaVisit) => {
      setVisits((items) => items.map((visit) => (visit.id === id ? updated : visit)));
    },
    [setVisits],
  );

  /*
   * 更新系は対象の記録そのものを受け取る（楽観ロックの版 lockVersion も記録が持つ）。
   * ID から visits を引く形にすると操作関数が visits に依存し、記録が 1 件変わるたびに
   * VisitsActionsContext の参照が変わって、操作関数しか使わない消費側まで再レンダリングされる。
   */
  const editVisit = useCallback(
    async (target: SaunaVisit, location: LatLng, form: VisitFormState) => {
      const result = await runMutation(() => repository.update(target, location, form));
      if (result.success) replaceVisit(target.id, result.value);
      return { success: result.success };
    },
    [repository, runMutation, replaceVisit],
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
      if (result.success) replaceVisit(target.id, result.value);
      return { success: result.success };
    },
    [repository, runMutation, replaceVisit],
  );

  // localモードは別タブの保存を storage イベントで受け取り、表示を保存値へ揃える。
  // 購読しないと、別タブで消した記録が残り続け、追加された記録も再読み込みまで出ない
  // （保存自体は LocalVisitRepository が毎回最新値を読むため上書きでは消えない）。
  useEffect(() => {
    if (repository.dataSource !== "local") return;
    const handleStorage = (event: StorageEvent) => {
      // key が null なのは別タブで localStorage.clear() されたとき
      if (event.key === VISITS_STORAGE_KEY || event.key === null) void reload();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [repository, reload]);

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
    clearSession();
    setVisits([]);
  }, [repository, clearSession, setVisits]);

  return {
    visits,
    loading: session.loading,
    saving: pendingMutations > 0,
    loadError: session.loadError,
    authenticated: session.authenticated,
    csrfToken: session.csrfToken,
    user: session.user,
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
