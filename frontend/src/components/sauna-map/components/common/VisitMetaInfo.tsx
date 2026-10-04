import { formatDisplayDate } from "../../utils/date";

interface VisitMetaInfoProps {
  date: string;
  visitCount?: number;
  /**
   * 行きたい記録には「行った日」が無い（フォームにも入力欄を出さない）。
   * 保存値の date は登録時の既定値に過ぎず、出すと何の日付か読めないため表示しない。
   */
  isWishlist?: boolean;
  className?: string;
}

export function VisitMetaInfo({
  date,
  visitCount = 1,
  isWishlist = false,
  className = "sauna-card-meta",
}: VisitMetaInfoProps) {
  const showDate = !isWishlist && date.length > 0;
  const showCount = !isWishlist && visitCount > 1;
  if (!showDate && !showCount) return null;

  return (
    <div className={className}>
      {showDate && (
        <span>
          行った日: <time dateTime={date}>{formatDisplayDate(date)}</time>
        </span>
      )}
      {showCount && <span>訪問 {visitCount}回目</span>}
    </div>
  );
}
