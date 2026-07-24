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
import { useSaunaVisitsData } from "./VisitsDataContext";
import { getVisitHistoryEntries } from "../utils";
import { SaunaVisit, VisitFormState, LatLng } from "../types";

export interface EditorStateContextType {
  form: VisitFormState;
  setForm: React.Dispatch<React.SetStateAction<VisitFormState>>;
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
  imageUploading: boolean;
}

export interface EditorActionsContextType {
  startNewVisit: () => void;
  startEditing: (visit: SaunaVisit) => void;
  handleDelete: () => void;
  confirmDelete: () => void;
  handleLocationSelect: (lat: number, lng: number) => void;
  handleBoundsChange: (bounds: { northEast: LatLng; southWest: LatLng }) => void;
  handleSubmit: (e: FormEvent) => void;
  handleImageFile: (file: File) => Promise<void>;
  handleRemoveImage: () => void;
  handleDeleteHistoryEntry: (index: number) => void;
  cancelEditing: (completed?: boolean) => void;
  toggleSidebar: () => void;
  startCreate: ReturnType<typeof useEditorState>["startCreate"];
}

export type EditorContextType = EditorStateContextType & EditorActionsContextType;

const EditorStateContext = createContext<EditorStateContextType | null>(null);
const EditorActionsContext = createContext<EditorActionsContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const { isMobile, showToast, openDeleteConfirm, closeDeleteConfirm } = useSaunaUI();
  const {
    visits,
    addVisit,
    editVisit,
    deleteVisit,
    removeHistoryEntry,
    setFilters,
  } = useSaunaVisitsData();

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

  const stateValue = useMemo(
    () => ({
      form,
      setForm,
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
      imageUploading,
    }),
    [
      form,
      setForm,
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
      imageUploading,
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
        {children}
      </EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
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

export function useSaunaEditor(): EditorContextType {
  const state = useSaunaEditorState();
  const actions = useSaunaEditorActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
