import { Check, Save, X, Trash2, Info, Loader2, CheckCircle2, Star } from "lucide-react";
import { LocationSearchInput } from "./LocationSearchInput";
import { GeocodingResult } from "../../utils/geocoding";
import { getDateDaysAgo } from "../../utils/date";

export function FormHeader({
  editingId,
  selectedLocation,
}: {
  editingId: string | null;
  selectedLocation: { lat: number; lng: number } | null;
}) {
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

export function LocationSearchField({
  onSelectLocation,
}: {
  onSelectLocation: (result: GeocodingResult) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor="visit-location-search">場所・施設名を検索（任意）</label>
      <LocationSearchInput
        inputId="visit-location-search"
        onSelectLocation={onSelectLocation}
      />
    </div>
  );
}

export function HistoryAppendField({
  appendHistory,
  onChange,
}: {
  appendHistory: boolean;
  onChange: (appendHistory: boolean) => void;
}) {
  return (
    <div className="form-group form-group--checkbox">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={appendHistory}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>新しい訪問記録として追加する（訪問回数+1）</span>
      </label>
      <p className="form-hint">
        チェックを入れると、今回の内容が新しい訪問履歴として保存されます。チェックを外すと前回の記録を修正します。
      </p>
    </div>
  );
}

export function CommentField({
  status,
  comment,
  onChange,
}: {
  status: "visited" | "wishlist";
  comment: string;
  onChange: (comment: string) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor="visit-comment">
        {status === "wishlist" ? "メモ" : "感想・メモ"}
      </label>
      <textarea
        id="visit-comment"
        className="input textarea"
        rows={3}
        value={comment}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          status === "wishlist"
            ? "行きたい理由や気になっているポイント..."
            : "ととのい具合、水風呂の温度、外気浴の雰囲気など..."
        }
      />
    </div>
  );
}

export function FormActions({
  saving,
  editingId,
  submitBlockedReason,
  onDelete,
  onCancel,
}: {
  saving: boolean;
  editingId: string | null;
  submitBlockedReason: string | null;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="form-actions">
      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitBlockedReason !== null}
        title={submitBlockedReason ?? undefined}
        aria-describedby={submitBlockedReason ? "submit-blocked-reason" : undefined}
      >
        {saving ? <Loader2 size={18} className="spin-icon" /> : editingId ? <Check size={18} /> : <Save size={18} />}
        <span>{saving ? "保存中..." : editingId ? "更新する" : "保存する"}</span>
      </button>
      {submitBlockedReason && (
        <p className="form-hint form-hint--blocked" id="submit-blocked-reason" role="status">
          <Info size={13} aria-hidden="true" />
          {submitBlockedReason}
        </p>
      )}
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
  );
}

export function StatusField({
  status,
  onChange,
}: {
  status: "visited" | "wishlist";
  onChange: (status: "visited" | "wishlist") => void;
}) {
  return (
    <div className="form-group">
      {/* ボタン群のため label ではなくグループラベルとして関連付ける */}
      <span className="form-group-label" id="visit-status-label">
        ステータス
      </span>
      <div className="segmented" role="group" aria-labelledby="visit-status-label">
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--visited ${
            status === "visited" ? "is-active" : ""
          }`}
          aria-pressed={status === "visited"}
          onClick={() => onChange("visited")}
        >
          行った
        </button>
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--wishlist ${
            status === "wishlist" ? "is-active" : ""
          }`}
          aria-pressed={status === "wishlist"}
          onClick={() => onChange("wishlist")}
        >
          行きたい
        </button>
      </div>
    </div>
  );
}

export function RatingField({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="form-group">
      <span className="form-group-label" id="visit-rating-label">
        満足度（1〜5）
      </span>
      <div className="rating-row" role="group" aria-labelledby="visit-rating-label">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rating-star-btn"
            aria-pressed={rating >= star}
            aria-label={`${star}つ星`}
          >
            <Star
              size={22}
              fill={rating >= star ? "currentColor" : "none"}
              className={rating >= star ? "rating-star--filled" : ""}
            />
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

export function NameField({
  name,
  onChange,
}: {
  name: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor="visit-name">サウナ名</label>
      <input
        id="visit-name"
        className="input"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 上野 SHIZUKU"
        required
      />
    </div>
  );
}

export function AreaField({
  area,
  onChange,
}: {
  area: string;
  onChange: (area: string) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor="visit-area">エリア（任意）</label>
      <input
        id="visit-area"
        className="input"
        value={area}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: 東京 / 北海道 / 関西 など"
      />
    </div>
  );
}

export function DateField({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  return (
    <div className="form-group">
      <div className="label-row-with-actions">
        <label htmlFor="visit-date">行った日</label>
        <div className="quick-date-actions">
          <button
            type="button"
            className="btn-quick-date"
            onClick={() => onChange(getDateDaysAgo(0))}
          >
            今日
          </button>
          <button
            type="button"
            className="btn-quick-date"
            onClick={() => onChange(getDateDaysAgo(1))}
          >
            昨日
          </button>
        </div>
      </div>
      <input
        id="visit-date"
        type="date"
        className="input"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
