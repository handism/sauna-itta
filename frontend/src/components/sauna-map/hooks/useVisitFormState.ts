import { useState, useCallback, useEffect, useRef } from "react";
import { SaunaVisit, VisitFormState } from "../types";
import { getDefaultForm, getTodayDate, toFormState, compressAndGetBase64 } from "../utils";

export interface UseVisitFormStateOptions {
  startCreate: () => void;
  startEdit: (visit: SaunaVisit) => void;
  cancelEdit: (completed?: boolean) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export function useVisitFormState({
  startCreate,
  startEdit,
  cancelEdit,
  showToast,
}: UseVisitFormStateOptions) {
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

  return {
    form,
    setForm,
    formRef,
    imageUploading,
    startNewVisit,
    startEditing,
    cancelEditing,
    handleImageFile,
    handleRemoveImage,
  };
}
