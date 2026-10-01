import { X } from "lucide-react";

export type ToastTone = "info" | "success" | "error";

/** トーストを出す関数。フックが通知を受け取る引数はこの型にそろえる */
export type ShowToast = (message: string, tone: ToastTone) => void;

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

  const isUrgent = toast.tone === "error";

  return (
    <div
      className={`app-toast app-toast--${toast.tone}`}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
    >
      <span>{toast.message}</span>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="閉じる">
        <X size={16} />
      </button>
    </div>
  );
}
