import { useEffect, useMemo, useState } from "react";
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  flattenVisitHistory,
  calculateStats,
  rankVisitsByCount,
  toDateString,
} from "@/components/sauna-map/utils";
import { useTheme } from "@/components/sauna-map/hooks/useTheme";
import { useVisitSession } from "@/components/sauna-map/hooks/useVisitSession";
import { getVisitRepository } from "@/components/sauna-map/repositories";

export function useStatsData() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  // テーマと日付の初期化が済んだか。date は利用者がカレンダーで選択を外すと null に戻るため、
  // マウント済みの判定には使えない
  const [initialized, setInitialized] = useState(false);
  const [repository] = useState(() => getVisitRepository());
  // セッション確認と記録の読み込みは地図側と同じ手順を共有する
  const { loading, authenticated, csrfToken, loadError } = useVisitSession(repository, {
    onVisitsLoaded: setVisits,
  });

  // 統計ページは静的プリレンダリングされるため、保存値の読み取りはマウント後まで遅らせる。
  // 切り替えロジック自体は地図側と共通の useTheme に集約している。
  const { theme, toggleTheme, syncFromStorage } = useTheme({ deferred: true });

  useEffect(() => {
    // エフェクト本体で同期的に setState しない（react-hooks/set-state-in-effect）
    const timer = setTimeout(() => {
      syncFromStorage();
      setDate(new Date());
      setInitialized(true);
    }, 0);

    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, [syncFromStorage]);

  const mounted = initialized && !loading;

  const stats = useMemo(() => calculateStats(visits), [visits]);

  /**
   * 訪問済みの履歴エントリ。カレンダー・月別グラフ・満足度分布はいずれも
   * これだけを見るため、ここで一度だけ平坦化して各コンポーネントへ渡す。
   */
  const visitedEntries = useMemo(
    () => flattenVisitHistory(visits, "visited"),
    [visits],
  );

  /**
   * 訪問回数の多い順に並べた訪問済みの記録。
   * 「MY HOME SAUNA」と「よく行く施設 TOP 5」は同じ順位を指す必要があるうえ、
   * カードごとに rankVisitsByCount() を呼ぶと同じ絞り込みと並べ替えを繰り返すため、
   * ここで一度だけ算出して各カードへ渡す。
   */
  const rankedVisits = useMemo(() => rankVisitsByCount(visits), [visits]);

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    const dateCache = new Map<string, string>();

    visitedEntries.forEach((entry) => {
      let dateStr = dateCache.get(entry.date);
      if (!dateStr) {
        dateStr = toDateString(entry.date);
        dateCache.set(entry.date, dateStr);
      }
      dates.set(dateStr, (dates.get(dateStr) ?? 0) + 1);
    });
    return dates;
  }, [visitedEntries]);

  return {
    visits,
    theme,
    toggleTheme,
    date,
    setDate,
    mounted,
    authenticated,
    csrfToken,
    loadError,
    dataSource: repository.dataSource,
    stats,
    visitedEntries,
    rankedVisits,
    visitDates,
  };
}
