import { MapPin, X } from "lucide-react";

interface MobilePinHintProps {
  /** 省略するとキャンセルボタンを出さない（デスクトップはフォーム側にキャンセルがあるため） */
  onCancel?: () => void;
  /** デスクトップ向けの文言・配置（サイドバーを避けた地図の中央下）に切り替える */
  variant?: "mobile" | "desktop";
}

/**
 * 場所の選択中に地図上へ出す案内バー。
 * モバイルはフォームを隠して地図をタップさせるため必須の案内で、デスクトップでは
 * サイドバーのフォームと並んで「次は地図をクリックする」ことを地図側でも示す。
 */
export function MobilePinHint({ onCancel, variant = "mobile" }: MobilePinHintProps) {
  const isDesktop = variant === "desktop";

  return (
    <div className={`pin-hint ${isDesktop ? "pin-hint--desktop" : ""}`} role="status">
      <div className="pin-hint-icon">
        <MapPin size={20} aria-hidden="true" />
      </div>
      <div className="pin-hint-text">
        <strong>{isDesktop ? "地図をクリックして場所を選択" : "地図をタップして場所を選択"}</strong>
        <span>
          {isDesktop
            ? "選ぶと左のフォームから保存できます"
            : "選ぶと記録の入力に進みます"}
        </span>
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
    </div>
  );
}
