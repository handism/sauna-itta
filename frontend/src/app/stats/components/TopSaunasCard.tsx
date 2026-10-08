import Link from "next/link";
import { useMemo } from "react";
import { Trophy, Star, MapPin } from "lucide-react";
import {
  getRepeatVisits,
  RankedVisit,
  REPEAT_VISIT_MIN_COUNT,
  sortRankedByRating,
} from "@/components/sauna-map/utils";
import styles from "../stats.module.css";

interface TopSaunasCardProps {
  /** 訪問回数順に並んだ訪問済みの記録。useStatsData が算出したものを渡すこと */
  ranked: RankedVisit[];
}

export function TopSaunasCard({ ranked }: TopSaunasCardProps) {
  // 2 回以上行った施設があれば訪問回数順に、それだけを並べる（1 回の施設で 5 枠を埋めると、
  // 全行「1 回」・バーが満タンになり順位の意味が無くなる）。1 つも無ければ満足度順に切り替える。
  const { topSaunas, byRating } = useMemo(() => {
    const repeatVisits = getRepeatVisits(ranked);
    if (repeatVisits.length > 0) {
      return { topSaunas: repeatVisits.slice(0, 5), byRating: false };
    }
    return { topSaunas: sortRankedByRating(ranked).slice(0, 5), byRating: true };
  }, [ranked]);

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
          <h2>{byRating ? "満足度の高い施設 TOP 5" : "よく行く施設 TOP 5"}</h2>
        </div>
        <span className={styles.cardSubtitle}>
          {byRating ? `${REPEAT_VISIT_MIN_COUNT}回以上行った施設がまだ無いため満足度順` : "訪問回数順"}
        </span>
      </div>

      <div className={styles.topSaunasList}>
        {topSaunas.map(({ visit: sauna, count }, index) => {
          const percentage = Math.round((count / maxVisits) * 100);

          return (
            <div key={sauna.id} className={styles.topSaunaRow}>
              <div className={`${styles.rankBadge} ${getRankBadgeClass(index)}`}>
                {index + 1}
              </div>

              <div className={styles.topSaunaDetails}>
                <div className={styles.topSaunaNameRow}>
                  <span className={styles.topSaunaName}>{sauna.name}</span>
                  <div className={styles.topSaunaActions}>
                    {!byRating && <span className={styles.topSaunaCount}>{count} 回</span>}
                    <Link
                      href={`/?id=${sauna.id}`}
                      className={`${styles.mapJumpLink} ${styles.mapJumpLinkQuiet}`}
                      title={`${sauna.name}を地図で見る`}
                      aria-label={`${sauna.name}を地図で見る`}
                    >
                      <MapPin size={12} /> <span className={styles.mapJumpLabel}>地図で見る</span>
                    </Link>
                  </div>
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

                {/* 満足度は 5 段階で上位が同点に並びやすく、バーが揃って満タンになるだけなので出さない */}
                {!byRating && (
                  <div className={styles.topSaunaBarTrack}>
                    <div
                      className={styles.topSaunaBarFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
