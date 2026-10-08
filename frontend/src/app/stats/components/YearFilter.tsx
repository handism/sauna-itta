import styles from '../stats.module.css';

interface YearFilterProps {
  /** 訪問がある年（新しい順） */
  years: readonly string[];
  /** 選んでいる年。null は全期間 */
  year: string | null;
  onChange: (year: string | null) => void;
}

/**
 * 集計する期間の切り替え。全期間と年ごとの排他のトグルなので、tablist ではなく
 * role="group" + aria-pressed で公開する（対応する tabpanel が無いため）。
 * 年が 1 つしか無いときは「すべて」と同じ結果になるため描画しない。
 */
export function YearFilter({ years, year, onChange }: YearFilterProps) {
  if (years.length < 2) return null;

  const options: { value: string | null; label: string }[] = [
    { value: null, label: 'すべて' },
    ...years.map((y) => ({ value: y, label: `${y}年` })),
  ];

  return (
    <div className={styles.yearFilter} role="group" aria-label="集計する期間">
      {options.map(({ value, label }) => (
        <button
          key={label}
          type="button"
          className={styles.yearFilterBtn}
          aria-pressed={year === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
