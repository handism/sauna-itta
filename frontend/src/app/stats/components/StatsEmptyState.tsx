import Link from 'next/link';
import { MapPinPlus, Footprints } from 'lucide-react';
import styles from '../stats-shell.module.css';

interface StatsEmptyStateProps {
  /**
   * none: 記録が 1 件も無い。
   * wishlistOnly: 「行きたい」だけがある。グラフ・ランキング・カレンダーは行った記録だけから
   * 集計するため、ほぼ空の画面になる理由と、統計が出るまでの手順を伝える。
   */
  variant: 'none' | 'wishlistOnly';
  wishlistCount?: number;
}

/**
 * 統計画面の空状態。地図側の一覧の空状態（VisitListEmpty）と同じ
 * 「アイコン＋見出し＋説明＋操作」の構成に揃える。
 */
export function StatsEmptyState({ variant, wishlistCount = 0 }: StatsEmptyStateProps) {
  const isNone = variant === 'none';

  return (
    <section className={styles.emptyState} aria-labelledby="stats-empty-title">
      <span className={styles.emptyStateIcon} aria-hidden="true">
        {isNone ? <MapPinPlus size={28} /> : <Footprints size={28} />}
      </span>
      <h2 className={styles.emptyStateTitle} id="stats-empty-title">
        {isNone ? 'まだ記録がありません' : '行ったサウナを記録すると統計が表示されます'}
      </h2>
      <p className={styles.emptyStateBody}>
        {isNone
          ? '地図からサウナを登録すると、月別の訪問数や満足度、よく行く施設がここに表示されます。'
          : `「行きたい」の ${wishlistCount} 件は登録済みです。訪問したら記録を「行った」に切り替えると、月別の訪問数や満足度のグラフが表示されます。`}
      </p>
      <Link href="/" className={styles.backLink}>
        {isNone ? 'マップでサウナを登録する' : 'マップで記録を開く'}
      </Link>
    </section>
  );
}
