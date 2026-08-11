import { useCallback, FormEvent, MutableRefObject } from "react";
import { VisitFormState, LatLng, VisitHistoryEntry } from "../types";
import { validateVisitForm } from "../utils";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export interface UseVisitCrudOptions {
  editingId: string | null;
  selectedLocation: LatLng | null;
  historyEntries: VisitHistoryEntry[];
  formRef: MutableRefObject<VisitFormState>;
  setForm: React.Dispatch<React.SetStateAction<VisitFormState>>;
  addVisit: (location: LatLng, formState: VisitFormState) => Promise<{ success: boolean }>;
  editVisit: (id: string, location: LatLng, formState: VisitFormState) => Promise<{ success: boolean }>;
  deleteVisit: (id: string) => Promise<{ success: boolean }>;
  removeHistoryEntry: (visitId: string, entryIndex: number) => Promise<{ success: boolean }>;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  cancelEditing: (completed?: boolean) => void;
}

export function useVisitCrud({
  editingId,
  selectedLocation,
  historyEntries,
  formRef,
  setForm,
  addVisit,
  editVisit,
  deleteVisit,
  removeHistoryEntry,
  openDeleteConfirm,
  closeDeleteConfirm,
  showToast,
  cancelEditing,
}: UseVisitCrudOptions) {
  const handleDelete = useCallback(() => {
    if (!editingId) return;
    openDeleteConfirm();
  }, [editingId, openDeleteConfirm]);

  const confirmDelete = useCallback(async () => {
    if (!editingId) return;
    const { success } = await deleteVisit(editingId);
    if (!success) {
      showToast(STORAGE_ERROR_MSG, "error");
    } else {
      showToast("記録を削除しました。", "success");
    }
    closeDeleteConfirm();
    cancelEditing(true);
  }, [editingId, deleteVisit, showToast, closeDeleteConfirm, cancelEditing]);

  /**
   * @param onCompleted 保存が成功して編集を閉じた後に呼ばれる。モバイルのシート位置を
   *   戻すために使う（EditorProvider は MapStateProvider の親なのでシート位置を
   *   直接触れない。呼び出し側が MapStateContext の関数を渡す）。
   */
  const handleSubmit = useCallback(
    async (e: FormEvent, onCompleted?: () => void) => {
      e.preventDefault();
      if (!selectedLocation) {
        showToast("サウナの場所が選択されていません。", "error");
        return;
      }

      const currentForm = formRef.current;
      const validation = validateVisitForm(currentForm);
      if (!validation.success) {
        showToast(validation.errors[0] ?? "入力内容に不備があります。", "error");
        return;
      }

      let success = false;
      if (editingId) {
        const result = await editVisit(editingId, selectedLocation, currentForm);
        success = result.success;
      } else {
        const result = await addVisit(selectedLocation, currentForm);
        success = result.success;
      }

      if (!success) {
        showToast(STORAGE_ERROR_MSG, "error");
        return;
      }

      cancelEditing(true);
      onCompleted?.();
    },
    [selectedLocation, editingId, editVisit, addVisit, showToast, cancelEditing, formRef],
  );

  const handleDeleteHistoryEntry = useCallback(
    async (index: number) => {
      if (!editingId) return;

      const { success } = await removeHistoryEntry(editingId, index);
      if (!success) return;

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
    [editingId, removeHistoryEntry, historyEntries, setForm],
  );

  return {
    handleDelete,
    confirmDelete,
    handleSubmit,
    handleDeleteHistoryEntry,
  };
}
