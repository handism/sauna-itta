import { CheckCircle2, Star } from "lucide-react";
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
