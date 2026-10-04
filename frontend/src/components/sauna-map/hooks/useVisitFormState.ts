import { useState, useCallback, useEffect, useRef } from "react";
import { SaunaVisit, StartEditingOptions, VisitFormState } from "../types";
import type { ShowToast } from "../components/common/Toast";
import {
  getDefaultForm,
  getTodayDate,
  toFormState,
  toRevisitFormState,
  compressAndGetBase64,
  isAllowedImageFile,
} from "../utils";

export interface UseVisitFormStateOptions {
  startCreate: () => void;
  startEdit: (visit: SaunaVisit) => void;
  cancelEdit: (completed?: boolean) => void;
  showToast: ShowToast;
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
    (visit: SaunaVisit, options: StartEditingOptions = {}) => {
      startEdit(visit);
      setForm(options.revisit ? toRevisitFormState(visit) : toFormState(visit));
    },
    [startEdit],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      // accept 属性はドラッグ&ドロップに効かないため、取り込み側でも形式を確かめる。
      // ここを通さないと、apiモードでは保存時まで非対応形式に気づけない。
      if (!isAllowedImageFile(file)) {
        showToast("対応していない画像形式です。JPEG / PNG / WebP / GIF を選んでください。", "error");
        return;
      }

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
