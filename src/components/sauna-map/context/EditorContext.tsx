"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  FormEvent,
} from "react";
import { useEditorState } from "../hooks/useEditorState";
import { useSaunaUI } from "./UIContext";
import { useSaunaVisitsData } from "./VisitsDataContext";
import {
  getDefaultForm,
  getTodayDate,
  getVisitHistoryEntries,
  toFormState,
  compressAndGetBase64,
} from "../utils";
import { SaunaVisit, VisitFormState, LatLng } from "../types";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

interface EditorContextType {
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

const EditorContext = createContext<EditorContextType | null>(null);

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

  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const [imageUploading, setImageUploading] = useState(false);

  const {
    state: editorState,
    startCreate,
    startEdit,
    selectLocation,
    cancelEdit,
    toggleSidebar,
  } = useEditorState(isMobile);

  const { mode, editingId, selectedLocation, isSidebarExpanded } = editorState;

  const cancelEditing = useCallback(
    (completed = false) => {
      cancelEdit(completed);
      setForm(getDefaultForm());
    },
    [cancelEdit],
  );

  const startNewVisit = useCallback(() => {
    startCreate();
    setForm(getDefaultForm(getTodayDate()));
  }, [startCreate]);

  const startEditing = useCallback(
    (visit: SaunaVisit) => {
      startEdit(visit);
      setForm(toFormState(visit));
    },
    [startEdit],
  );

  const handleDelete = useCallback(() => {
    if (!editingId) return;
    openDeleteConfirm();
  }, [editingId, openDeleteConfirm]);

  const confirmDelete = useCallback(() => {
    if (!editingId) return;
    const { success } = deleteVisit(editingId);
    if (!success) {
      showToast(STORAGE_ERROR_MSG, "error");
    } else {
      showToast("記録を削除しました。", "success");
    }
    closeDeleteConfirm();
    cancelEditing(true);
  }, [editingId, deleteVisit, showToast, closeDeleteConfirm, cancelEditing]);

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

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!selectedLocation || !form.name) return;

      let success = false;
      if (editingId) {
        const result = editVisit(editingId, selectedLocation, form);
        success = result.success;
      } else {
        const result = addVisit(selectedLocation, form);
        success = result.success;
      }

      if (!success) {
        showToast(STORAGE_ERROR_MSG, "error");
      }

      cancelEditing(true);
    },
    [selectedLocation, form, editingId, editVisit, addVisit, showToast, cancelEditing],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      setImageUploading(true);
      try {
        const base64 = await compressAndGetBase64(file);
        setForm((prev) => ({ ...prev, image: base64 }));
      } catch (error) {
        console.error(error);
        showToast("画像の圧縮に失敗しました。別の画像で試してください。", "error");
      } finally {
        setImageUploading(false);
      }
    },
    [showToast],
  );

  const handleRemoveImage = useCallback(() => {
    setForm((prev) => ({ ...prev, image: "" }));
  }, []);

  const isAdding = mode !== "list";
  const isMobilePickingLocation = isMobile && mode === "creating:pick";
  const isCreating = mode === "creating:pick" || mode === "creating:form";

  const editingVisit = editingId ? visits.find((v) => v.id === editingId) ?? null : null;
  const historyEntries = editingVisit ? getVisitHistoryEntries(editingVisit) : [];

  const handleDeleteHistoryEntry = useCallback(
    (index: number) => {
      if (!editingId) return;

      removeHistoryEntry(editingId, index);

      const newLatest = historyEntries.filter((_, i) => i !== index).at(-1);

      if (newLatest) {
        setForm((prev) => ({
          ...prev,
          date: newLatest.date,
          comment: newLatest.comment,
          rating: newLatest.rating ?? 0,
          image: newLatest.image ?? "",
        }));
      }
    },
    [editingId, removeHistoryEntry, historyEntries],
  );

  const value = useMemo(
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
      form,
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

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useSaunaEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useSaunaEditor must be used within an EditorProvider");
  }
  return context;
}
