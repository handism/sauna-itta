import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import styles from '../stats.module.css';
import type { SaunaVisit } from '@/components/sauna-map/types';
import type { FlatVisitHistoryEntry } from '@/components/sauna-map/utils/visitHistory';
import { getLatestVisitDate } from '@/components/sauna-map/utils/visitHeatmap';
import { getVisitEntriesInMonth } from '@/components/sauna-map/utils/visitStats';
import { MonthVisitList } from './MonthVisitList';
import { VisitHeatmap } from './VisitHeatmap';

interface VisitCalendarProps {
  theme: 'light' | 'dark';
  date: Date | null;
  setDate: (date: Date | null) => void;
  visitDates: Map<string, number>;
  /** 集計対象の記録（月の訪問一覧で施設名を引く） */
  visits: SaunaVisit[];
  /** 訪問済みの履歴エントリ。useStatsData が平坦化したものを渡すこと */
  entries: FlatVisitHistoryEntry[];
  /** 集計している年（"2026" の形）。null は全期間 */
  year?: string | null;
}

/**
 * 最後に訪問した月の 1 日。今月に訪問が無いと、開いた時点のカレンダーが空になり
 * 「記録が無い」ように見えるため、初期表示はここに合わせる。
 */
function getLatestVisitMonth(latest: Date | null): Date {
  const base = latest ?? new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
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

export function VisitCalendar({
  theme,
  date,
  setDate,
  visitDates,
  visits,
  entries,
  year = null,
}: VisitCalendarProps) {
  const latestVisit = getLatestVisitDate(visitDates);
  // カレンダーの表示位置（年・10 年の表示ではその先頭）と、横の一覧に並べる月。
  // 年の表示へ切り替えても一覧は最後に開いていた月のまま残す
  const [activeStartDate, setActiveStartDate] = useState(() => getLatestVisitMonth(latestVisit));
  const [activeMonth, setActiveMonth] = useState(activeStartDate);
  // 利用者がカレンダーで選んだ日。date は初期値が今日のため、選んだかどうかの判定には使えない
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const monthEntries = useMemo(
    () => getVisitEntriesInMonth(visits, entries, activeMonth.getFullYear(), activeMonth.getMonth()),
    [visits, entries, activeMonth],
  );

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
        月のカレンダーだけを広いカードの中央に置くと両脇が大きく空くため、
        デスクトップでは横にその月（選んだ日）の訪問の一覧を並べる。
      */}
      <div className={styles.calendarLayout}>
        {latestVisit && (
          <VisitHeatmap visitDates={visitDates} end={getHeatmapEnd(latestVisit, year)} year={year} />
        )}
        <div className={styles.calendarBody}>
          <div className="calendarContainer" role="group" aria-label="訪問カレンダー。訪問記録がある日にはマーカーが表示されます">
            <Calendar
              onChange={(value) => {
                const picked = value instanceof Date ? value : null;
                setDate(picked);
                setPickedDay(picked ? toIsoDate(picked) : null);
              }}
              value={date}
              activeStartDate={activeStartDate}
              onActiveStartDateChange={({ activeStartDate: start, view }) => {
                if (!start) return;
                setActiveStartDate(start);
                if (view !== 'month') return;
                setActiveMonth(start);
                // 別の月へ移ったら、前の月で選んだ日の絞り込みは外す
                const monthPrefix = toIsoDate(start).slice(0, 8);
                setPickedDay((day) => (day?.startsWith(monthPrefix) ? day : null));
              }}
              // 曜日・年月の見出しを他の画面と同じ日本語にする（未指定だとブラウザの言語に従う）
              locale="ja-JP"
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
          <MonthVisitList
            month={activeMonth}
            entries={monthEntries}
            pickedDay={pickedDay}
            onClearPickedDay={() => setPickedDay(null)}
          />
        </div>
      </div>
    </section>
  );
}
