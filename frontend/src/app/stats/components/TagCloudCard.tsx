import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";
import { SaunaVisit } from "@/components/sauna-map/types";
import { countTags, cx } from "@/components/sauna-map/utils";
import styles from "../stats.module.css";

/**
 * 初期表示するタグの数。全種類（100 件を超えることもある）を並べると同じ大きさのチップの壁になり、
 * よく使うタグが埋もれるため、件数の多い順に先頭だけを出して残りは「すべて表示」で開く。
 */
export const TAG_CLOUD_INITIAL_COUNT = 24;

interface TagCloudCardProps {
  visits: SaunaVisit[];
}

export function TagCloudCard({ visits }: TagCloudCardProps) {
  const tagCounts = useMemo(
    () => countTags(visits, { excludeWishlist: true }),
    [visits],
  );

  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  if (tagCounts.length === 0) return null;

  const maxCount = tagCounts[0].count;
  const hiddenCount = Math.max(tagCounts.length - TAG_CLOUD_INITIAL_COUNT, 0);
  const visibleTags = expanded ? tagCounts : tagCounts.slice(0, TAG_CLOUD_INITIAL_COUNT);

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
      <div id={listId} className={styles.tagCloudList}>
        {visibleTags.map(({ name, count }) => {
          const isHigh = count >= Math.ceil(maxCount * 0.6);
          // 1 回しか付いていないタグは控えめにして、よく使うタグとの強弱を付ける
          const isRare = !isHigh && count === 1;
          return (
            <Link
              key={name}
              href={`/?tag=${encodeURIComponent(name)}`}
              className={cx(styles.tagPill, isHigh && styles.tagPillPopular, isRare && styles.tagPillRare)}
              title={`タグ「${name}」で地図を絞り込む`}
            >
              #{name} <span className={styles.tagPillCount}>{count}</span>
            </Link>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.tagCloudToggle}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} aria-hidden="true" /> よく使うタグだけ表示
            </>
          ) : (
            <>
              <ChevronDown size={14} aria-hidden="true" /> すべて表示（残り {hiddenCount} 種類）
            </>
          )}
        </button>
      )}
    </article>
  );
}
