"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './stats.module.css';
import MonthlyVisitsChart from '@/components/charts/MonthlyVisitsChart';
import RatingDistributionChart from '@/components/charts/RatingDistributionChart';
import initialVisits from "@/data/sauna-visits.json";

// Interface for Sauna Visit (should be shared)
interface SaunaVisit {
  id: string;
  name:string;
  lat: number;
  lng: number;
  comment: string;
  image?: string;
  date: string;
  rating?: number;
  tags?: string[];
  status?: "visited" | "wishlist";
  area?: string;
  visitCount?: number;
}

function normalizeVisits(visits: SaunaVisit[]): SaunaVisit[] {
  return visits.map((v) => ({
    ...v,
    rating: v.rating ?? 0,
    tags: v.tags ?? [],
    status: v.status ?? "visited",
    area: v.area ?? "",
    visitCount: Math.max(1, v.visitCount ?? 1),
  }));
}

function getInitialVisits(): SaunaVisit[] {
  const baseVisits = normalizeVisits(initialVisits as SaunaVisit[]);

  if (typeof window === "undefined") {
    return baseVisits;
  }

  const savedVisits = localStorage.getItem("sauna-itta_visits");
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

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = localStorage.getItem("sauna-itta_theme");
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
}

function extractPrefecture(area: string | undefined): string | null {
  const s = (area ?? "").trim();
  if (!s) return null;
  const first = s.split(/\s/)[0];
  return /[都道府県]$/.test(first) ? first : null;
}

export default function StatsPage() {
  const [visits] = useState<SaunaVisit[]>(getInitialVisits);
  const [theme] = useState<'dark' | 'light'>(getInitialTheme);

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

    const sortedByDate = [...visits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = sortedByDate[0].date;
    const lastDate = sortedByDate[sortedByDate.length - 1].date;
    const visitedCount = visits.filter((v) => (v.status ?? "visited") === "visited").length;
    const wishlistCount = visits.filter((v) => (v.status ?? "visited") === "wishlist").length;
    const ratings = visits.map((v) => v.rating ?? 0).filter((r) => r > 0);
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
      </main>
    </div>
  );
}
