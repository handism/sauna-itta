import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { VisitFormState } from "../types";

interface VisitFormProps {
  form: VisitFormState;
  setForm: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation: { lat: number; lng: number } | null;
  editingId: string | null;
  onSubmit: (e: FormEvent) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function VisitForm({
  form,
  setForm,
  selectedLocation,
  editingId,
  onSubmit,
  onImageChange,
  onDelete,
  onCancel,
}: VisitFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <h2 className="panel-title mb-2">{editingId ? "サウナの編集" : "新規サウナ登録"}</h2>
      <p className="panel-subtitle">
        {editingId
          ? "内容を更新します"
          : selectedLocation
            ? "場所が選択されました ✅"
            : "地図上をクリックして場所を選択してください"}
      </p>

      <div className="form-group">
        <label>サウナ名</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="例: 上野 SHIZUKU"
          required
        />
      </div>

      <div className="form-group">
        <label>エリア（任意）</label>
        <input
          className="input"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
          placeholder="例: 東京 / 北海道 / 関西 など"
        />
      </div>

      <div className="form-group">
        <label>ステータス</label>
        <div className="segmented">
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: form.status === "visited" ? "var(--primary)" : "var(--glass)",
              color: form.status === "visited" ? "white" : "var(--foreground)",
            }}
            onClick={() => setForm({ ...form, status: "visited" })}
          >
            行った
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: form.status === "wishlist" ? "var(--accent)" : "var(--glass)",
              color: "var(--foreground)",
            }}
            onClick={() => setForm({ ...form, status: "wishlist" })}
          >
            行きたい
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>満足度（★1〜5）</label>
        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setForm({ ...form, rating: star })}
              className="rating-star-btn"
              aria-label={`${star} star`}
            >
              {form.rating >= star ? "★" : "☆"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, rating: 0 })}
            className="clear-rating"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>タグ（カンマ区切り）</label>
        <input
          className="input"
          value={form.tagsText}
          onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
          placeholder="例: 外気浴最高, 水風呂キンキン, ソロ向き"
        />
      </div>

      <div className="form-group">
        <label>写真を追加</label>
        <input
          type="file"
          className="input"
          accept="image/*"
          onChange={onImageChange}
          style={{ fontSize: "0.84rem", padding: "0.55rem" }}
        />
        {form.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.image} className="sauna-img-preview" alt="Preview" />
        )}
      </div>

      <div className="form-group">
        <label>行った日</label>
        <input
          type="date"
          className="input"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>訪問回数</label>
        <input
          type="number"
          min={1}
          max={999}
          className="input"
          value={form.visitCount}
          onChange={(e) =>
            setForm({
              ...form,
              visitCount: Math.max(1, parseInt(e.target.value, 10) || 1),
            })
          }
        />
      </div>

      <div className="form-group">
        <label>感想・メモ</label>
        <textarea
          className="input textarea"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="水風呂の温度、外気浴の雰囲気など..."
        />
      </div>

      <div className="cta-group">
        <button type="submit" className="btn btn-primary" disabled={!selectedLocation}>
          保存
        </button>
        {editingId && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            削除
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
