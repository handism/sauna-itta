import { Flame, CheckCircle, MapPin, Star, Calendar, Map } from "lucide-react";
import styles from '../stats.module.css';
import { VisitStats } from "@/components/sauna-map/types";

/**
 * 「2024-01-01」を「2024.01」にする。サマリーの他のカードは数値 1 つなので、
 * 日付 2 つを日単位で並べると記録期間のカードだけ 2 行に折り返して高さが揃わない。
 * 日単位の期間は title（ホバー）で補う。
 */
function toYearMonth(date: string): string {
  return date.slice(0, 7).replace("-", ".");
}

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
          <h3 id="stat-visited">行った / 行きたい</h3>
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
        {stats.prefectureCount > 0 ? (
          <p className={styles.statValue}>
            {stats.prefectureCount} <span className={styles.statUnit}>/ 47 都道府県</span>
          </p>
        ) : (
          /*
            エリアが「錦糸町」のような地名だけだと都道府県を判定できず、常に 0 になる。
            0 を大きく出すと「1 つも行っていない」と読めてしまうため、集計できない旨を伝える。
          */
          <>
            <p className={styles.statValue}>-</p>
            <p className={styles.statNote}>エリアに都道府県名を入れると集計されます</p>
          </>
        )}
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-period">
        <div className={styles.statCardHeader}>
          <Calendar size={18} className={styles.statIconMuted} />
          <h3 id="stat-period">記録期間</h3>
        </div>
        {stats.firstDate && stats.lastDate ? (
          <p
            className={styles.statValueCompact}
            title={`${stats.firstDate} 〜 ${stats.lastDate}`}
          >
            <time dateTime={stats.firstDate}>{toYearMonth(stats.firstDate)}</time>
            {" 〜 "}
            <time dateTime={stats.lastDate}>{toYearMonth(stats.lastDate)}</time>
          </p>
        ) : (
          <p className={styles.statValueCompact}>-</p>
        )}
      </article>
    </div>
  );
}
