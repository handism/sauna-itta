import { Flame, CheckCircle, MapPin, Star, Calendar, Map } from "lucide-react";
import styles from '../stats.module.css';
import { VisitStats } from "@/components/sauna-map/types";

interface SummaryGridProps {
  stats: VisitStats;
}

export function SummaryGrid({ stats }: SummaryGridProps) {
  return (
    <div className={styles.summaryGrid} role="list" aria-label="統計サマリー">
      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-total">
        <div className={styles.statCardHeader}>
          <Flame size={18} className={styles.statIconPrimary} />
          <h3 id="stat-total">登録サウナ総数</h3>
        </div>
        <p className={styles.statValue}>{stats.total} <span className={styles.statUnit}>施設</span></p>
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-visited">
        <div className={styles.statCardHeader}>
          <CheckCircle size={18} className={styles.statIconSuccess} />
          <h3 id="stat-visited">行った / イキタイ</h3>
        </div>
        <p className={styles.statValue}>
          {stats.visitedCount} <span className={styles.statUnit}>行った</span>
          <span className={styles.statSubText}> / {stats.wishlistCount} 行きたい</span>
        </p>
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-areas">
        <div className={styles.statCardHeader}>
          <MapPin size={18} className={styles.statIconInfo} />
          <h3 id="stat-areas">訪問エリア数</h3>
        </div>
        <p className={styles.statValue}>{stats.uniqueAreas} <span className={styles.statUnit}>エリア</span></p>
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-rating">
        <div className={styles.statCardHeader}>
          <Star size={18} className={styles.statIconWarning} />
          <h3 id="stat-rating">平均満足度</h3>
        </div>
        <p className={styles.statValue}>
          {stats.avgRating > 0 ? `${stats.avgRating}` : '-'}
          {stats.avgRating > 0 && <span className={styles.statUnit}> / 5.0</span>}
        </p>
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-prefectures">
        <div className={styles.statCardHeader}>
          <Map size={18} className={styles.statIconAccent} />
          <h3 id="stat-prefectures">都道府県制覇</h3>
        </div>
        <p className={styles.statValue}>
          {stats.prefectureCount} <span className={styles.statUnit}>/ 47 都道府県</span>
        </p>
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-period">
        <div className={styles.statCardHeader}>
          <Calendar size={18} className={styles.statIconMuted} />
          <h3 id="stat-period">記録期間</h3>
        </div>
        <p className={styles.statValueCompact}>
          {stats.firstDate && stats.lastDate ? `${stats.firstDate} 〜 ${stats.lastDate}` : '-'}
        </p>
      </article>
    </div>
  );
}
