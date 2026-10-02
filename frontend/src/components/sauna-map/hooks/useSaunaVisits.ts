import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { SaunaVisit, VisitFormState, LatLng } from "../types";
import {
  getVisitRepository,
  type DataSource,
  type ImportResult,
  type SessionUser,
  type VisitRepository,
} from "../repositories";
import type { ShowToast } from "../components/common/Toast";
import { VISITS_STORAGE_KEY } from "../utils";
import { useVisitImportExport } from "./useVisitImportExport";
import { useInitialVisits } from "./useInitialVisits";
import { toUserMessage, useVisitSession } from "./useVisitSession";

const SAVE_ERROR_FALLBACK = "保存に失敗しました。";
const LOGOUT_ERROR_FALLBACK = "ログアウトに失敗しました。";

type MutationResult<T> = { success: true; value: T } | { success: false };

/** 読み込み・保存中・認証などの状態。保存の開始と終了で変わる */
export interface VisitsStatus {
  loading: boolean;
  saving: boolean;
  importing: boolean;
  exporting: boolean;
  loadError: string | null;
  authenticated: boolean;
  csrfToken: string | null;
  user: SessionUser | null;
  dataSource: DataSource;
}

/** 操作関数。visits に依存させず、記録が変わっても参照を変えないこと */
export interface VisitsActions {
  addVisit: (location: LatLng, form: VisitFormState) => Promise<{ success: boolean; newVisit?: SaunaVisit }>;
  editVisit: (visit: SaunaVisit, location: LatLng, form: VisitFormState) => Promise<{ success: boolean }>;
  deleteVisit: (id: string) => Promise<{ success: boolean }>;
  removeHistoryEntry: (visit: SaunaVisit, index: number) => Promise<{ success: boolean }>;
  /** apiモードは写真の取得を待つ。失敗はトーストで伝えるため reject しない */
  exportVisits: () => Promise<void>;
  handleImportData: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  importInputRef: RefObject<HTMLInputElement | null>;
  /** 再読み込みが成功したか。失敗の内容は loadError に入る */
  reload: () => Promise<boolean>;
  /** ログアウトに成功したか。失敗はトーストで伝える */
  logout: () => Promise<boolean>;
}

/**
 * 記録本体・状態・操作関数を、変化の頻度ごとに分けて返す（VisitsCRUDProvider がそのまま
 * 別々の Context へ配る）。平らな 1 つのオブジェクトで返すと、Provider 側で名前を
 * 分割代入・詰め直し・依存配列と 3 回書き写すことになり、操作を足すたびに漏れが出る。
 */

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
  const { reload, resetSession, revalidateSessionOnError } = session;

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
        await revalidateSessionOnError(error);
        return { success: false };
      } finally {
        setPendingMutations((count) => count - 1);
      }
    },
    [showToast, revalidateSessionOnError],
  );

  /**
   * runMutation を通らない Repository 呼び出し（インポート・エクスポート）用。
   * 失敗の伝え方は呼び出し側（useVisitImportExport）に任せ、セッションの喪失だけはここで拾う。
   */
  const withSessionRevalidation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        await revalidateSessionOnError(error);
        throw error;
      }
    },
    [revalidateSessionOnError],
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
    async (items: SaunaVisit[]): Promise<ImportResult> =>
      withSessionRevalidation(() => repository.importBatch(items)),
    [repository, withSessionRevalidation],
  );

  // インポートの重複判定とエクスポートはクリック時点の visits を読めれば足りる。
  // visits を直接渡すと操作関数が記録の変化ごとに作り直されるため、ref 経由で渡す
  // （ref の更新はコミット後のエフェクトで行い、レンダリング中には触らない）。
  const visitsRef = useRef(visits);
  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);
  const getVisits = useCallback(() => visitsRef.current, []);

  const prepareExport = useCallback(
    async (items: SaunaVisit[]): Promise<SaunaVisit[]> =>
      withSessionRevalidation(() => repository.prepareExport(items)),
    [repository, withSessionRevalidation],
  );

  const importExport = useVisitImportExport(getVisits, importBatch, prepareExport, reload, showToast);

  /** 失敗はトーストで伝え、成否だけを返す（メニューから結果を待たずに呼ぶため例外にしない） */
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      await repository.logout();
    } catch (error) {
      showToast?.(toUserMessage(error, LOGOUT_ERROR_FALLBACK), "error");
      await revalidateSessionOnError(error);
      return false;
    }
    setVisits([]);
    await resetSession();
    return true;
  }, [repository, resetSession, revalidateSessionOnError, setVisits, showToast]);

  const saving = pendingMutations > 0;
  const { dataSource } = repository;
  const { loading, loadError, authenticated, csrfToken, user } = session;
  const { importing, exporting, exportVisits, handleImportData, importInputRef } = importExport;

  const status = useMemo<VisitsStatus>(
    () => ({ loading, saving, importing, exporting, loadError, authenticated, csrfToken, user, dataSource }),
    [loading, saving, importing, exporting, loadError, authenticated, csrfToken, user, dataSource],
  );

  const actions = useMemo<VisitsActions>(
    () => ({
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
      exportVisits,
      handleImportData,
      importInputRef,
      reload,
      logout,
    }),
    [addVisit, editVisit, deleteVisit, removeHistoryEntry, exportVisits, handleImportData, importInputRef, reload, logout],
  );

  return { visits, status, actions };
}
