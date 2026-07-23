import styles from '../stats.module.css';

interface PrefectureSectionProps {
  prefectures: string[];
  count: number;
}

export function PrefectureSection({ prefectures, count }: PrefectureSectionProps) {
  if (count <= 0) return null;

  return (
    <section className={styles.prefectureSection} aria-labelledby="prefecture-section-title">
      <h2 id="prefecture-section-title">都道府県制覇</h2>
      <ul className={styles.badgeList} aria-label={`制覇した${count}都道府県`}>
        {prefectures.map((pref) => (
          <li key={pref} className={styles.prefectureBadge}>
            {pref}
          </li>
        ))}
      </ul>
    </section>
  );
}
