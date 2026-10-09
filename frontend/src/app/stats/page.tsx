"use client";

import dynamic from 'next/dynamic';
import styles from './stats.module.css';
import shellStyles from './stats-shell.module.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import { useStatsData } from './hooks/useStatsData';
import { StatsHeader } from './components/StatsHeader';
import { SummaryGrid } from './components/SummaryGrid';
import { PrefectureSection } from './components/PrefectureSection';
import { HomeSaunaCard } from './components/HomeSaunaCard';
import { TopSaunasCard } from './components/TopSaunasCard';
import { TagCloudCard } from './components/TagCloudCard';
import { StatsEmptyState } from './components/StatsEmptyState';
import { YearFilter } from './components/YearFilter';
import { ApiAccessGate } from '@/components/sauna-map/components/ApiAccessGate';
import { cx } from '@/components/sauna-map/utils';

const MonthlyVisitsChart = dynamic(() => import('@/components/charts/MonthlyVisitsChart'), {
  loading: () => <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ minHeight: 260 }} />,
  ssr: false,
});

const RatingDistributionChart = dynamic(() => import('@/components/charts/RatingDistributionChart'), {
  loading: () => <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ minHeight: 260 }} />,
  ssr: false,
});

const VisitCalendar = dynamic(() => import('./components/VisitCalendar').then((mod) => mod.VisitCalendar), {
  loading: () => <div className={`${styles.chartCard} ${styles.skeleton}`} style={{ minHeight: 260 }} />,
  ssr: false,
});

export default function StatsPage() {
  const {
    visits,
    years,
    year,
    setYear,
    theme,
    toggleTheme,
    date,
    setDate,
    mounted,
    authenticated,
    csrfToken,
    loadError,
    dataSource,
    stats,
    visitedEntries,
    rankedVisits,
    visitDates,
  } = useStatsData();

  if (!mounted) {
    return (
      <div className={shellStyles.page}>
        <main className={shellStyles.main}>
          <StatsHeader showBackLink={false} />
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

  if (dataSource === "api" && (!authenticated || loadError)) {
    return (
      <ApiAccessGate
        loading={false}
        authenticated={authenticated}
        csrfToken={csrfToken}
        error={loadError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className={cx(shellStyles.page, theme === 'light' && 'light-theme')}>
      <main className={shellStyles.main}>
        <StatsHeader theme={theme} onToggleTheme={toggleTheme} />
        <YearFilter years={years} year={year} onChange={setYear} />

        {/*
          記録が 0 件のときは、0 が並ぶサマリーや空のグラフを出さずに
          登録への導線だけを見せる
        */}
        {stats.total === 0 ? (
          <StatsEmptyState variant="none" />
        ) : stats.visitedCount === 0 ? (
          /*
            「行きたい」だけのときは、グラフ・ランキング・カレンダーが行った記録だけから
            集計されるため空になる。空のカードを並べず、サマリーとタグだけを出して理由を伝える。
          */
          <>
            <StatsEmptyState variant="wishlistOnly" wishlistCount={stats.wishlistCount} />
            <SummaryGrid stats={stats} />
            <div className={styles.sectionWrap}>
              <TagCloudCard visits={visits} />
            </div>
          </>
        ) : (
          <>
            {/* 1. 集計サマリー */}
            <SummaryGrid stats={stats} />

            {/* 2. 月別訪問数・満足度の傾向 */}
            <div className={styles.chartsWrap}>
              <div className={styles.chartGrid}>
                <section className={`${styles.glassCard} ${styles.chartCard}`}>
                  <div className={styles.cardHeader}>
                    <h2>月別訪問数</h2>
                    <span className={styles.cardSubtitle}>過去の訪問ペース推移</span>
                  </div>
                  <MonthlyVisitsChart entries={visitedEntries} theme={theme} />
                </section>

                <section className={`${styles.glassCard} ${styles.chartCard}`}>
                  <div className={styles.cardHeader}>
                    <h2>満足度分布</h2>
                    <span className={styles.cardSubtitle}>ととのい度評価の内訳</span>
                  </div>
                  <RatingDistributionChart
                    entries={visitedEntries}
                    avgRating={stats.avgRating}
                    theme={theme}
                  />
                </section>
              </div>
            </div>

            {/*
              3. 訪問カレンダー（年間ヒートマップ）。数字と傾向を見た後、個別の訪問日を確認する。
              年を切り替えたときは、最後に訪問した月を開き直すよう作り直す。
            */}
            <div className={styles.sectionWrap}>
              <VisitCalendar
                key={year ?? "all"}
                theme={theme}
                date={date}
                setDate={setDate}
                visitDates={visitDates}
                visits={visits}
                entries={visitedEntries}
                year={year}
              />
            </div>

            {/* 4. ホームサウナ・施設ランキング */}
            <div className={styles.featuredGrid}>
              <HomeSaunaCard ranked={rankedVisits} />
              <TopSaunasCard ranked={rankedVisits} />
            </div>

            {/* 5. タグ */}
            <div className={styles.sectionWrap}>
              <TagCloudCard visits={visits} />
            </div>

            {/* 6. 都道府県制覇（0 件のとき中身は描画されないため、余白ごと出さない） */}
            {stats.prefectureCount > 0 && (
              <div className={styles.sectionWrap}>
                <PrefectureSection prefectures={stats.prefectures} count={stats.prefectureCount} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
