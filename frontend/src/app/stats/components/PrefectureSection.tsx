import {
  PREFECTURE_REGIONS,
  PREFECTURE_TILES,
  PREFECTURES,
  splitPrefectureSuffix,
} from '@/components/sauna-map/utils/geo';
import { cx } from '@/components/sauna-map/utils/classNames';
import styles from '../stats.module.css';

interface PrefectureSectionProps {
  prefectures: string[];
  count: number;
}

/**
 * 都道府県の制覇状況。行った都道府県だけを並べると「あとどこが残っているか」が読めないため、
 * 47 都道府県を北から南の順（PREFECTURES）にすべて並べ、行ったところだけを塗る。
 * 一覧に無い名前（エリアの表記揺れ等）も、行ったものとして末尾に残す（数と並びを食い違わせない）。
 *
 * 広い画面では同じ一覧を日本地図の形（PREFECTURE_TILES）に並べ、地方ごとの制覇数を添える。
 * 47 個のチップを横に流すだけだと、全国を回るほど同じ色の壁になってどこが残っているか読めない。
 * 狭い画面はマスに県名が収まらないため、従来のチップの並びにする（CSS で切り替え、読み上げの順は同じ）。
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
      <div className={styles.prefectureBody}>
        <ul
          className={cx(styles.badgeList, styles.prefectureTiles)}
          aria-label={`${total}都道府県のうち${visitedKnown}か所を制覇`}
        >
          {PREFECTURES.map((pref) => {
            const { short, suffix } = splitPrefectureSuffix(pref);
            const tile = PREFECTURE_TILES[pref];
            const unvisited = !visited.has(pref);
            return (
              <li
                key={pref}
                className={cx(styles.prefectureBadge, unvisited && styles.prefectureBadgeUnvisited)}
                // 地図の形の配置（広い画面だけ grid になり効く。チップの並びでは無視される）
                style={{ gridColumn: tile.col + 1, gridRow: tile.row + 1 }}
                title={pref}
              >
                {short}
                <span className={styles.prefectureSuffix}>{suffix}</span>
                {unvisited && <span className="sr-only">（未訪問）</span>}
              </li>
            );
          })}
          {extras.map((pref) => (
            <li key={pref} className={cx(styles.prefectureBadge, styles.prefectureBadgeExtra)}>
              {pref}
            </li>
          ))}
        </ul>
        <ul className={styles.regionList} aria-label="地方ごとの制覇数">
          {PREFECTURE_REGIONS.map((region) => {
            const done = region.prefectures.filter((pref) => visited.has(pref)).length;
            const regionTotal = region.prefectures.length;
            return (
              <li key={region.name} className={styles.regionRow}>
                <span className={styles.regionName}>{region.name}</span>
                <span className={styles.regionBar} aria-hidden="true">
                  <span
                    className={cx(styles.regionBarFill, done === regionTotal && styles.regionBarComplete)}
                    style={{ width: `${(done / regionTotal) * 100}%` }}
                  />
                </span>
                <span className={styles.regionCount}>
                  {done} / {regionTotal}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
