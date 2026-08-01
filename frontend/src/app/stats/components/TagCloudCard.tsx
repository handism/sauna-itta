import { useMemo } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { SaunaVisit } from "@/components/sauna-map/types";
import { countTags } from "@/components/sauna-map/utils";
import styles from "../stats.module.css";

interface TagCloudCardProps {
  visits: SaunaVisit[];
}

export function TagCloudCard({ visits }: TagCloudCardProps) {
  const tagCounts = useMemo(
    () => countTags(visits, { excludeWishlist: true }),
    [visits],
  );

  if (tagCounts.length === 0) return null;

  const maxCount = tagCounts[0].count;

  return (
    <article className={`${styles.glassCard} ${styles.tagCloudCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <Tag size={20} className={styles.tagIcon} />
          <h2>サウナ特徴・こだわりタグ</h2>
        </div>
        <span className={styles.cardSubtitle}>全 {tagCounts.length} 種類</span>
      </div>

      {/* タグから地図側の絞り込みへ繋ぐ（?tag= は useVisitFilters が初期値として読む） */}
      <div className={styles.tagCloudList}>
        {tagCounts.map(({ name, count }) => {
          const isHigh = count >= Math.ceil(maxCount * 0.6);
          return (
            <Link
              key={name}
              href={`/?tag=${encodeURIComponent(name)}`}
              className={`${styles.tagPill} ${isHigh ? styles.tagPillPopular : ""}`}
              title={`タグ「${name}」で地図を絞り込む`}
            >
              #{name} <span className={styles.tagPillCount}>{count}</span>
            </Link>
          );
        })}
      </div>
    </article>
  );
}
