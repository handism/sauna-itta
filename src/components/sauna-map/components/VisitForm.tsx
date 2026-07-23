import { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { VisitFormState, VisitHistoryEntry } from "../types";
import { VisitHistorySection } from "./VisitHistorySection";
import { VisitTagsField } from "./VisitTagsField";
import { VisitImageField } from "./VisitImageField";

interface VisitFormProps {
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
  imageUploading?: boolean;
}

function FormHeader({ editingId, selectedLocation }: { editingId: string | null; selectedLocation: { lat: number; lng: number } | null }) {
  return (
    <>
      <h2 className="panel-title mb-2">{editingId ? "サウナの編集" : "新規サウナ登録"}</h2>
      <p className="panel-subtitle">
        {editingId ? (
          "内容を更新します"
        ) : selectedLocation ? (
          <>
            場所が選択されました <CheckCircle2 size={14} />
          </>
        ) : (
          "地図上をクリックして場所を選択してください"
        )}
      </p>
    </>
  );
}

function StatusField({ status, onChange }: { status: "visited" | "wishlist"; onChange: (status: "visited" | "wishlist") => void }) {
  return (
    <div className="form-group">
      <label>ステータス</label>
      <div className="segmented">
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--visited ${
            status === "visited" ? "is-active" : ""
          }`}
          onClick={() => onChange("visited")}
        >
          行った
        </button>
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--wishlist ${
            status === "wishlist" ? "is-active" : ""
          }`}
          onClick={() => onChange("wishlist")}
        >
          行きたい
        </button>
      </div>
    </div>
  );
}

function RatingField({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  return (
    <div className="form-group">
      <label>満足度（1〜5）</label>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rating-star-btn"
            aria-label={`${star}つ星`}
          >
            <Star size={22} fill={rating >= star ? "currentColor" : "none"} className={rating >= star ? "rating-star--filled" : ""} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="clear-rating"
          aria-label="評価をクリア"
        >
          クリア
        </button>
      </div>
    </div>
  );
}

function NameField({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div className="form-group">
      <label>サウナ名</label>
      <input
        className="input"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 上野 SHIZUKU"
        required
      />
    </div>
  );
}

function AreaField({ area, onChange }: { area: string; onChange: (area: string) => void }) {
  return (
    <div className="form-group">
      <label>エリア（任意）</label>
      <input
        className="input"
        value={area}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 東京 / 北海道 / 関西 など"
      />
    </div>
  );
}

function DateField({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  };

  return (
    <div className="form-group">
      <div className="label-row-with-actions">
        <label>行った日</label>
        <div className="quick-date-actions">
          <button
            type="button"
            className="btn-quick-date"
            onClick={() => setQuickDate(0)}
          >
            今日
          </button>
          <button
            type="button"
            className="btn-quick-date"
            onClick={() => setQuickDate(1)}
          >
            昨日
          </button>
        </div>
      </div>
      <input
        type="date"
        className="input"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

export function VisitForm({
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
  imageUploading,
}: VisitFormProps) {
  const historyCount = editingId ? Math.max(1, historyEntries.length) : 0;

  return (
    <form className="sauna-form" onSubmit={onSubmit}>
      <FormHeader editingId={editingId} selectedLocation={selectedLocation} />

      <StatusField
        status={form.status}
        onChange={(status) => setForm((prev) => ({ ...prev, status }))}
      />

      {editingId && (
        <HistorySectionWrapper
          historyCount={historyCount}
          shouldAppend={form.appendHistory}
          historyEntries={historyEntries}
          onDeleteHistoryEntry={onDeleteHistoryEntry}
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

function HistorySectionWrapper({
  historyCount,
  shouldAppend,
  historyEntries,
  onDeleteHistoryEntry,
}: {
  historyCount: number;
  shouldAppend: boolean;
  historyEntries: VisitHistoryEntry[];
  onDeleteHistoryEntry?: (index: number) => void;
}) {
  return (
    <VisitHistorySection
      historyCount={historyCount}
      shouldAppend={shouldAppend}
      historyEntries={historyEntries}
      onDeleteEntry={onDeleteHistoryEntry}
    />
  );
}
