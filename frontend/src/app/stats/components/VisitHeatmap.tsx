import { buildVisitHeatmap } from '@/components/sauna-map/utils/visitHeatmap';
import { formatShortDate } from '@/components/sauna-map/utils/date';
import styles from '../stats.module.css';

interface VisitHeatmapProps {
  visitDates: Map<string, number>;
  /** 右端の週に含める日（最後に訪問した日、年を選んでいるときはその年の大みそか） */
  end: Date;
  /** 集計している年（"2026" の形）。null は全期間で、見出しは「直近1年」になる */
  year?: string | null;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
// クラス名はテンプレートリテラルで組み立てない（tokens.test.ts のクラス名検査が追えなくなる）
const LEVEL_CLASS = [
  styles.heatmapLevel0,
  styles.heatmapLevel1,
  styles.heatmapLevel2,
  styles.heatmapLevel3,
] as const;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 直近 1 年の訪問を週 × 曜日のマスで示す（GitHub の草のような表）。
 * 月のカレンダーだけでは 1 か月ずつしか見えず、通うペースや空白の期間が読めない。
 * マスは見た目用（aria-hidden）で、読み上げには期間と訪問日数の要約を渡す。
 * 日ごとの訪問は隣の月のカレンダーから辿れる。
 */
export function VisitHeatmap({ visitDates, end, year = null }: VisitHeatmapProps) {
  const { weeks, start, end: endDay, activeDays, totalVisits } = buildVisitHeatmap(visitDates, end);
  const summary = `${formatShortDate(toIsoDate(start))}〜${formatShortDate(toIsoDate(endDay))}の${activeDays}日に${totalVisits}回訪問`;

  return (
    <figure className={styles.heatmap}>
      <figcaption className={styles.heatmapCaption}>
        {year ? `${year}年は` : '直近1年で'} <strong>{activeDays}</strong> 日 訪問
      </figcaption>
      <div className={styles.heatmapScroll}>
        <div className={styles.heatmapGrid} role="img" aria-label={summary}>
          <div className={styles.heatmapWeekdays} aria-hidden="true">
            {/* 週の列の先頭にある月の見出しと高さを揃える */}
            <span className={styles.heatmapMonth} />
            {WEEKDAY_LABELS.map((label, i) => (
              // 行の見出しは月・水・金だけ出す（7 行すべてに付けると詰まって読めない）
              <span key={label}>{i % 2 === 1 ? label : ''}</span>
            ))}
          </div>
          <div className={styles.heatmapWeeks} aria-hidden="true">
            {weeks.map((week) => (
              <div key={week.days[0].key} className={styles.heatmapWeek}>
                <span className={styles.heatmapMonth}>{week.monthLabel ?? ''}</span>
                {week.days.map((day) =>
                  day.inRange ? (
                    <span
                      key={day.key}
                      className={`${styles.heatmapCell} ${LEVEL_CLASS[day.level]}`}
                      title={`${formatShortDate(toIsoDate(day.date))}${day.count > 0 ? `：${day.count}回` : ''}`}
                    />
                  ) : (
                    <span key={day.key} className={styles.heatmapCellEmpty} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.heatmapLegend} aria-hidden="true">
        <span>少</span>
        {([0, 1, 2, 3] as const).map((level) => (
          <span key={level} className={`${styles.heatmapCell} ${LEVEL_CLASS[level]}`} />
        ))}
        <span>多</span>
      </div>
    </figure>
  );
}
