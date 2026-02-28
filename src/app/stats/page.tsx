"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../app/page.module.css';
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

export default function StatsPage() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setIsClient(true);

    const savedTheme = localStorage.getItem("sauna-itta_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedVisits = localStorage.getItem("sauna-itta_visits");
    let combinedVisits = [...(initialVisits as SaunaVisit[])];

    if (savedVisits) {
      try {
        const parsedSaved = JSON.parse(savedVisits) as SaunaVisit[];
        const initialIds = new Set(combinedVisits.map((v) => v.id));
        const customVisits = parsedSaved
          .map((v) => ({
            ...v,
            rating: v.rating ?? 0,
            tags: v.tags ?? [],
            status: v.status ?? "visited",
            area: v.area ?? "",
            visitCount: Math.max(1, v.visitCount ?? 1),
          }))
          .filter((v) => !initialIds.has(v.id));
        combinedVisits = [
          ...customVisits,
          ...combinedVisits.map((v) => ({
            ...v,
            rating: v.rating ?? 0,
            tags: v.tags ?? [],
            status: v.status ?? "visited",
            area: v.area ?? "",
            visitCount: Math.max(1, v.visitCount ?? 1),
          })),
        ];
      } catch (e) {
        console.error("Failed to parse saved visits:", e);
      }
    }
    setVisits(combinedVisits);
  }, []);

  return (
    <div
      className={theme === 'light' ? 'light-theme' : ''}
      style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}
    >
      <main className={styles.main}>
        <div className={styles.description}>
          <h1 style={{ marginRight: 'auto' }}>統計ダッシュボード</h1>
          <Link href="/" style={{ marginLeft: 'auto' }}>
            &larr; マップに戻る
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: '1200px', marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <section style={{ marginBottom: '3rem' }}>
              <h2>月別訪問数</h2>
              {isClient ? <MonthlyVisitsChart visits={visits} theme={theme} /> : <p>グラフを読み込み中...</p>}
            </section>

            <section style={{ marginBottom: '3rem' }}>
              <h2>満足度分布</h2>
              {isClient ? <RatingDistributionChart visits={visits} theme={theme} /> : <p>グラフを読み込み中...</p>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
