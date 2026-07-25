"use client";

import { ReactNode } from "react";
import { UIProvider } from "./UIContext";
import { VisitsDataProvider } from "./VisitsDataContext";
import { EditorProvider } from "./EditorContext";
import { MapStateProvider } from "./MapStateContext";

export function SaunaMapProvider({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <VisitsDataProvider>
        <EditorProvider>
          <MapStateProvider>{children}</MapStateProvider>
        </EditorProvider>
      </VisitsDataProvider>
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
export {
  useVisitsCRUD,
  useVisitFiltersContext,
  VisitsDataProvider,
} from "./VisitsDataContext";
export {
  useSaunaEditor,
  useSaunaEditorState,
  useSaunaEditorActions,
  EditorProvider,
} from "./EditorContext";
export { useSaunaMapState, MapStateProvider } from "./MapStateContext";
