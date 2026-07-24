import { Dispatch, FormEvent, SetStateAction } from "react";
import { VisitFormState, VisitHistoryEntry } from "../types";
import { VisitHistorySection } from "./VisitHistorySection";
import { VisitTagsField } from "./VisitTagsField";
import { VisitImageField } from "./VisitImageField";
import {
  FormHeader,
  StatusField,
  RatingField,
  NameField,
  AreaField,
  DateField,
} from "./VisitFormFields";
import { useSaunaMap } from "../context/SaunaMapContext";

interface VisitFormProps {
  form?: VisitFormState;
  setForm?: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation?: { lat: number; lng: number } | null;
  editingId?: string | null;
  historyEntries?: VisitHistoryEntry[];
  onSubmit?: (e: FormEvent) => void;
  onImageFile?: (file: File) => void;
  onRemoveImage?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onDeleteHistoryEntry?: (index: number) => void;
  imageUploading?: boolean;
}

export function VisitForm(props: VisitFormProps) {
  const context = useSaunaMap();

  const form = props.form ?? context.form;
  const setForm = props.setForm ?? context.setForm;
  const selectedLocation = props.selectedLocation ?? context.selectedLocation;
  const editingId = props.editingId ?? context.editingId;
  const historyEntries = props.historyEntries ?? context.historyEntries;
  const onSubmit = props.onSubmit ?? context.handleSubmit;
  const onImageFile = props.onImageFile ?? context.handleImageFile;
  const onRemoveImage = props.onRemoveImage ?? context.handleRemoveImage;
  const onDelete = props.onDelete ?? context.handleDelete;
  const onCancel = props.onCancel ?? (() => context.cancelEditing());
  const onDeleteHistoryEntry = props.onDeleteHistoryEntry ?? (editingId ? context.handleDeleteHistoryEntry : undefined);
  const imageUploading = props.imageUploading ?? context.imageUploading;

  const historyCount = editingId ? Math.max(1, historyEntries.length) : 0;

  return (
    <form className="sauna-form" onSubmit={onSubmit}>
      <FormHeader editingId={editingId} selectedLocation={selectedLocation} />

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
          {editingId ? "更新する" : "保存する"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          キャンセル
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-danger btn-delete"
            onClick={onDelete}
          >
            削除
          </button>
        )}
      </div>
    </form>
  );
}
