import { Loader2, LogIn, RefreshCw } from "lucide-react";

interface ApiAccessGateProps {
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ApiAccessGate({ loading, authenticated, error, onRetry }: ApiAccessGateProps) {
  if (!loading && authenticated && !error) return null;

  return (
    <div className="api-access-gate" role="status" aria-live="polite">
      <div className="api-access-card">
        <h1>サウナイッタ</h1>
        {loading ? (
          <>
            <Loader2 className="spin-icon" aria-hidden="true" />
            <p>記録を読み込んでいます...</p>
          </>
        ) : error ? (
          <>
            <p className="api-access-error">{error}</p>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              <RefreshCw size={18} aria-hidden="true" />
              <span>再読み込み</span>
            </button>
          </>
        ) : (
          <>
            <p>記録を表示するには、許可されたGoogleアカウントでログインしてください。</p>
            <a className="btn btn-primary" href="/auth/google_oauth2">
              <LogIn size={18} aria-hidden="true" />
              <span>Googleでログイン</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
