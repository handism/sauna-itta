"use client";

import { useEffect } from "react";
import { reportError } from "../../utils/errorReporter";

/**
 * ErrorBoundary の外で起きたエラー（イベントハンドラ・非同期処理の未処理例外）を報告する。
 * 描画中のエラーは ErrorBoundary の componentDidCatch が報告する。
 */
export function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // 別オリジンのスクリプトのエラーは中身が伏せられ "Script error." だけになり、原因を辿れないため送らない
      if (!event.error && (!event.message || event.message === "Script error.")) return;
      reportError(event.error ?? event.message, "window-error");
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, "unhandled-rejection");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
