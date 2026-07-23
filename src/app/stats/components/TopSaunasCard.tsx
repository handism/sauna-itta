import { useMemo } from "react";
import { Trophy, Star, MapPin } from "lucide-react";
import { SaunaVisit } from "@/components/sauna-map/types";
import styles from "../stats.module.css";

interface TopSaunasCardProps {
  visits: SaunaVisit[];
}

export function TopSaunasCard({ visits }: TopSaunasCardProps) {
  const topSaunas = useMemo(() => {
    const visitedList = visits.filter((v) => v.status !== "wishlist");

    const sorted = [...visitedList].map((sauna) => {
      const count = (sauna.history && sauna.history.length > 0)
        ? sauna.history.length
        : (sauna.visitCount ?? 1);
      return {
        sauna,
        count,
      };
    });

    sorted.sort((a, b) => b.count - a.count);
    return sorted.slice(0, 5);
  }, [visits]);

  if (topSaunas.length === 0) return null;

  const maxVisits = topSaunas[0]?.count || 1;

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return styles.rankGold;
    if (index === 1) return styles.rankSilver;
    if (index === 2) return styles.rankBronze;
    return styles.rankNormal;
  };

  return (
    <article className={`${styles.glassCard} ${styles.topSaunasCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <Trophy size={20} className={styles.trophyIcon} />
          <h2>よく行く施設 TOP 5</h2>
        </div>
        <span className={styles.cardSubtitle}>訪問回数順</span>
      </div>

      <div className={styles.topSaunasList}>
        {topSaunas.map(({ sauna, count }, index) => {
          const percentage = Math.round((count / maxVisits) * 100);

          return (
            <div key={sauna.id} className={styles.topSaunaRow}>
              <div className={`${styles.rankBadge} ${getRankBadgeClass(index)}`}>
                {index + 1}
              </div>

              <div className={styles.topSaunaDetails}>
                <div className={styles.topSaunaNameRow}>
                  <span className={styles.topSaunaName}>{sauna.name}</span>
                  <span className={styles.topSaunaCount}>{count} 回</span>
                </div>

                <div className={styles.topSaunaMetaRow}>
                  {sauna.area && (
                    <span className={styles.topSaunaMeta}>
                      <MapPin size={12} /> {sauna.area}
                    </span>
                  )}
                  {sauna.rating && sauna.rating > 0 ? (
                    <span className={styles.topSaunaRating}>
                      <Star size={12} fill="currentColor" /> {sauna.rating}
                    </span>
                  ) : null}
                </div>

                <div className={styles.topSaunaBarTrack}>
                  <div
                    className={styles.topSaunaBarFill}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
