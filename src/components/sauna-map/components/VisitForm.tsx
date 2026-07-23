import { Dispatch, DragEvent, FormEvent, SetStateAction, useRef, useState } from "react";
import { CheckCircle2, Star, Check, ImagePlus, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { VisitFormState, VisitHistoryEntry } from "../types";
import { sanitizeImageUrl } from "../utils";
import { ImageLightbox } from "./common";

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

function HistorySection({
  historyCount,
  shouldAppend,
  historyEntries,
  onDeleteEntry,
}: {
  historyCount: number;
  shouldAppend: boolean;
  historyEntries: VisitHistoryEntry[];
  onDeleteEntry?: (index: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const recentEntries = historyEntries
    .map((entry, index) => ({ entry, index }))
    .reverse()
    .slice(0, 5);

  return (
    <div className="form-group">
      <button
        type="button"
        className="history-section-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="history-section-toggle-label">
          訪問履歴（{historyCount}件）
          {shouldAppend && <span className="history-badge">保存で+1</span>}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isExpanded && (
        <>
          {historyCount > 0 && (
            <ul className="history-list">
              {recentEntries.map(({ entry, index }) => (
                <li key={`${entry.date}-${index}`} className="history-item">
                  <div className="history-item-header">
                    <span>{entry.date}</span>
                    <span className="history-rating">
                      {entry.rating ? (
                        <>
                          <Star size={11} fill="currentColor" className="rating-star--filled" /> {entry.rating}
                        </>
                      ) : (
                        "評価なし"
                      )}
                    </span>
                    {historyCount > 1 && onDeleteEntry && (
                      <button
                        type="button"
                        className="history-delete-btn"
                        onClick={() => onDeleteEntry(index)}
                        aria-label="この履歴を削除"
                        title="この履歴を削除"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
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
        </>
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
              {isSelected ? <Check size={12} /> : "+"} {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageField({
  image,
  onFile,
  onRemove,
  uploading,
}: {
  image: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const previewUrl = sanitizeImageUrl(image);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="form-group">
      <label>写真を追加</label>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden-file-input"
        accept="image/*"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={uploading}
      />

      {previewUrl ? (
        <div className="image-dropzone image-dropzone--filled">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            className="sauna-img-preview"
            alt="アップロードした写真のプレビュー"
            onClick={() => setLightboxOpen(true)}
          />
          <div className="image-dropzone-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              変更
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm image-remove-btn"
              onClick={onRemove}
              disabled={uploading}
            >
              <X size={13} /> 削除
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${isDragOver ? "is-dragover" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploading) inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <ImagePlus size={22} />
          <span>クリックまたはドラッグ&ドロップで写真を追加</span>
        </div>
      )}

      {uploading && (
        <p className="form-hint form-hint--loading">
          <Loader2 size={13} className="spin-icon" /> 画像を圧縮しています…
        </p>
      )}

      <ImageLightbox
        src={lightboxOpen ? previewUrl ?? null : null}
        onClose={() => setLightboxOpen(false)}
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
  onImageFile,
  onRemoveImage,
  onDelete,
  onCancel,
  onDeleteHistoryEntry,
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
      <ImageField image={form.image} onFile={onImageFile} onRemove={onRemoveImage} uploading={imageUploading} />
      <DateField date={form.date} onChange={(date) => setForm({ ...form, date })} />

      {editingId && (
        <HistorySection
          historyCount={historyCount}
          shouldAppend={shouldAppend}
          historyEntries={historyEntries}
          onDeleteEntry={onDeleteHistoryEntry}
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
