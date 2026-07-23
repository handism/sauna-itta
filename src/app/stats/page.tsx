"use client";

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import styles from './stats.module.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import MonthlyVisitsChart from '@/components/charts/MonthlyVisitsChart';
import RatingDistributionChart from '@/components/charts/RatingDistributionChart';
import { useStatsData } from './hooks/useStatsData';
import { SummaryGrid } from './components/SummaryGrid';
import { PrefectureSection } from './components/PrefectureSection';
import { VisitCalendar } from './components/VisitCalendar';
import { HomeSaunaCard } from './components/HomeSaunaCard';
import { TopSaunasCard } from './components/TopSaunasCard';
import { TagCloudCard } from './components/TagCloudCard';

export default function StatsPage() {
  const { visits, theme, date, setDate, mounted, stats, visitDates } = useStatsData();

  if (!mounted) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <header className={styles.description}>
            <div>
              <p className={styles.eyebrow}>
                <Sparkles size={14} className={styles.sparkleIcon} />
                Sauna Itta Analytics
              </p>
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
            <p className={styles.eyebrow}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              Sauna Itta Analytics
            </p>
            <h1>統計ダッシュボード</h1>
          </div>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>マップに戻る</span>
          </Link>
        </header>

        {stats.total === 0 && (
          <div className={styles.emptyState}>
            <p>まだ訪問記録がありません。地図からサウナを登録すると、ここにグラフィカルな統計が表示されます。</p>
            <Link href="/" className={styles.backLink}>
              マップでサウナを登録する
            </Link>
          </div>
        )}

        {/* 1. Key Statistics Summary */}
        <SummaryGrid stats={stats} />

        {/* 2. Featured Home Sauna & Top 5 Ranking Section */}
        <div className={styles.featuredGrid}>
          <HomeSaunaCard visits={visits} />
          <TopSaunasCard visits={visits} />
        </div>

        {/* 3. Charts Section */}
        <div className={styles.chartsWrap}>
          <div className={styles.chartGrid}>
            <section className={`${styles.glassCard} ${styles.chartCard}`}>
              <div className={styles.cardHeader}>
                <h2>月別訪問数</h2>
                <span className={styles.cardSubtitle}>過去の訪問ペース推移</span>
              </div>
              <MonthlyVisitsChart visits={visits} theme={theme} />
            </section>

            <section className={`${styles.glassCard} ${styles.chartCard}`}>
              <div className={styles.cardHeader}>
                <h2>満足度分布</h2>
                <span className={styles.cardSubtitle}>ととのい度評価の内訳</span>
              </div>
              <RatingDistributionChart visits={visits} theme={theme} />
            </section>
          </div>
        </div>

        {/* 4. Tags & Features Cloud */}
        <div className={styles.sectionWrap}>
          <TagCloudCard visits={visits} />
        </div>

        {/* 5. Prefecture Conquest */}
        <div className={styles.sectionWrap}>
          <PrefectureSection prefectures={stats.prefectures} count={stats.prefectureCount} />
        </div>

        {/* 6. Calendar View */}
        <div className={styles.sectionWrap}>
          <VisitCalendar
            theme={theme}
            date={date}
            setDate={setDate}
            visitDates={visitDates}
          />
        </div>
      </main>
    </div>
  );
}
