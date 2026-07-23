"use client";

import Link from 'next/link';
import styles from './stats.module.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import MonthlyVisitsChart from '@/components/charts/MonthlyVisitsChart';
import RatingDistributionChart from '@/components/charts/RatingDistributionChart';
import { useStatsData } from './hooks/useStatsData';
import { SummaryGrid } from './components/SummaryGrid';
import { PrefectureSection } from './components/PrefectureSection';
import { VisitCalendar } from './components/VisitCalendar';

export default function StatsPage() {
  const { visits, theme, date, setDate, mounted, stats, visitDates } = useStatsData();
  if (!mounted) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <header className={styles.description}>
            <div>
              <p className={styles.eyebrow}>Sauna Itta Analytics</p>
              <h1>統計ダッシュボード</h1>
            </div>
          </header>
          <div className={styles.summaryGrid} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${styles.statCard} ${styles.skeleton}`} />
            ))}
          </div>
          <div className={styles.chartsWrap}>
            <div className={styles.chartGrid}>
              <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ minHeight: 260 }} />
              <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ minHeight: 260 }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${theme === 'light' ? 'light-theme' : ''}`}>
      <main className={styles.main}>
        <header className={styles.description}>
          <div>
            <p className={styles.eyebrow}>Sauna Itta Analytics</p>
            <h1>統計ダッシュボード</h1>
          </div>
          <Link href="/" className={styles.backLink}>
            &larr; マップに戻る
          </Link>
        </header>

        {stats.total === 0 && (
          <div className={styles.emptyState}>
            <p>まだ訪問記録がありません。地図からサウナを登録すると、ここに統計が表示されます。</p>
            <Link href="/" className={styles.backLink}>
              マップでサウナを登録する
            </Link>
          </div>
        )}

        <SummaryGrid stats={stats} />

        <PrefectureSection prefectures={stats.prefectures} count={stats.prefectureCount} />

        <div className={styles.chartsWrap}>
          <div className={styles.chartGrid}>
            <section className={styles.chartCard}>
              <h2>月別訪問数</h2>
              <MonthlyVisitsChart visits={visits} theme={theme} />
            </section>

            <section className={styles.chartCard}>
              <h2>満足度分布</h2>
              <RatingDistributionChart visits={visits} theme={theme} />
            </section>
          </div>
        </div>

        <VisitCalendar
          theme={theme}
          date={date}
          setDate={setDate}
          visitDates={visitDates}
        />
      </main>
    </div>
  );
}
