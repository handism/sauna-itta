import { MapPin, X } from "lucide-react";
import { LocationSearchInput } from "../form/LocationSearchInput";
import type { GeocodingResult } from "../../utils/geocoding";
import { cx } from "../../utils/classNames";

interface MobilePinHintProps {
  /** 省略するとキャンセルボタンを出さない */
  onCancel?: () => void;
  /**
   * 渡すと案内の下に地点検索を出す（モバイル用）。全国表示から目的の施設まで
   * ピンチで寄せるのは手間なので、名前や住所から直接場所を選べるようにする。
   */
  onSelectSearchResult?: (result: GeocodingResult) => void;
}

/**
 * モバイルの場所の選択中に地図上へ出す案内バー。フォームを隠して地図をタップさせるため必須の案内。
 * デスクトップはフォーム先頭の .location-status が同じ案内を出すため使わない。
 */
export function MobilePinHint({ onCancel, onSelectSearchResult }: MobilePinHintProps) {
  const showSearch = onSelectSearchResult != null;

  return (
    <div className={cx("pin-hint", showSearch && "pin-hint--with-search")}>
      {/* 案内の文言だけをライブリージョンにする（検索欄まで含めると入力のたびに読み上げが走る） */}
      <div className="pin-hint-main" role="status">
        <div className="pin-hint-icon">
          <MapPin size={20} aria-hidden="true" />
        </div>
        <div className="pin-hint-text">
          <strong>地図をタップして場所を選択</strong>
          <span>選ぶと記録の入力に進みます</span>
        </div>
      </div>
      {onCancel && (
        <button
          type="button"
          className="pin-hint-cancel"
          onClick={onCancel}
          aria-label="場所の選択をやめる"
          title="場所の選択をやめる"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
      {showSearch && (
        <div className="pin-hint-search">
          <label htmlFor="pin-hint-location-search" className="sr-only">
            施設名や住所で場所を検索
          </label>
          <LocationSearchInput
            inputId="pin-hint-location-search"
            placeholder="または施設名・住所で探す..."
            onSelectLocation={onSelectSearchResult}
          />
        </div>
      )}
    </div>
  );
}
