import { useState, useCallback, FormEvent } from "react";
import { SaunaVisit, VisitFormState, LatLng, VisitHistoryEntry } from "../types";
import {
  getDefaultForm,
  getTodayDate,
  toFormState,
  compressAndGetBase64,
} from "../utils";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export interface UseVisitFormOptions {
  editingId: string | null;
  selectedLocation: LatLng | null;
  historyEntries: VisitHistoryEntry[];
  addVisit: (location: LatLng, formState: VisitFormState) => { success: boolean };
  editVisit: (id: string, location: LatLng, formState: VisitFormState) => { success: boolean };
  deleteVisit: (id: string) => { success: boolean };
  removeHistoryEntry: (visitId: string, entryIndex: number) => void;
  startCreate: () => void;
  startEdit: (visit: SaunaVisit) => void;
  cancelEdit: (completed?: boolean) => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export function useVisitForm({
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
}: UseVisitFormOptions) {
  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const [imageUploading, setImageUploading] = useState(false);

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

  return {
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
  };
}
