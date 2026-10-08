import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import type { MonthVisitEntry } from '@/components/sauna-map/utils';
import { parseLocalDate } from '@/components/sauna-map/utils/date';
import styles from '../stats.module.css';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface MonthVisitListProps {
  /** 表示している月の 1 日 */
  month: Date;
  /** その月の訪問（日付順） */
  entries: MonthVisitEntry[];
  /** カレンダーで選んだ日（YYYY-MM-DD）。null は月全体 */
  pickedDay: string | null;
  onClearPickedDay: () => void;
}

function formatDayLabel(date: string): string {
  const d = parseLocalDate(date);
  return `${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

/**
 * 訪問カレンダーの横に、表示している月（日を選んだときはその日）の訪問を並べる。
 * カレンダーの点だけではどこへ行ったのかが分からず、日を選んでも何も変わらなかった。
 */
export function MonthVisitList({ month, entries, pickedDay, onClearPickedDay }: MonthVisitListProps) {
  const shown = pickedDay ? entries.filter((entry) => entry.date === pickedDay) : entries;
  const title = pickedDay
    ? `${month.getMonth() + 1}月${formatDayLabel(pickedDay)}の訪問`
    : `${month.getFullYear()}年${month.getMonth() + 1}月の訪問`;

  return (
    <section className={styles.monthVisits} aria-labelledby="month-visits-title">
      <div className={styles.monthVisitsHeader}>
        <h3 id="month-visits-title">{title}</h3>
        <span className={styles.monthVisitsCount}>{shown.length}件</span>
      </div>
      {pickedDay && (
        <button type="button" className={styles.monthVisitsBack} onClick={onClearPickedDay}>
          {month.getMonth() + 1}月の訪問をすべて表示
        </button>
      )}
      {shown.length === 0 ? (
        <p className={styles.monthVisitsEmpty}>
          {pickedDay ? 'この日の訪問はありません' : 'この月の訪問はありません'}
        </p>
      ) : (
        <ul className={styles.monthVisitsList}>
          {shown.map(({ visit, date, rating }) => (
            <li key={`${visit.id}-${date}`} className={styles.monthVisitRow}>
              <time dateTime={date} className={styles.monthVisitDate}>
                {formatDayLabel(date)}
              </time>
              <span className={styles.monthVisitBody}>
                <span className={styles.monthVisitName}>{visit.name}</span>
                {visit.area && <span className={styles.monthVisitArea}>{visit.area}</span>}
              </span>
              {rating > 0 && (
                <span className={styles.monthVisitRating} aria-label={`満足度 ${rating}`}>
                  <Star size={12} fill="currentColor" aria-hidden="true" /> {rating}
                </span>
              )}
              <Link
                href={`/?id=${visit.id}`}
                className={`${styles.mapJumpLink} ${styles.mapJumpLinkQuiet}`}
                aria-label={`${visit.name}を地図で見る`}
                title={`${visit.name}を地図で見る`}
              >
                <MapPin size={12} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
