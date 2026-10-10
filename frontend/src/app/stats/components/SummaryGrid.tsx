import { Flame, CheckCircle, MapPin, Star, Calendar, Map } from "lucide-react";
import styles from '../stats.module.css';
import { VisitStats } from "@/components/sauna-map/types";

/**
 * 「2024-01-01」を「2024.01」にする。記録期間の範囲は補足の小さな文字で出すため、
 * 日単位で並べると折り返してカードの高さが揃わない。日単位の期間は title（ホバー）で補う。
 */
function toYearMonth(date: string): string {
  return date.slice(0, 7).replace("-", ".");
}

/**
 * 記録期間の長さを「N ヶ月」「N 年 M ヶ月」で返す（始まりと終わりの月を含めて数える）。
 * 他のカードと同じ「大きな数値＋単位」の形にそろえ、年月の範囲は下の補足に回す。
 */
export function formatPeriodLength(firstDate: string, lastDate: string): { value: string; unit: string }[] {
  const [y1, m1] = firstDate.split("-").map(Number);
  const [y2, m2] = lastDate.split("-").map(Number);
  const months = Math.max(1, (y2 - y1) * 12 + (m2 - m1) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return [{ value: String(rest), unit: "ヶ月" }];
  if (rest === 0) return [{ value: String(years), unit: "年" }];
  return [
    { value: String(years), unit: "年" },
    { value: String(rest), unit: "ヶ月" },
  ];
}

interface SummaryGridProps {
  stats: VisitStats;
}

export function SummaryGrid({ stats }: SummaryGridProps) {
  return (
    <div className={styles.summaryGrid} role="list" aria-label="統計サマリー">
      {/*
        先頭は「何回サウナに行ったか」。登録施設数は「行った / 行きたい」の合計と同じ情報なので出さない。
      */}
      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-total-visits">
        <div className={styles.statCardHeader}>
          <Flame size={18} className={styles.statIconPrimary} />
          <h3 id="stat-total-visits">延べ訪問回数</h3>
        </div>
        <p className={styles.statValue}>{stats.totalVisits} <span className={styles.statUnit}>回</span></p>
        {/*
          どの施設も 1 回ずつだと、延べ回数と隣の「行った施設」が同じ数字で並ぶだけになる。
          再訪した施設の数を添えて、通い方の違いが読めるようにする。
        */}
        {stats.totalVisits > 0 && (
          <p className={styles.statNote}>
            {stats.repeatVisitedCount > 0
              ? `うち再訪 ${stats.repeatVisitedCount} 施設`
              : "どの施設も 1 回ずつ"}
          </p>
        )}
      </article>

      <article className={`${styles.glassCard} ${styles.statCard}`} role="listitem" aria-labelledby="stat-visited">
        <div className={styles.statCardHeader}>
          <CheckCircle size={18} className={styles.statIconSuccess} />
          {/*
            「施設数 97 行った / 2 行きたい」では 97 が何の数かを読み取りにくいため、
            見出しで行った施設の数だと示し、行きたいの件数は補足に回す。
          */}
          <h3 id="stat-visited">行った施設</h3>
        </div>
        <p className={styles.statValue}>
          {stats.visitedCount} <span className={styles.statUnit}>施設</span>
        </p>
        {stats.wishlistCount > 0 && (
          <p className={styles.statNote}>ほかに行きたい {stats.wishlistCount} 件</p>
        )}
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
          <>
            <p className={styles.statValue}>
              {formatPeriodLength(stats.firstDate, stats.lastDate).map(({ value, unit }) => (
                <span key={unit}>
                  {value}
                  <span className={styles.statUnit}>{unit}</span>{" "}
                </span>
              ))}
            </p>
            <p className={styles.statNote} title={`${stats.firstDate} 〜 ${stats.lastDate}`}>
              <time dateTime={stats.firstDate}>{toYearMonth(stats.firstDate)}</time>
              {" 〜 "}
              <time dateTime={stats.lastDate}>{toYearMonth(stats.lastDate)}</time>
            </p>
          </>
        ) : (
          <p className={styles.statValue}>-</p>
        )}
      </article>
    </div>
  );
}
