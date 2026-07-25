import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import styles from '../stats.module.css';

interface StatsHeaderProps {
  /** マウント前のスケルトン表示では戻るリンクを出さない */
  showBackLink?: boolean;
}

export function StatsHeader({ showBackLink = true }: StatsHeaderProps) {
  return (
    <header className={styles.description}>
      <div>
        <p className={styles.eyebrow}>
          <Sparkles size={14} className={styles.sparkleIcon} />
          Sauna Itta Analytics
        </p>
        <h1>統計ダッシュボード</h1>
      </div>
      {showBackLink && (
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>マップに戻る</span>
        </Link>
      )}
    </header>
  );
}
