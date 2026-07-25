"use client";

import { ReactNode } from "react";
import { UIProvider } from "./UIContext";
import { VisitsCRUDProvider } from "./VisitsCRUDContext";
import { VisitFiltersProvider } from "./VisitFiltersContext";
import { EditorProvider } from "./EditorContext";
import { MapStateProvider } from "./MapStateContext";

/**
 * 訪問データは CRUD とフィルターで Provider を分けている。
 * 両者を 1 オブジェクトに束ねるフックを用意すると、CRUD しか使わない画面まで
 * フィルター変更（検索の 1 文字入力など）のたびに再レンダリングされる。
 */
export function SaunaMapProvider({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <VisitsCRUDProvider>
        <VisitFiltersProvider>
          <EditorProvider>
            <MapStateProvider>{children}</MapStateProvider>
          </EditorProvider>
        </VisitFiltersProvider>
      </VisitsCRUDProvider>
    </UIProvider>
  );
}

// 各 Context / Hook の再エクスポート。
// 消費側は責務ごとの専用フック（useSaunaUI / useVisitsCRUD /
// useVisitFiltersContext / useSaunaEditor / useSaunaMapState）を直接使うこと。
// 複数の Context を束ねる統合フックを復活させると、どれか 1 つの状態変化で
// 全消費側が再レンダリングされる。
export {
  useSaunaUI,
  useSaunaUIState,
  useSaunaUIActions,
  UIProvider,
} from "./UIContext";
export { useVisitsCRUD, VisitsCRUDProvider } from "./VisitsCRUDContext";
export { useVisitFiltersContext, VisitFiltersProvider } from "./VisitFiltersContext";
export {
  useSaunaEditor,
  useSaunaEditorState,
  useSaunaEditorActions,
  useSaunaEditorForm,
  EditorProvider,
} from "./EditorContext";
export { useSaunaMapState, MapStateProvider } from "./MapStateContext";
