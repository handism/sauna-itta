import styles from '../stats.module.css';
import { VisitStats } from "@/components/sauna-map/types";

interface SummaryGridProps {
  stats: VisitStats;
}

export function SummaryGrid({ stats }: SummaryGridProps) {
  return (
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
  );
}
