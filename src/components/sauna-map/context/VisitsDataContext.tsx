"use client";

import { ReactNode } from "react";
import { VisitsCRUDProvider } from "./VisitsCRUDContext";
import { VisitFiltersProvider } from "./VisitFiltersContext";

export { useVisitsCRUD, VisitsCRUDProvider } from "./VisitsCRUDContext";
export { useVisitFiltersContext, VisitFiltersProvider } from "./VisitFiltersContext";

/**
 * 訪問データ関連の Provider をまとめてマウントする。
 *
 * 消費側は用途に応じて `useVisitsCRUD`（訪問データ本体・インポート/エクスポート）と
 * `useVisitFiltersContext`（フィルター・絞り込み結果・統計）を個別に呼ぶこと。
 * 両者を 1 オブジェクトに束ねるフックを用意すると、CRUD しか使わない画面まで
 * フィルター変更（検索の 1 文字入力など）のたびに再レンダリングされる。
 */
export function VisitsDataProvider({ children }: { children: ReactNode }) {
  return (
    <VisitsCRUDProvider>
      <VisitFiltersProvider>{children}</VisitFiltersProvider>
    </VisitsCRUDProvider>
  );
}
