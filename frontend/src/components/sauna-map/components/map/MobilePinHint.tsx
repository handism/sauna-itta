import { MapPin, X } from "lucide-react";

interface MobilePinHintProps {
  onCancel: () => void;
}

export function MobilePinHint({ onCancel }: MobilePinHintProps) {
  return (
    <div className="pin-hint">
      <div className="pin-hint-icon">
        <MapPin size={20} />
      </div>
      <div className="pin-hint-text">
        <strong>地図をタップして場所を選択</strong>
        <span>サウナの場所をタップしてね</span>
      </div>
      <button
        type="button"
        className="pin-hint-cancel"
        onClick={onCancel}
        aria-label="場所の選択をやめる"
        title="場所の選択をやめる"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
