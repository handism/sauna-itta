import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import { SaunaVisit, VisitFormState, LatLng, VisitHistoryEntry } from "../types";
import {
  getDefaultForm,
  getTodayDate,
  toFormState,
  compressAndGetBase64,
  validateVisitForm,
} from "../utils";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

export interface UseVisitFormOptions {
  editingId: string | null;
  selectedLocation: LatLng | null;
  historyEntries: VisitHistoryEntry[];
  addVisit: (location: LatLng, formState: VisitFormState) => Promise<{ success: boolean }>;
  editVisit: (id: string, location: LatLng, formState: VisitFormState) => Promise<{ success: boolean }>;
  deleteVisit: (id: string) => Promise<{ success: boolean }>;
  removeHistoryEntry: (visitId: string, entryIndex: number) => Promise<{ success: boolean }>;
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

  /**
   * 送信時点の入力値を読むための ref。
   *
   * handleSubmit の依存配列に form を入れると、1 文字入力するたびに関数の参照が変わり、
   * EditorActions Context 経由で SaunaMapContent / DesktopSidebar / VisitList まで
   * 再レンダリング対象になる。送信はユーザー操作起点なので、その時点では effect が
   * 反映済みであり、ref から読んでも常に画面と同じ値になる。
   */
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

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
    [selectedLocation, editingId, editVisit, addVisit, showToast, cancelEditing],
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
