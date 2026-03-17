import { ChangeEvent, Dispatch, FormEvent, SetStateAction, memo, useMemo } from "react";
import { VisitFormState, VisitHistoryEntry } from "../types";

interface VisitFormProps {
  form: VisitFormState;
  setForm: Dispatch<SetStateAction<VisitFormState>>;
  selectedLocation: { lat: number; lng: number } | null;
  editingId: string | null;
  historyEntries: VisitHistoryEntry[];
  isCompressingImage?: boolean;
  onSubmit: (e: FormEvent) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onCancel: () => void;
  onDeleteLastHistory?: () => void;
}

export const VisitForm = memo(function VisitForm({
  form,
  setForm,
  selectedLocation,
  editingId,
  historyEntries,
  isCompressingImage = false,
  onSubmit,
  onImageChange,
  onDelete,
  onCancel,
  onDeleteLastHistory,
}: VisitFormProps) {
  const historyCount = historyEntries.length;
  const shouldAppend = Boolean(editingId && form.appendHistory);
  const recentHistory = useMemo(
    () => [...historyEntries].reverse().slice(0, 5),
    [historyEntries],
  );
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
            className={`btn segmented-btn segmented-btn--visited ${
              form.status === "visited" ? "is-active" : ""
            }`}
            onClick={() => setForm({ ...form, status: "visited" })}
          >
            行った
          </button>
          <button
            type="button"
            className={`btn segmented-btn segmented-btn--wishlist ${
              form.status === "wishlist" ? "is-active" : ""
            }`}
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
          className="input input-file"
          accept="image/*"
          onChange={onImageChange}
          disabled={isCompressingImage}
        />
        {isCompressingImage && <p className="form-hint">画像を圧縮中...</p>}
        {form.image && !isCompressingImage && (
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

      {editingId && (
        <div className="form-group">
          <label>訪問履歴</label>
          <div className="history-summary">
            <span>現在の履歴: {historyCount}件</span>
            {shouldAppend && <span className="history-badge">保存で+1</span>}
          </div>
          {historyCount > 0 && (
            <ul className="history-list">
              {recentHistory.map((entry, index) => (
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
      )}

      <div className="form-group">
        <label>感想・メモ</label>
        <textarea
          className="input textarea"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="水風呂の温度、外気浴の雰囲気など..."
        />
      </div>

      {editingId && (
        <div className="form-group">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.appendHistory}
              onChange={(e) => setForm({ ...form, appendHistory: e.target.checked })}
            />
            この内容を訪問履歴に追加する
          </label>
          <p className="form-hint">
            オフにすると直近の記録を上書きします。
          </p>
        </div>
      )}

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
});
