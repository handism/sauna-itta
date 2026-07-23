import styles from '../stats.module.css';
import { VisitStats } from "@/components/sauna-map/types";

interface SummaryGridProps {
  stats: VisitStats;
}

export function SummaryGrid({ stats }: SummaryGridProps) {
  return (
    <div className={styles.summaryGrid} role="list" aria-label="統計サマリー">
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-total">
        <h3 id="stat-total">合計サウナ数</h3>
        <p>{stats.total}</p>
      </article>
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-visited">
        <h3 id="stat-visited">行った / 行きたい</h3>
        <p>{stats.visitedCount} / {stats.wishlistCount}</p>
      </article>
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-areas">
        <h3 id="stat-areas">記録エリア数</h3>
        <p>{stats.uniqueAreas}</p>
      </article>
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-rating">
        <h3 id="stat-rating">平均満足度</h3>
        <p>{stats.avgRating > 0 ? `${stats.avgRating} / 5` : '-'}</p>
      </article>
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-period">
        <h3 id="stat-period">記録期間</h3>
        <p>{stats.firstDate && stats.lastDate ? `${stats.firstDate} 〜 ${stats.lastDate}` : '-'}</p>
      </article>
      <article className={styles.statCard} role="listitem" aria-labelledby="stat-prefectures">
        <h3 id="stat-prefectures">都道府県制覇</h3>
        <p>{stats.prefectureCount} / 47</p>
      </article>
    </div>
  );
}
