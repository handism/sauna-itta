import Link from 'next/link';
import { ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react';
import styles from '../stats.module.css';

interface StatsHeaderProps {
  /** マウント前のスケルトン表示では戻るリンクとテーマ切り替えを出さない */
  showBackLink?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export function StatsHeader({ showBackLink = true, theme, onToggleTheme }: StatsHeaderProps) {
  const themeLabel = theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

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
        <div className={styles.headerActions}>
          {/* 統計ページを直接開いた場合でもテーマを切り替えられるようにする */}
          {theme && onToggleTheme && (
            <button
              type="button"
              className={styles.themeToggle}
              onClick={onToggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>マップに戻る</span>
          </Link>
        </div>
      )}
    </header>
  );
}
