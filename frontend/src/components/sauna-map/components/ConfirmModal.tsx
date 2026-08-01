import { useModalBehavior } from "../hooks/useModalBehavior";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const containerRef = useModalBehavior(isOpen, onCancel);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-overlay" onClick={onCancel} role="presentation">
      <div
        ref={containerRef}
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        tabIndex={-1}
      >
        <h3 id="confirm-title" className="confirm-title">
          {title}
        </h3>
        <p id="confirm-message" className="confirm-message">
          {message}
        </p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
