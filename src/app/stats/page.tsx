"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Calendar from 'react-calendar';
import styles from './stats.module.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import MonthlyVisitsChart from '@/components/charts/MonthlyVisitsChart';
import RatingDistributionChart from '@/components/charts/RatingDistributionChart';
import initialVisits from "@/data/sauna-visits.json";
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  normalizeVisits,
  VISITS_STORAGE_KEY,
  getInitialTheme,
  extractPrefecture,
  flattenVisitHistory,
} from "@/components/sauna-map/utils";

function getInitialVisits(): SaunaVisit[] {
  const baseVisits = normalizeVisits(initialVisits as SaunaVisit[]);

  if (typeof window === "undefined") {
    return baseVisits;
  }

  const savedVisits = localStorage.getItem(VISITS_STORAGE_KEY);
  if (!savedVisits) {
    return baseVisits;
  }

  try {
    const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
    const normalizedSaved = normalizeVisits(parsedSaved);
    const initialIds = new Set(baseVisits.map((v) => v.id));
    const customVisits = normalizedSaved.filter((v) => !initialIds.has(v.id));
    return [...customVisits, ...baseVisits];
  } catch (e) {
    console.error("Failed to parse saved visits:", e);
    return baseVisits;
  }
}

export default function StatsPage() {
  const [visits] = useState<SaunaVisit[]>(getInitialVisits);
  const [theme] = useState<'dark' | 'light'>(getInitialTheme);
  const [date, setDate] = useState<Date | Date[]>(new Date());

  useEffect(() => {
    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");
    return () => {
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, []);

  const stats = useMemo(() => {
    const total = visits.length;
    if (total === 0) {
      return {
        total,
        visitedCount: 0,
        wishlistCount: 0,
        firstDate: null as string | null,
        lastDate: null as string | null,
        avgRating: 0,
        uniqueAreas: 0,
        prefectures: [] as string[],
        prefectureCount: 0,
      };
    }

    const historyEntries = flattenVisitHistory(visits).filter(
      (entry) => entry.status === "visited"
    );
    const sortedByDate = historyEntries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = sortedByDate.length > 0 ? sortedByDate[0].date : null;
    const lastDate =
      sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].date : null;
    const visitedCount = visits.filter((v) => (v.status ?? "visited") === "visited").length;
    const wishlistCount = visits.filter((v) => (v.status ?? "visited") === "wishlist").length;
    const ratings = historyEntries.map((v) => v.rating ?? 0).filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : 0;
    const areas = new Set(
      visits
        .map((v) => (v.area ?? "").trim())
        .filter((a) => a.length > 0)
    );
    const prefectures = Array.from(
      new Set(
        visits
          .filter((v) => (v.status ?? "visited") === "visited")
          .map((v) => extractPrefecture(v.area))
          .filter((p): p is string => p != null)
      )
    ).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      total,
      visitedCount,
      wishlistCount,
      firstDate,
      lastDate,
      avgRating,
      uniqueAreas: areas.size,
      prefectures,
      prefectureCount: prefectures.length,
    };
  }, [visits]);

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    const historyEntries = flattenVisitHistory(visits).filter(
      (entry) => entry.status === "visited"
    );
    historyEntries.forEach((entry) => {
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
           <section className={`${styles.chartCard} ${styles.calendarCard}`}>
              <h2>訪問カレンダー</h2>
              <div className={styles.calendarContainer}>
                <Calendar
                  onChange={setDate}
                  value={date}
                  calendarType="gregory"
                  className={theme === 'light' ? 'light-theme' : 'dark-theme'}
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const dateStr = date.toDateString();
                      if (visitDates.has(dateStr)) {
                        return <div className="calendar-dot"></div>;
                      }
                    }
                    return null;
                  }}
                  tileClassName={({ date, view }) => {
                    if (view === 'month') {
                      const dateStr = date.toDateString();
                      if (visitDates.has(dateStr)) {
                        return "react-calendar__tile--has-visit";
                      }
                    }
                    return null;
                  }}
                />
              </div>
            </section>
        </div>
      </main>
    </div>
  );
}
