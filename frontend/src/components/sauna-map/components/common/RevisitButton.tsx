import { CalendarPlus, CheckCircle2 } from "lucide-react";

interface RevisitButtonProps {
  visitName: string;
  isWishlist: boolean;
  onRevisit: () => void;
  className?: string;
}

/**
 * 「また行った」（行った記録）／「行った！」（行きたい記録）のボタン。
 *
 * 行きつけへの再訪はこのアプリで最も多い記録なので、編集を開いて「新しい訪問を追加」へ
 * 切り替える手順を踏ませず、今日の訪問を書く状態のフォームを直接開く。
 * 一覧カード・コンパクト行・地図ポップアップで文言と読み上げを揃えるため、必ずこれを使うこと。
 */
export function RevisitButton({ visitName, isWishlist, onRevisit, className }: RevisitButtonProps) {
  return (
    <button
      type="button"
      className={`revisit-btn ${className ?? ""}`}
      onClick={(e) => {
        // カード全体のクリック（選択）まで発火させない
        e.stopPropagation();
        onRevisit();
      }}
      aria-label={isWishlist ? `${visitName}に行った記録をつける` : `${visitName}にまた行った記録をつける`}
    >
      {isWishlist ? (
        <CheckCircle2 size={15} aria-hidden="true" />
      ) : (
        <CalendarPlus size={15} aria-hidden="true" />
      )}
      <span>{isWishlist ? "行った！" : "また行った"}</span>
    </button>
  );
}
