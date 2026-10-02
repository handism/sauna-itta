import Calendar from 'react-calendar';
import styles from '../stats.module.css';

interface VisitCalendarProps {
  theme: 'light' | 'dark';
  date: Date | null;
  setDate: (date: Date | null) => void;
  visitDates: Map<string, number>;
}

/**
 * 最後に訪問した月の 1 日。今月に訪問が無いと、開いた時点のカレンダーが空になり
 * 「記録が無い」ように見えるため、初期表示はここに合わせる。
 */
function getLatestVisitMonth(visitDates: Map<string, number>): Date | undefined {
  let latest: Date | undefined;
  for (const key of visitDates.keys()) {
    const d = new Date(key);
    if (Number.isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest ? new Date(latest.getFullYear(), latest.getMonth(), 1) : undefined;
}

export function VisitCalendar({ theme, date, setDate, visitDates }: VisitCalendarProps) {
  return (
    <section
      className={`${styles.glassCard} ${styles.chartCard}`}
      aria-labelledby="visit-calendar-title"
    >
      <div className={styles.cardHeader}>
        <h2 id="visit-calendar-title">訪問カレンダー</h2>
        <span className={styles.cardSubtitle}>訪問した日に印が付きます</span>
      </div>
      <div className="calendarContainer" role="group" aria-label="訪問カレンダー。訪問記録がある日にはマーカーが表示されます">
        <Calendar
          onChange={(value) => setDate(value instanceof Date ? value : null)}
          value={date}
          defaultActiveStartDate={getLatestVisitMonth(visitDates)}
          calendarType="gregory"
          // 日本語ロケールの既定は「27日」。マスの中では数字だけの方が読みやすい
          formatDay={(_locale, day) => String(day.getDate())}
          className={theme === 'light' ? 'light-theme' : 'dark-theme'}
          tileContent={({ date, view }) => {
            if (view !== 'month') return null;
            if (!visitDates.has(date.toDateString())) return null;
            return (
              <>
                <div className="calendar-dot" aria-hidden="true"></div>
                <span className="sr-only">訪問記録あり</span>
              </>
            );
          }}
          tileClassName={({ date, view }) => {
            if (view !== 'month') return null;
            return visitDates.has(date.toDateString()) ? "react-calendar__tile--has-visit" : null;
          }}
        />
      </div>
    </section>
  );
}
