"use client";

import React, { Component, ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error | null; reset: () => void }) => ReactNode);
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.handleReset });
      }
      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary-overlay" role="alert">
          <div className="error-boundary-card">
            <svg
              className="error-boundary-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="error-boundary-title">予期せぬエラーが発生しました</h2>
            <p className="error-boundary-description">
              ページの読み込み中または表示中にエラーが発生しました。再読み込みをお試しください。
            </p>
            {error && error.message && (
              <div className="error-boundary-details">{error.message}</div>
            )}
            <button
              type="button"
              className="error-boundary-button"
              onClick={this.handleReset}
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
