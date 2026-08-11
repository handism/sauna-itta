import { Dispatch, FormEvent, SetStateAction } from "react";
import { VisitFormState, VisitHistoryEntry } from "../../types";
import { VisitHistorySection } from "./VisitHistorySection";
import { VisitTagsField } from "./VisitTagsField";
import { VisitImageField } from "./VisitImageField";
import {
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
import { useSaunaEditor, useSaunaEditorForm, useSaunaMapActions } from "../../context";
import { GeocodingResult } from "../../utils/geocoding";
import { getSubmitBlockedReason } from "../../utils/form";

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
}: VisitFormViewProps) {
  const historyCount = editingId ? Math.max(1, historyEntries.length) : 0;

  // 保存できない理由を明示し、無反応なボタンに見えないようにする
  const submitBlockedReason = saving
    ? "サーバーへ保存しています。"
    : getSubmitBlockedReason(selectedLocation, form.name, imageUploading);

  const handleGeocodingSelect = (result: GeocodingResult) => {
    if (onLocationSelect) {
      onLocationSelect(result.lat, result.lng);
    }
    setForm((prev) => ({
      ...prev,
      name: prev.name ? prev.name : result.name,
      area: prev.area ? prev.area : result.addressText,
    }));
  };

  return (
    <form className="sauna-form" onSubmit={onSubmit}>
      <FormHeader editingId={editingId} selectedLocation={selectedLocation} />

      <LocationSearchField onSelectLocation={handleGeocodingSelect} />

      <StatusField
        status={form.status}
        onChange={(status) => setForm((prev) => ({ ...prev, status }))}
      />

      {editingId && (
        <VisitHistorySection
          historyCount={historyCount}
          shouldAppend={form.appendHistory}
          historyEntries={historyEntries}
          onDeleteEntry={onDeleteHistoryEntry}
        />
      )}

      {editingId && form.status === "visited" && (
        <HistoryAppendField
          appendHistory={form.appendHistory}
          onChange={(appendHistory) =>
            setForm((prev) => ({ ...prev, appendHistory }))
          }
        />
      )}

      <NameField
        name={form.name}
        onChange={(name) => setForm((prev) => ({ ...prev, name }))}
      />

      <AreaField
        area={form.area}
        onChange={(area) => setForm((prev) => ({ ...prev, area }))}
      />

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

      <VisitTagsField
        tagsText={form.tagsText}
        onChange={(tagsText) => setForm((prev) => ({ ...prev, tagsText }))}
      />

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
  const editor = useSaunaEditor();
  // 入力値は専用 Context から。ここだけが 1 文字ごとの更新を購読する
  const { form, setForm, imageUploading, saving } = useSaunaEditorForm();
  /*
   * 保存・キャンセルはモバイルのシート位置と連動するため、EditorContext の
   * cancelEditing を直接呼ばず MapStateContext 経由にする（シート位置の知識を
   * 画面側へ漏らさないこと）。
   */
  const { handleCancelEditing, handleEditingFinished } = useSaunaMapActions();

  return (
    <VisitFormView
      form={form}
      setForm={setForm}
      selectedLocation={editor.selectedLocation}
      editingId={editor.editingId}
      historyEntries={editor.historyEntries}
      onSubmit={(e) => editor.handleSubmit(e, handleEditingFinished)}
      onImageFile={editor.handleImageFile}
      onRemoveImage={editor.handleRemoveImage}
      onDelete={editor.handleDelete}
      onCancel={() => handleCancelEditing()}
      onDeleteHistoryEntry={editor.editingId ? editor.handleDeleteHistoryEntry : undefined}
      onLocationSelect={editor.handleLocationSelect}
      imageUploading={imageUploading}
      saving={saving}
    />
  );
}
