import styles from '../stats.module.css';

interface PrefectureSectionProps {
  prefectures: string[];
  count: number;
}

export function PrefectureSection({ prefectures, count }: PrefectureSectionProps) {
  if (count <= 0) return null;

  return (
    <section className={styles.prefectureSection}>
      <h2>都道府県制覇</h2>
      <div className={styles.badgeList}>
        {prefectures.map((pref) => (
          <span key={pref} className={styles.prefectureBadge}>
            {pref}
          </span>
        ))}
      </div>
    </section>
  );
}
