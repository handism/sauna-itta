export type ToastTone = "info" | "success" | "error";

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`app-toast app-toast--${toast.tone}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="閉じる">
        ✕
      </button>
    </div>
  );
}
