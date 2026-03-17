"use client";

import { useEffect, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import Calendar from 'react-calendar';
import styles from './stats.module.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import MonthlyVisitsChart from '@/components/charts/MonthlyVisitsChart';
import RatingDistributionChart from '@/components/charts/RatingDistributionChart';
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  getInitialTheme,
  flattenVisitHistory,
  getInitialVisits,
  calculateStats,
} from "@/components/sauna-map/utils";

export default function StatsPage() {
  const [visits] = useState<SaunaVisit[]>(getInitialVisits);
  const [theme] = useState<'dark' | 'light'>(getInitialTheme);
  const [date, setDate] = useState<Date | null>(new Date());

  useEffect(() => {
    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");
    return () => {
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, []);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      if (visitDates.has(dateStr)) {
        return <div className="calendar-dot"></div>;
      }
    }
    return null;
  }, [visitDates]);

  const tileClassName = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      if (visitDates.has(dateStr)) {
        return "react-calendar__tile--has-visit";
      }
    }
    return null;
  }, [visitDates]);

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    flattenVisitHistory(visits)
      .filter((entry) => entry.status === "visited")
      .forEach((entry) => {
        const dateStr = new Date(entry.date).toDateString();
        dates.set(dateStr, (dates.get(dateStr) ?? 0) + 1);
      });
    return dates;
  }, [visits]);

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

        <div className={styles.summaryGrid}>
          <article className={styles.statCard}>
            <h3>合計サウナ数</h3>
            <p>{stats.total}</p>
          </article>
          <article className={styles.statCard}>
            <h3>行った / 行きたい</h3>
            <p>{stats.visitedCount} / {stats.wishlistCount}</p>
          </article>
          <article className={styles.statCard}>
            <h3>記録エリア数</h3>
            <p>{stats.uniqueAreas}</p>
          </article>
          <article className={styles.statCard}>
            <h3>平均満足度</h3>
            <p>{stats.avgRating > 0 ? `${stats.avgRating} / 5` : '-'}</p>
          </article>
          <article className={styles.statCard}>
            <h3>記録期間</h3>
            <p>{stats.firstDate && stats.lastDate ? `${stats.firstDate} 〜 ${stats.lastDate}` : '-'}</p>
          </article>
          <article className={styles.statCard}>
            <h3>都道府県制覇</h3>
            <p>{stats.prefectureCount} / 47</p>
          </article>
        </div>

        {stats.prefectureCount > 0 && (
          <section className={styles.prefectureSection}>
            <h2>都道府県制覇</h2>
            <div className={styles.badgeList}>
              {stats.prefectures.map((pref) => (
                <span key={pref} className={styles.prefectureBadge}>
                  {pref}
                </span>
              ))}
            </div>
          </section>
        )}

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

        <div className={styles.chartsWrap}>
           <section className={styles.chartCard}>
              <h2>訪問カレンダー</h2>
              <div className="calendarContainer">
                <Calendar
                  onChange={(value) => setDate(value instanceof Date ? value : null)}
                  value={date}
                  calendarType="gregory"
                  className={theme === 'light' ? 'light-theme' : 'dark-theme'}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                />
              </div>
            </section>
        </div>
      </main>
    </div>
  );
}
