import Calendar from 'react-calendar';
import styles from '../stats.module.css';
import { getLatestVisitDate } from '@/components/sauna-map/utils/visitHeatmap';
import { VisitHeatmap } from './VisitHeatmap';

interface VisitCalendarProps {
  theme: 'light' | 'dark';
  date: Date | null;
  setDate: (date: Date | null) => void;
  visitDates: Map<string, number>;
  /** 集計している年（"2026" の形）。null は全期間 */
  year?: string | null;
}

/**
 * 最後に訪問した月の 1 日。今月に訪問が無いと、開いた時点のカレンダーが空になり
 * 「記録が無い」ように見えるため、初期表示はここに合わせる。
 */
function getLatestVisitMonth(latest: Date | null): Date | undefined {
  return latest ? new Date(latest.getFullYear(), latest.getMonth(), 1) : undefined;
}

/**
 * ヒートマップの右端の日。年を選んでいるときは 1〜12 月が並ぶよう、その年の大みそかにする
 * （最後の訪問日のままだと、6 月で訪問が途切れた年は前年の 7 月からの表になる）。
 * ただし今年は先の空白の週を並べないよう、最後の訪問日のままにする。
 */
function getHeatmapEnd(latest: Date, year: string | null): Date {
  if (year === null || Number(year) === new Date().getFullYear()) {
    return latest;
  }
  return new Date(Number(year), 11, 31);
}

export function VisitCalendar({ theme, date, setDate, visitDates, year = null }: VisitCalendarProps) {
  const latestVisit = getLatestVisitDate(visitDates);

  return (
    <section
      className={`${styles.glassCard} ${styles.chartCard}`}
      aria-labelledby="visit-calendar-title"
    >
      <div className={styles.cardHeader}>
        <h2 id="visit-calendar-title">訪問カレンダー</h2>
        <span className={styles.cardSubtitle}>
          {year ? `${year}年` : '直近1年'}のペースと、月ごとの訪問日
        </span>
      </div>
      {/*
        1 年分のヒートマップでペースと空白の期間を、月のカレンダーで日ごとの訪問を見せる。
        月のカレンダーだけを広いカードの中央に置くと、両脇が大きく空く。
      */}
      <div className={styles.calendarLayout}>
        {latestVisit && (
          <VisitHeatmap visitDates={visitDates} end={getHeatmapEnd(latestVisit, year)} year={year} />
        )}
        <div className="calendarContainer" role="group" aria-label="訪問カレンダー。訪問記録がある日にはマーカーが表示されます">
          <Calendar
            onChange={(value) => setDate(value instanceof Date ? value : null)}
            value={date}
            defaultActiveStartDate={getLatestVisitMonth(latestVisit)}
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
      </div>
    </section>
  );
}
