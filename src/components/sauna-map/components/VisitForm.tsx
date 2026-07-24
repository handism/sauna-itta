import { Dispatch, FormEvent, SetStateAction } from "react";
import { Check, Save, X, Trash2 } from "lucide-react";
import { VisitFormState, VisitHistoryEntry } from "../types";
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
} from "./VisitFormFields";
import { useSaunaEditor } from "../context";
import { GeocodingResult } from "../utils/geocoding";

export interface VisitFormViewProps {
  form: VisitFormState;
  setForm: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation: { lat: number; lng: number } | null;
  editingId: string | null;
  historyEntries: VisitHistoryEntry[];
  onSubmit: (e: FormEvent) => void;
  onImageFile: (file: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onDeleteHistoryEntry?: (index: number) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  imageUploading: boolean;
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
}: VisitFormViewProps) {
  const historyCount = editingId ? Math.max(1, historyEntries.length) : 0;

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
        <div className="form-group form-group--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.appendHistory}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, appendHistory: e.target.checked }))
              }
            />
            新しい訪問記録として追加する（訪問回数+1）
          </label>
          <p className="form-hint">
            チェックを入れると、今回の内容が新しい訪問履歴として保存されます。チェックを外すと前回の記録を修正します。
          </p>
        </div>
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

      <div className="form-group">
        <label>{form.status === "wishlist" ? "メモ" : "感想・メモ"}</label>
        <textarea
          className="input textarea"
          rows={3}
          value={form.comment}
          onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
          placeholder={
            form.status === "wishlist"
              ? "行きたい理由や気になっているポイント..."
              : "ととのい具合、水風呂の温度、外気浴の雰囲気など..."
          }
        />
      </div>

      {form.status === "visited" && (
        <VisitImageField
          image={form.image}
          onFile={onImageFile}
          onRemove={onRemoveImage}
          uploading={imageUploading}
        />
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!selectedLocation || !form.name || imageUploading}
        >
          {editingId ? <Check size={18} /> : <Save size={18} />}
          <span>{editingId ? "更新する" : "保存する"}</span>
        </button>
        <div className={`form-actions-secondary ${!editingId ? "form-actions-secondary--single" : ""}`}>
          {editingId && (
            <button
              type="button"
              className="btn btn-danger btn-delete"
              onClick={onDelete}
            >
              <Trash2 size={16} />
              <span>削除</span>
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            <X size={16} />
            <span>キャンセル</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export function VisitForm(props: Partial<VisitFormViewProps>) {
  const editor = useSaunaEditor();

  const editingId = props.editingId ?? editor.editingId;
  const onDeleteHistoryEntry =
    props.onDeleteHistoryEntry ?? (editingId ? editor.handleDeleteHistoryEntry : undefined);

  return (
    <VisitFormView
      form={props.form ?? editor.form}
      setForm={props.setForm ?? editor.setForm}
      selectedLocation={props.selectedLocation ?? editor.selectedLocation}
      editingId={editingId}
      historyEntries={props.historyEntries ?? editor.historyEntries}
      onSubmit={props.onSubmit ?? editor.handleSubmit}
      onImageFile={props.onImageFile ?? editor.handleImageFile}
      onRemoveImage={props.onRemoveImage ?? editor.handleRemoveImage}
      onDelete={props.onDelete ?? editor.handleDelete}
      onCancel={props.onCancel ?? (() => editor.cancelEditing())}
      onDeleteHistoryEntry={onDeleteHistoryEntry}
      onLocationSelect={props.onLocationSelect ?? editor.handleLocationSelect}
      imageUploading={props.imageUploading ?? editor.imageUploading}
    />
  );
}
