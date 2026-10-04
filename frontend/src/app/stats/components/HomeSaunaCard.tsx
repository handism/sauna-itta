import Link from "next/link";
import { useMemo } from "react";
import { Flame, Calendar, Award, MapPin } from "lucide-react";
import {
  formatShortDate,
  getVisitHistoryEntries,
  RankedVisit,
  REPEAT_VISIT_MIN_COUNT,
} from "@/components/sauna-map/utils";
import styles from "../stats.module.css";

interface HomeSaunaCardProps {
  /** 訪問回数順に並んだ訪問済みの記録。useStatsData が算出したものを渡すこと */
  ranked: RankedVisit[];
}

export function HomeSaunaCard({ ranked }: HomeSaunaCardProps) {
  const homeSaunaInfo = useMemo(() => {
    if (ranked.length === 0) return null;

    const [{ visit: saunaObj, count: maxCount }] = ranked;
    if (maxCount === 0) return null;

    const totalVisitEntries = ranked.reduce((sum, entry) => sum + entry.count, 0);

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
  }, [ranked]);

  if (!homeSaunaInfo) {
    return null;
  }

  // どの施設も 1 回ずつのときに 1 位を「ホーム」と呼んでも、五十音順で先頭の施設が出るだけになる。
  // カードごと消すと TOP 5 と並ぶ 2 列の片側が空くため、条件を伝える案内に置き換える。
  if (homeSaunaInfo.count < REPEAT_VISIT_MIN_COUNT) {
    return (
      <article className={`${styles.glassCard} ${styles.homeSaunaCard}`}>
        <div className={styles.homeSaunaHeader}>
          <div className={styles.homeSaunaBadge}>
            <Flame size={18} />
            <span>MY HOME SAUNA</span>
          </div>
        </div>
        <div className={styles.homeSaunaPending}>
          <Flame size={40} className={styles.homeSaunaPendingIcon} aria-hidden="true" />
          <h2 className={styles.homeSaunaPendingTitle}>まだホームサウナはありません</h2>
          <p className={styles.homeSaunaPendingText}>
            同じ施設に{REPEAT_VISIT_MIN_COUNT}回以上行くと、いちばん通っている施設がここに表示されます。
          </p>
        </div>
      </article>
    );
  }

  const { sauna, count, firstDate, lastDate, sharePercentage } = homeSaunaInfo;

  return (
    <article className={`${styles.glassCard} ${styles.homeSaunaCard}`}>
      <div className={styles.homeSaunaHeader}>
        <div className={styles.homeSaunaBadge}>
          <Flame size={18} className={styles.flameIcon} />
          <span>MY HOME SAUNA</span>
        </div>
        <div className={styles.homeSaunaHeaderActions}>
          <span className={styles.homeSaunaCount}>計 {count} 回訪問</span>
          <Link
            href={`/?id=${sauna.id}`}
            className={styles.mapJumpLink}
            title={`${sauna.name}を地図で見る`}
            aria-label={`${sauna.name}を地図で見る`}
          >
            <MapPin size={13} /> <span>地図で見る</span>
          </Link>
        </div>
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

      {/*
       * 右隣の TOP 5 と高さが揃うため、カードの中ほどが大きく空く。
       * 最新の感想を添えて、日付の行はカードの下端に寄せる（.homeSaunaFooter の margin-top: auto）。
       */}
      {sauna.comment && (
        <blockquote className={styles.homeSaunaComment}>
          <p>{sauna.comment}</p>
        </blockquote>
      )}

      <div className={styles.homeSaunaFooter}>
        <div className={styles.homeSaunaMetaItem}>
          <Calendar size={14} />
          <span>
            初訪問: <time dateTime={firstDate}>{formatShortDate(firstDate)}</time>
          </span>
        </div>
        <div className={styles.homeSaunaMetaItem}>
          <Award size={14} />
          <span>
            最新訪問: <time dateTime={lastDate}>{formatShortDate(lastDate)}</time>
          </span>
        </div>
      </div>
    </article>
  );
}
