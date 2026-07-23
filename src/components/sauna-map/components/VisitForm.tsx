import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { VisitFormState, VisitHistoryEntry } from "../types";
import { sanitizeImageUrl } from "../utils";

interface VisitFormProps {
  form: VisitFormState;
  setForm: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation: { lat: number; lng: number } | null;
  editingId: string | null;
  historyEntries: VisitHistoryEntry[];
  onSubmit: (e: FormEvent) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onCancel: () => void;
  onDeleteLastHistory?: () => void;
  imageUploading?: boolean;
}

function FormHeader({ editingId, selectedLocation }: { editingId: string | null; selectedLocation: { lat: number; lng: number } | null }) {
  return (
    <>
      <h2 className="panel-title mb-2">{editingId ? "サウナの編集" : "新規サウナ登録"}</h2>
      <p className="panel-subtitle">
        {editingId
          ? "内容を更新します"
          : selectedLocation
            ? "場所が選択されました ✅"
            : "地図上をクリックして場所を選択してください"}
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
      <label>満足度（★1〜5）</label>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rating-star-btn"
            aria-label={`${star}つ星`}
          >
            {rating >= star ? "★" : "☆"}
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

function HistorySection({
  historyCount,
  shouldAppend,
  historyEntries,
  onDeleteLastHistory,
}: {
  historyCount: number;
  shouldAppend: boolean;
  historyEntries: VisitHistoryEntry[];
  onDeleteLastHistory?: () => void;
}) {
  return (
    <div className="form-group">
      <label>訪問履歴</label>
      <div className="history-summary">
        <span>現在の履歴: {historyCount}件</span>
        {shouldAppend && <span className="history-badge">保存で+1</span>}
      </div>
      {historyCount > 0 && (
        <ul className="history-list">
          {historyEntries
            .slice()
            .reverse()
            .slice(0, 5)
            .map((entry, index) => (
              <li key={`${entry.date}-${index}`} className="history-item">
                <span>{entry.date}</span>
                <span className="history-rating">
                  {entry.rating ? `★${entry.rating}` : "評価なし"}
                </span>
                <span className="history-comment">
                  {entry.comment ? entry.comment : "コメントなし"}
                </span>
              </li>
            ))}
        </ul>
      )}
      {historyCount > 5 && (
        <div className="history-more">最新5件のみ表示中</div>
      )}
      {historyCount > 1 && onDeleteLastHistory && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onDeleteLastHistory}
        >
          最後の履歴を削除
        </button>
      )}
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

const PRESET_TAGS = [
  "外気浴最高",
  "水風呂キンキン",
  "セルフロウリュ",
  "アウフグース",
  "サウナ飯",
  "ソロ向き",
];

function TagsField({ tagsText, onChange }: { tagsText: string; onChange: (tagsText: string) => void }) {
  const currentTags = tagsText
    ? tagsText.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const toggleTag = (preset: string) => {
    const exists = currentTags.includes(preset);
    const updated = exists
      ? currentTags.filter((t) => t !== preset)
      : [...currentTags, preset];
    onChange(updated.join(", "));
  };

  return (
    <div className="form-group">
      <label>タグ（カンマ区切り）</label>
      <input
        className="input"
        value={tagsText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 外気浴最高, 水風呂キンキン, ソロ向き"
      />
      <div className="preset-tags">
        {PRESET_TAGS.map((tag) => {
          const isSelected = currentTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`preset-tag-chip ${isSelected ? "is-selected" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {isSelected ? `✓ ${tag}` : `+ ${tag}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageField({
  image,
  onChange,
  uploading,
}: {
  image: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
}) {
  return (
    <div className="form-group">
      <label>写真を追加</label>
      <input
        type="file"
        className="input input-file"
        accept="image/*"
        onChange={onChange}
        disabled={uploading}
      />
      {uploading && <p className="form-hint">画像を圧縮しています…</p>}
      {sanitizeImageUrl(image) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sanitizeImageUrl(image)!}
          className="sauna-img-preview"
          alt="アップロードした写真のプレビュー"
        />
      )}
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

function CommentField({ comment, onChange }: { comment: string; onChange: (comment: string) => void }) {
  return (
    <div className="form-group">
      <label>感想・メモ</label>
      <textarea
        className="input textarea"
        value={comment}
        onChange={(e) => onChange(e.target.value)}
        placeholder="水風呂の温度、外気浴の雰囲気など..."
      />
    </div>
  );
}

function AppendHistoryField({ appendHistory, onChange }: { appendHistory: boolean; onChange: (appendHistory: boolean) => void }) {
  return (
    <div className="form-group">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={appendHistory}
          onChange={(e) => onChange(e.target.checked)}
        />
        この内容を訪問履歴に追加する
      </label>
      <p className="form-hint">
        オフにすると直近の記録を上書きします。
      </p>
    </div>
  );
}

function FormActions({
  hasLocation,
  isEditing,
  onDelete,
  onCancel,
}: {
  hasLocation: boolean;
  isEditing: boolean;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="cta-group">
      <button type="submit" className="btn btn-primary" disabled={!hasLocation}>
        保存
      </button>
      {isEditing && (
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          削除
        </button>
      )}
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        キャンセル
      </button>
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
  onImageChange,
  onDelete,
  onCancel,
  onDeleteLastHistory,
  imageUploading,
}: VisitFormProps) {
  const historyCount = historyEntries.length;
  const shouldAppend = Boolean(editingId && form.appendHistory);

  return (
    <form onSubmit={onSubmit}>
      <FormHeader editingId={editingId} selectedLocation={selectedLocation} />

      <NameField name={form.name} onChange={(name) => setForm({ ...form, name })} />
      <AreaField area={form.area} onChange={(area) => setForm({ ...form, area })} />
      <StatusField status={form.status} onChange={(status) => setForm({ ...form, status })} />
      <RatingField rating={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
      <TagsField tagsText={form.tagsText} onChange={(tagsText) => setForm({ ...form, tagsText })} />
      <ImageField image={form.image} onChange={onImageChange} uploading={imageUploading} />
      <DateField date={form.date} onChange={(date) => setForm({ ...form, date })} />

      {editingId && (
        <HistorySection
          historyCount={historyCount}
          shouldAppend={shouldAppend}
          historyEntries={historyEntries}
          onDeleteLastHistory={onDeleteLastHistory}
        />
      )}

      <CommentField comment={form.comment} onChange={(comment) => setForm({ ...form, comment })} />

      {editingId && (
        <AppendHistoryField
          appendHistory={form.appendHistory}
          onChange={(appendHistory) => setForm({ ...form, appendHistory })}
        />
      )}

      <FormActions
        hasLocation={Boolean(selectedLocation)}
        isEditing={Boolean(editingId)}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    </form>
  );
}
