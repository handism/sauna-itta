import { useMemo } from "react";
import { Flame, Calendar, Award, MapPin } from "lucide-react";
import { SaunaVisit } from "@/components/sauna-map/types";
import { getVisitCount, getVisitHistoryEntries } from "@/components/sauna-map/utils";
import styles from "../stats.module.css";

interface HomeSaunaCardProps {
  visits: SaunaVisit[];
}

export function HomeSaunaCard({ visits }: HomeSaunaCardProps) {
  const homeSaunaInfo = useMemo(() => {
    const visitedList = visits.filter((v) => v.status !== "wishlist");
    if (visitedList.length === 0) return null;

    // 訪問回数は地図側と同じ getVisitCount を使い、分子・分母の基準を揃える
    let topSauna: SaunaVisit | null = null;
    let maxCount = 0;
    let totalVisitEntries = 0;

    for (const sauna of visitedList) {
      const count = getVisitCount(sauna);
      totalVisitEntries += count;

      if (count > maxCount) {
        maxCount = count;
        topSauna = sauna;
      }
    }

    if (!topSauna || maxCount === 0) return null;

    const saunaObj = topSauna;

    // Dates for this sauna
    const dates = getVisitHistoryEntries(saunaObj)
      .map((entry) => entry.date)
      .filter(Boolean)
      .sort();

    const firstDate = dates[0] || saunaObj.date || "-";
    const lastDate = dates[dates.length - 1] || saunaObj.date || "-";
    const sharePercentage = totalVisitEntries > 0
      ? Math.round((maxCount / totalVisitEntries) * 100)
      : 0;

    return {
      sauna: saunaObj,
      count: maxCount,
      firstDate,
      lastDate,
      sharePercentage,
    };
  }, [visits]);

  if (!homeSaunaInfo) {
    return null;
  }

  const { sauna, count, firstDate, lastDate, sharePercentage } = homeSaunaInfo;

  return (
    <article className={`${styles.glassCard} ${styles.homeSaunaCard}`}>
      <div className={styles.homeSaunaHeader}>
        <div className={styles.homeSaunaBadge}>
          <Flame size={18} className={styles.flameIcon} />
          <span>MY HOME SAUNA</span>
        </div>
        <span className={styles.homeSaunaCount}>計 {count} 回訪問</span>
      </div>

      <div className={styles.homeSaunaMain}>
        <h2 className={styles.homeSaunaTitle}>{sauna.name}</h2>
        {sauna.area && (
          <p className={styles.homeSaunaArea}>
            <MapPin size={14} />
            <span>{sauna.area}</span>
          </p>
        )}
      </div>

      <div className={styles.homeSaunaProgressSection}>
        <div className={styles.progressLabelRow}>
          <span>全訪問記録に占める割合</span>
          <span className={styles.progressValue}>{sharePercentage}%</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${Math.min(sharePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className={styles.homeSaunaFooter}>
        <div className={styles.homeSaunaMetaItem}>
          <Calendar size={14} />
          <span>初訪問: {firstDate}</span>
        </div>
        <div className={styles.homeSaunaMetaItem}>
          <Award size={14} />
          <span>最新訪問: {lastDate}</span>
        </div>
      </div>
    </article>
  );
}
