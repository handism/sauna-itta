import { useMemo } from "react";
import { Tag } from "lucide-react";
import { SaunaVisit } from "@/components/sauna-map/types";
import styles from "../stats.module.css";

interface TagCloudCardProps {
  visits: SaunaVisit[];
}

export function TagCloudCard({ visits }: TagCloudCardProps) {
  const tagCounts = useMemo(() => {
    const visitedList = visits.filter((v) => v.status !== "wishlist");
    const counts: { [tag: string]: number } = {};

    visitedList.forEach((sauna) => {
      if (sauna.tags && sauna.tags.length > 0) {
        sauna.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

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

      <div className={styles.tagCloudList}>
        {tagCounts.map(({ name, count }) => {
          const isHigh = count >= Math.ceil(maxCount * 0.6);
          return (
            <span
              key={name}
              className={`${styles.tagPill} ${isHigh ? styles.tagPillPopular : ""}`}
            >
              #{name} <span className={styles.tagPillCount}>{count}</span>
            </span>
          );
        })}
      </div>
    </article>
  );
}
