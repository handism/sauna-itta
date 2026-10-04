import { PREFECTURES } from '@/components/sauna-map/utils/geo';
import styles from '../stats.module.css';

interface PrefectureSectionProps {
  prefectures: string[];
  count: number;
}

/**
 * 都道府県の制覇状況。行った都道府県だけを並べると「あとどこが残っているか」が読めないため、
 * 47 都道府県を北から南の順（PREFECTURES）にすべて並べ、行ったところだけを塗る。
 * 一覧に無い名前（エリアの表記揺れ等）も、行ったものとして末尾に残す（数と並びを食い違わせない）。
 */
export function PrefectureSection({ prefectures, count }: PrefectureSectionProps) {
  if (count <= 0) return null;

  const visited = new Set(prefectures);
  const known = new Set<string>(PREFECTURES);
  const extras = prefectures.filter((pref) => !known.has(pref));
  const total = PREFECTURES.length;
  const visitedKnown = PREFECTURES.filter((pref) => visited.has(pref)).length;
  const percent = Math.round((visitedKnown / total) * 100);

  return (
    <section className={styles.prefectureSection} aria-labelledby="prefecture-section-title">
      <div className={styles.prefectureHeader}>
        <h2 id="prefecture-section-title">都道府県制覇</h2>
        <span className={styles.prefectureProgressLabel}>
          <strong>{visitedKnown}</strong> / {total}
        </span>
      </div>
      <div
        className={styles.prefectureProgress}
        role="progressbar"
        aria-label="都道府県の制覇率"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={visitedKnown}
        aria-valuetext={`${total}都道府県中${visitedKnown}（${percent}%）`}
      >
        <span className={styles.prefectureProgressBar} style={{ width: `${percent}%` }} />
      </div>
      <ul className={styles.badgeList} aria-label={`${total}都道府県のうち${visitedKnown}か所を制覇`}>
        {PREFECTURES.map((pref) =>
          visited.has(pref) ? (
            <li key={pref} className={styles.prefectureBadge}>
              {pref}
            </li>
          ) : (
            <li key={pref} className={`${styles.prefectureBadge} ${styles.prefectureBadgeUnvisited}`}>
              {pref}
              <span className="sr-only">（未訪問）</span>
            </li>
          ),
        )}
        {extras.map((pref) => (
          <li key={pref} className={styles.prefectureBadge}>
            {pref}
          </li>
        ))}
      </ul>
    </section>
  );
}
