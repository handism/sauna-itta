"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSaunaVisits, type VisitsActions, type VisitsStatus } from "../hooks/useSaunaVisits";
import { useSaunaUIActions } from "./UIContext";
import type { SaunaVisit } from "../types";

/*
 * 訪問データは変化の頻度ごとに 3 つの Context へ分けている。
 *
 * - Data: 記録本体。保存・削除・インポートのたびに変わる
 * - Status: 読み込み・保存中・認証などの状態。保存の開始と終了で変わる
 * - Actions: 操作関数。参照は変わらない
 *
 * 1 つにまとめると、インポートボタンしか使わない DesktopSidebar や、認証状態しか見ない
 * SaunaMapContent まで、記録が 1 件変わるたびに再レンダリング対象になる。
 * Status / Actions の組み立てと参照の安定化は useSaunaVisits が受け持つ
 * （操作関数は visits に依存させないこと。useSaunaVisits のコメント参照）。
 */

export interface VisitsDataContextType {
  visits: SaunaVisit[];
}

export type VisitsStatusContextType = VisitsStatus;
export type VisitsActionsContextType = VisitsActions;

const VisitsDataContext = createContext<VisitsDataContextType | null>(null);
const VisitsStatusContext = createContext<VisitsStatusContextType | null>(null);
const VisitsActionsContext = createContext<VisitsActionsContextType | null>(null);

export function VisitsCRUDProvider({ children }: { children: ReactNode }) {
  const { showToast } = useSaunaUIActions();
  const { visits, status, actions } = useSaunaVisits(showToast);

  const dataValue = useMemo(() => ({ visits }), [visits]);

  return (
    <VisitsActionsContext.Provider value={actions}>
      <VisitsStatusContext.Provider value={status}>
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
