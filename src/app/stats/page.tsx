"use client";

import { useState } from 'react';
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

export default function StatsPage() {
  const [visits] = useState<SaunaVisit[]>(getInitialVisits);
  const [theme] = useState<'dark' | 'light'>(getInitialTheme);

  return (
    <div
      className={theme === 'light' ? 'light-theme' : ''}
      style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}
    >
      <main className={styles.main}>
        <div className={styles.description}>
          <h1 style={{ marginRight: 'auto' }}>統計ダッシュボード</h1>
          <Link href="/" className={styles.backLink} style={{ marginLeft: 'auto' }}>
            &larr; マップに戻る
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '1200px', marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <section style={{ marginBottom: '3rem' }}>
              <h2>月別訪問数</h2>
              <MonthlyVisitsChart visits={visits} theme={theme} />
            </section>

            <section style={{ marginBottom: '3rem' }}>
              <h2>満足度分布</h2>
              <RatingDistributionChart visits={visits} theme={theme} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
