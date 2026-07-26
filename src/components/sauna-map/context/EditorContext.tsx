"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  FormEvent,
} from "react";
import { useEditorState } from "../hooks/useEditorState";
import { useVisitForm } from "../hooks/useVisitForm";
import { useSaunaUI } from "./UIContext";
import { useVisitsCRUD } from "./VisitsCRUDContext";
import { useVisitFiltersContext } from "./VisitFiltersContext";
import { getVisitHistoryEntries } from "../utils";
import { SaunaVisit, VisitFormState, LatLng } from "../types";

/**
 * 入力中のフォーム値だけを載せる Context。
 *
 * これを EditorState 側に同居させると、1 文字入力するたびに編集状態を購読している
 * 全消費側（SaunaMapContent / DesktopSidebar / VisitList）が再レンダリング対象になる。
 * フォームの値が要るのは VisitForm だけなので、必ず分けておくこと。
 */
export interface EditorFormContextType {
  form: VisitFormState;
  setForm: React.Dispatch<React.SetStateAction<VisitFormState>>;
  imageUploading: boolean;
}

export interface EditorStateContextType {
  editorState: ReturnType<typeof useEditorState>["state"];
  mode: ReturnType<typeof useEditorState>["state"]["mode"];
  editingId: string | null;
  selectedLocation: LatLng | null;
  isSidebarExpanded: boolean;
  isAdding: boolean;
  isMobilePickingLocation: boolean;
  isCreating: boolean;
  editingVisit: SaunaVisit | null;
  historyEntries: ReturnType<typeof getVisitHistoryEntries>;
}

export interface EditorActionsContextType {
  startNewVisit: () => void;
  startEditing: (visit: SaunaVisit) => void;
  handleDelete: () => void;
  confirmDelete: () => void;
  handleLocationSelect: (lat: number, lng: number) => void;
  handleBoundsChange: (bounds: { northEast: LatLng; southWest: LatLng }) => void;
  /** onCompleted は保存成功後に呼ばれる（モバイルのシート位置を戻すために使う） */
  handleSubmit: (e: FormEvent, onCompleted?: () => void) => void;
  handleImageFile: (file: File) => Promise<void>;
  handleRemoveImage: () => void;
  handleDeleteHistoryEntry: (index: number) => void;
  cancelEditing: (completed?: boolean) => void;
  toggleSidebar: () => void;
  startCreate: ReturnType<typeof useEditorState>["startCreate"];
}

export type EditorContextType = EditorStateContextType & EditorActionsContextType;

const EditorFormContext = createContext<EditorFormContextType | null>(null);
const EditorStateContext = createContext<EditorStateContextType | null>(null);
const EditorActionsContext = createContext<EditorActionsContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const { isMobile, showToast, openDeleteConfirm, closeDeleteConfirm } = useSaunaUI();
  const { visits, addVisit, editVisit, deleteVisit, removeHistoryEntry } = useVisitsCRUD();
  // 地図の表示範囲フィルターを更新するために setFilters のみ利用する
  const { setFilters } = useVisitFiltersContext();

  const {
    state: editorState,
    startCreate,
    startEdit,
    selectLocation,
    cancelEdit,
    toggleSidebar,
  } = useEditorState(isMobile);

  const { mode, editingId, selectedLocation, isSidebarExpanded } = editorState;

  const isAdding = mode !== "list";
  const isMobilePickingLocation = isMobile && mode === "creating:pick";
  const isCreating = mode === "creating:pick" || mode === "creating:form";

  const editingVisit = editingId ? visits.find((v) => v.id === editingId) ?? null : null;
  const historyEntries = useMemo(
    () => (editingVisit ? getVisitHistoryEntries(editingVisit) : []),
    [editingVisit],
  );

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      selectLocation({ lat, lng });
    },
    [selectLocation],
  );

  const handleBoundsChange = useCallback(
    (bounds: { northEast: LatLng; southWest: LatLng }) => {
      setFilters((prev) => ({
        ...prev,
        mapBounds: bounds,
      }));
    },
    [setFilters],
  );

  const {
    form,
    setForm,
    imageUploading,
    startNewVisit,
    startEditing,
    cancelEditing,
    handleDelete,
    confirmDelete,
    handleSubmit,
    handleImageFile,
    handleRemoveImage,
    handleDeleteHistoryEntry,
  } = useVisitForm({
    editingId,
    selectedLocation,
    historyEntries,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    startCreate,
    startEdit,
    cancelEdit,
    openDeleteConfirm,
    closeDeleteConfirm,
    showToast,
  });

  // フォームの値は state 側に混ぜないこと（1 文字ごとに全消費側が再レンダリングされる）
  const formValue = useMemo(
    () => ({ form, setForm, imageUploading }),
    [form, setForm, imageUploading],
  );

  const stateValue = useMemo(
    () => ({
      editorState,
      mode,
      editingId,
      selectedLocation,
      isSidebarExpanded,
      isAdding,
      isMobilePickingLocation,
      isCreating,
      editingVisit,
      historyEntries,
    }),
    [
      editorState,
      mode,
      editingId,
      selectedLocation,
      isSidebarExpanded,
      isAdding,
      isMobilePickingLocation,
      isCreating,
      editingVisit,
      historyEntries,
    ],
  );

  const actionsValue = useMemo(
    () => ({
      startNewVisit,
      startEditing,
      handleDelete,
      confirmDelete,
      handleLocationSelect,
      handleBoundsChange,
      handleSubmit,
      handleImageFile,
      handleRemoveImage,
      handleDeleteHistoryEntry,
      cancelEditing,
      toggleSidebar,
      startCreate,
    }),
    [
      startNewVisit,
      startEditing,
      handleDelete,
      confirmDelete,
      handleLocationSelect,
      handleBoundsChange,
      handleSubmit,
      handleImageFile,
      handleRemoveImage,
      handleDeleteHistoryEntry,
      cancelEditing,
      toggleSidebar,
      startCreate,
    ],
  );

  return (
    <EditorStateContext.Provider value={stateValue}>
      <EditorActionsContext.Provider value={actionsValue}>
        <EditorFormContext.Provider value={formValue}>
          {children}
        </EditorFormContext.Provider>
      </EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
}

/** 入力中のフォーム値。VisitForm 以外から購読しないこと。 */
export function useSaunaEditorForm() {
  const context = useContext(EditorFormContext);
  if (!context) {
    throw new Error("useSaunaEditorForm must be used within an EditorProvider");
  }
  return context;
}

export function useSaunaEditorState() {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error("useSaunaEditorState must be used within an EditorProvider");
  }
  return context;
}

export function useSaunaEditorActions() {
  const context = useContext(EditorActionsContext);
  if (!context) {
    throw new Error("useSaunaEditorActions must be used within an EditorProvider");
  }
  return context;
}

/**
 * 編集状態と操作をまとめて受け取る。フォームの値は含まれないので、
 * 入力値が必要な場合は `useSaunaEditorForm()` を併用すること。
 */
export function useSaunaEditor(): EditorContextType {
  const state = useSaunaEditorState();
  const actions = useSaunaEditorActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
