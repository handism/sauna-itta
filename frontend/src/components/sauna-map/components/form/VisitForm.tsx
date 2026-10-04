import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef } from "react";
import { VisitFormState, VisitHistoryEntry } from "../../types";
import { VisitHistorySection } from "./VisitHistorySection";
import { VisitTagsField } from "./VisitTagsField";
import { VisitImageField } from "./VisitImageField";
import {
  FormSection,
  FormHeader,
  LocationSearchField,
  StatusField,
  RatingField,
  NameField,
  AreaField,
  DateField,
  HistoryAppendField,
  CommentField,
  FormActions,
} from "./VisitFormFields";
import {
  useSaunaEditorState,
  useSaunaEditorActions,
  useSaunaEditorForm,
  useSaunaMapActions,
  useVisitsData,
} from "../../context";
import { getTagSuggestions, PRESET_TAGS } from "../../utils/visitStats";
import { GeocodingResult } from "../../utils/geocoding";
import { fillFormFromPlace, getSubmitBlockedReason } from "../../utils/form";

export interface VisitFormViewProps {
  form: VisitFormState;
  setForm: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation: { lat: number; lng: number } | null;
  editingId: string | null;
  historyEntries: VisitHistoryEntry[];
  onSubmit: (e: FormEvent) => void | Promise<void>;
  onImageFile: (file: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onDeleteHistoryEntry?: (index: number) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  imageUploading: boolean;
  saving?: boolean;
  /** タグ欄の候補。省略時はプリセットだけを出す */
  suggestedTags?: readonly string[];
}

export function VisitFormView({
  form,
  setForm,
  selectedLocation,
  editingId,
  historyEntries,
  onSubmit,
  onImageFile,
  onRemoveImage,
  onDelete,
  onCancel,
  onDeleteHistoryEntry,
  onLocationSelect,
  imageUploading,
  saving = false,
  suggestedTags = PRESET_TAGS,
}: VisitFormViewProps) {
  const historyCount = editingId ? Math.max(1, historyEntries.length) : 0;
  const formRef = useRef<HTMLFormElement>(null);

  /*
   * 一覧とフォームは同じスクロール領域（.sidebar-content / .bottom-sheet-content）を
   * 共有するため、一覧をスクロールした位置のままフォームが途中から表示される。
   * 開いたとき・編集対象が変わったときは先頭（見出しと場所の選択）へ戻す。
   */
  useEffect(() => {
    const scrollContainer = formRef.current?.parentElement;
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [editingId]);

  // 保存できない理由を明示し、無反応なボタンに見えないようにする
  const submitBlockedReason = saving
    ? "サーバーへ保存しています。"
    : getSubmitBlockedReason(selectedLocation, form.name, imageUploading);

  const handleGeocodingSelect = (result: GeocodingResult) => {
    if (onLocationSelect) {
      onLocationSelect(result.lat, result.lng);
    }
    setForm((prev) => fillFormFromPlace(prev, result));
  };

  return (
    <form className="sauna-form" onSubmit={onSubmit} ref={formRef}>
      <FormHeader editingId={editingId} selectedLocation={selectedLocation} />

      {/*
        項目は「どこの」「どんな記録か」「タグ」の順にまとめる。必須のサウナ名を
        場所の直後に置き、ステータスで出し分ける項目は「記録の内容」の中に閉じ込める。
      */}
      <FormSection id="visit-form-place" title="場所">
        <LocationSearchField onSelectLocation={handleGeocodingSelect} />

        <NameField
          name={form.name}
          onChange={(name) => setForm((prev) => ({ ...prev, name }))}
        />

        <AreaField
          area={form.area}
          onChange={(area) => setForm((prev) => ({ ...prev, area }))}
        />
      </FormSection>

      <FormSection id="visit-form-record" title="記録の内容">
        <StatusField
          status={form.status}
          onChange={(status) => setForm((prev) => ({ ...prev, status }))}
        />

        {editingId && form.status === "visited" && (
          <HistoryAppendField
            appendHistory={form.appendHistory}
            onChange={(appendHistory) =>
              setForm((prev) => ({ ...prev, appendHistory }))
            }
          />
        )}

        {form.status === "visited" && (
          <>
            <DateField
              date={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
            />

            <RatingField
              rating={form.rating}
              onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
            />
          </>
        )}

        <CommentField
          status={form.status}
          comment={form.comment}
          onChange={(comment) => setForm((prev) => ({ ...prev, comment }))}
        />

        {form.status === "visited" && (
          <VisitImageField
            image={form.image}
            onFile={onImageFile}
            onRemove={onRemoveImage}
            uploading={imageUploading}
          />
        )}
      </FormSection>

      <FormSection id="visit-form-tags" title="タグ">
        <VisitTagsField
          tagsText={form.tagsText}
          onChange={(tagsText) => setForm((prev) => ({ ...prev, tagsText }))}
          suggestedTags={suggestedTags}
        />
      </FormSection>

      {/* 過去の訪問は見返す・消すときだけ使うので、入力欄の後ろに折りたたんで置く */}
      {editingId && (
        <FormSection id="visit-form-history" title="これまでの訪問">
          <VisitHistorySection
            historyCount={historyCount}
            shouldAppend={form.appendHistory}
            historyEntries={historyEntries}
            onDeleteEntry={onDeleteHistoryEntry}
          />
        </FormSection>
      )}

      <FormActions
        saving={saving}
        editingId={editingId}
        submitBlockedReason={submitBlockedReason}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    </form>
  );
}

/** Context から値を集めて View へ渡すだけのコンテナ（テストは VisitFormView を描画する） */
export function VisitForm() {
  const { selectedLocation, editingId, historyEntries } = useSaunaEditorState();
  const {
    handleSubmit,
    handleImageFile,
    handleRemoveImage,
    handleDelete,
    handleDeleteHistoryEntry,
    handleLocationSelect,
  } = useSaunaEditorActions();
  // 入力値は専用 Context から。ここだけが 1 文字ごとの更新を購読する
  const { form, setForm, imageUploading, saving } = useSaunaEditorForm();
  /*
   * 保存・キャンセルはモバイルのシート位置と連動するため、EditorContext の
   * cancelEditing を直接呼ばず MapStateContext 経由にする（シート位置の知識を
   * 画面側へ漏らさないこと）。
   */
  const { handleCancelEditing, handleEditingFinished } = useSaunaMapActions();
  // タグ候補のためだけに記録本体を読む。入力値（EditorFormContext）とは別の Context なので、
  // 記録が変わったとき以外は再レンダリングされない
  const { visits } = useVisitsData();
  const suggestedTags = useMemo(() => getTagSuggestions(visits), [visits]);

  return (
    <VisitFormView
      form={form}
      setForm={setForm}
      selectedLocation={selectedLocation}
      editingId={editingId}
      historyEntries={historyEntries}
      onSubmit={(e) => handleSubmit(e, handleEditingFinished)}
      onImageFile={handleImageFile}
      onRemoveImage={handleRemoveImage}
      onDelete={handleDelete}
      onCancel={() => handleCancelEditing()}
      onDeleteHistoryEntry={editingId ? handleDeleteHistoryEntry : undefined}
      onLocationSelect={handleLocationSelect}
      imageUploading={imageUploading}
      saving={saving}
      suggestedTags={suggestedTags}
    />
  );
}
