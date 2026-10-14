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

  /**
   * 写真の圧縮の世代。圧縮は数秒かかることがあり、その間に別の記録の編集へ切り替える・
   * 編集を閉じる・写真を選び直すと、終わった圧縮の結果がそのとき開いているフォームへ入り、
   * 別の記録の写真として保存されてしまう。フォームを差し替える操作と新しい圧縮の開始で進め、
   * 開始時と同じ世代のときだけ結果を反映する。
   */
  const imageRequest = useRef(0);

  /** フォームを別の内容へ差し替える。実行中の圧縮の結果は捨てる */
  const replaceForm = useCallback((next: VisitFormState) => {
    imageRequest.current += 1;
    setImageUploading(false);
    setForm(next);
  }, []);

  const cancelEditing = useCallback(
    (completed = false) => {
      cancelEdit(completed);
      replaceForm(getDefaultForm());
    },
    [cancelEdit, replaceForm],
  );

  const startNewVisit = useCallback(() => {
    startCreate();
    replaceForm(getDefaultForm(getTodayDate()));
  }, [startCreate, replaceForm]);

  const startEditing = useCallback(
    (visit: SaunaVisit, options: StartEditingOptions = {}) => {
      startEdit(visit);
      replaceForm(options.revisit ? toRevisitFormState(visit) : toFormState(visit));
    },
    [startEdit, replaceForm],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      // accept 属性はドラッグ&ドロップに効かないため、取り込み側でも形式を確かめる。
      // ここを通さないと、apiモードでは保存時まで非対応形式に気づけない。
      if (!isAllowedImageFile(file)) {
        showToast("対応していない画像形式です。JPEG / PNG / WebP / GIF を選んでください。", "error");
        return;
      }

      const request = ++imageRequest.current;
      const isCurrent = () => request === imageRequest.current;
      setImageUploading(true);
      try {
        const base64 = await compressAndGetBase64(file);
        if (isCurrent()) setForm((prev) => ({ ...prev, image: base64 }));
      } catch (error) {
        console.error(error);
        if (isCurrent()) showToast("画像の圧縮に失敗しました。別の画像で試してください。", "error");
      } finally {
        if (isCurrent()) setImageUploading(false);
      }
    },
    [showToast],
  );

  const handleRemoveImage = useCallback(() => {
    // 圧縮中に外したとき、終わった圧縮の結果で写真が戻らないようにする
    imageRequest.current += 1;
    setImageUploading(false);
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
