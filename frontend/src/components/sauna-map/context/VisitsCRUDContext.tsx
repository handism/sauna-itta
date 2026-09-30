"use client";

import { createContext, useContext, useMemo, ReactNode, ChangeEvent, RefObject } from "react";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useSaunaUIActions } from "./UIContext";
import type { SaunaVisit, LatLng, VisitFormState } from "../types";
import type { DataSource, SessionUser } from "../repositories";

/*
 * 訪問データは変化の頻度ごとに 3 つの Context へ分けている。
 *
 * - Data: 記録本体。保存・削除・インポートのたびに変わる
 * - Status: 読み込み・保存中・認証などの状態。保存の開始と終了で変わる
 * - Actions: 操作関数。参照は変わらない
 *
 * 1 つにまとめると、インポートボタンしか使わない DesktopSidebar や、認証状態しか見ない
 * SaunaMapContent まで、記録が 1 件変わるたびに再レンダリング対象になる。
 * 操作関数は visits に依存させないこと（useSaunaVisits のコメント参照）。
 */

export interface VisitsDataContextType {
  visits: SaunaVisit[];
}

export interface VisitsStatusContextType {
  loading: boolean;
  saving: boolean;
  importing: boolean;
  loadError: string | null;
  authenticated: boolean;
  csrfToken: string | null;
  user: SessionUser | null;
  dataSource: DataSource;
}

export interface VisitsActionsContextType {
  addVisit: (location: LatLng, form: VisitFormState) => Promise<{ success: boolean; newVisit?: SaunaVisit }>;
  editVisit: (visit: SaunaVisit, location: LatLng, form: VisitFormState) => Promise<{ success: boolean }>;
  deleteVisit: (id: string) => Promise<{ success: boolean }>;
  removeHistoryEntry: (visit: SaunaVisit, index: number) => Promise<{ success: boolean }>;
  exportVisits: () => void;
  handleImportData: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  importInputRef: RefObject<HTMLInputElement | null>;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

const VisitsDataContext = createContext<VisitsDataContextType | null>(null);
const VisitsStatusContext = createContext<VisitsStatusContextType | null>(null);
const VisitsActionsContext = createContext<VisitsActionsContextType | null>(null);

export function VisitsCRUDProvider({ children }: { children: ReactNode }) {
  const { showToast } = useSaunaUIActions();

  const {
    visits,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    exportVisits,
    handleImportData,
    importing,
    importInputRef,
    loading,
    saving,
    loadError,
    authenticated,
    csrfToken,
    user,
    dataSource,
    reload,
    logout,
  } = useSaunaVisits(showToast);

  const dataValue = useMemo(() => ({ visits }), [visits]);

  const statusValue = useMemo(
    () => ({ loading, saving, importing, loadError, authenticated, csrfToken, user, dataSource }),
    [loading, saving, importing, loadError, authenticated, csrfToken, user, dataSource],
  );

  const actionsValue = useMemo(
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
    [
      addVisit,
      editVisit,
      deleteVisit,
      removeHistoryEntry,
      exportVisits,
      handleImportData,
      importInputRef,
      reload,
      logout,
    ],
  );

  return (
    <VisitsActionsContext.Provider value={actionsValue}>
      <VisitsStatusContext.Provider value={statusValue}>
        <VisitsDataContext.Provider value={dataValue}>
          {children}
        </VisitsDataContext.Provider>
      </VisitsStatusContext.Provider>
    </VisitsActionsContext.Provider>
  );
}

/** 記録本体。保存・削除・インポートのたびに参照が変わる */
export function useVisitsData() {
  const ctx = useContext(VisitsDataContext);
  if (!ctx) throw new Error("useVisitsData must be used within VisitsCRUDProvider");
  return ctx;
}

/** 読み込み・保存中・認証などの状態 */
export function useVisitsStatus() {
  const ctx = useContext(VisitsStatusContext);
  if (!ctx) throw new Error("useVisitsStatus must be used within VisitsCRUDProvider");
  return ctx;
}

/** 操作関数。記録が変わっても参照は変わらない */
export function useVisitsActions() {
  const ctx = useContext(VisitsActionsContext);
  if (!ctx) throw new Error("useVisitsActions must be used within VisitsCRUDProvider");
  return ctx;
}
