import type { ReactNode } from "react";
import { Check, Save, X, Trash2, Info, Loader2, CheckCircle2, Star, MapPin } from "lucide-react";
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
      {editingId ? (
        <p className="panel-subtitle">内容を更新します</p>
      ) : (
        /*
          新規登録で最初に必要なのは場所の選択なので、補足文ではなく状態表示として目立たせる。
          選択の前後で文言が変わるため、支援技術へも role="status" で伝える。
        */
        <p
          className={`location-status ${selectedLocation ? "is-selected" : ""}`}
          role="status"
        >
          {selectedLocation ? (
            <>
              <CheckCircle2 size={16} aria-hidden="true" /> 場所を選択しました（地図をクリックで変更）
            </>
          ) : (
            <>
              <MapPin size={16} aria-hidden="true" /> 地図上をクリックして場所を選択してください
            </>
          )}
        </p>
      )}
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

/**
 * フォームの区切り。項目を「場所」「記録の内容」「タグ」のまとまりで見せ、
 * 長いフォームのどこを入力しているかを見失わないようにする。
 */
export function FormSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section className="form-section" aria-labelledby={headingId}>
      <h3 className="form-section-title" id={headingId}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function HistoryAppendField({
  appendHistory,
  onChange,
}: {
  appendHistory: boolean;
  onChange: (appendHistory: boolean) => void;
}) {
  /*
   * 「新しい訪問として追加」と「前回の記録を修正」は排他の 2 択なので、
   * チェックボックス＋長い説明文ではなく、どちらを選んでいるかが見える切り替えにする。
   */
  return (
    <div className="form-group">
      <span className="form-group-label" id="visit-append-label">
        保存のしかた
      </span>
      <div className="segmented" role="group" aria-labelledby="visit-append-label">
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--mode ${appendHistory ? "is-active" : ""}`}
          aria-pressed={appendHistory}
          onClick={() => onChange(true)}
        >
          新しい訪問を追加
        </button>
        <button
          type="button"
          className={`btn segmented-btn segmented-btn--mode ${!appendHistory ? "is-active" : ""}`}
          aria-pressed={!appendHistory}
          onClick={() => onChange(false)}
        >
          前回の記録を修正
        </button>
      </div>
      <p className="form-hint" role="status">
        {appendHistory
          ? "今回の内容を新しい訪問として履歴に追加します（訪問回数+1）。"
          : "最新の訪問の内容を書き換えます（訪問回数は変わりません）。"}
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
      {/*
        選んでいる星をもう一度押すと評価を外す。星の横に「クリア」の文字ボタンを
        並べると、星より目立って何の操作か分かりにくかったため。
      */}
      <div
        className="rating-row"
        role="group"
        aria-labelledby="visit-rating-label"
        aria-describedby="visit-rating-hint"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(rating === star ? 0 : star)}
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
      </div>
      <p className="form-hint" id="visit-rating-hint">
        {rating > 0 ? "選んだ星をもう一度押すと評価を外せます" : "未評価"}
      </p>
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
