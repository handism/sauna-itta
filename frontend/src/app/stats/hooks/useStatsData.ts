import { useEffect, useMemo, useState } from 'react';
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  flattenVisitHistory,
  calculateStats,
  rankVisitsByCount,
  toDateString,
} from "@/components/sauna-map/utils";
import { useTheme } from "@/components/sauna-map/hooks/useTheme";
import { getVisitRepository } from "@/components/sauna-map/repositories";

export function useStatsData() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const repository = useMemo(() => getVisitRepository(), []);

  // 統計ページは静的プリレンダリングされるため、保存値の読み取りはマウント後まで遅らせる。
  // 切り替えロジック自体は地図側と共通の useTheme に集約している。
  const { theme, toggleTheme, syncFromStorage } = useTheme({ deferred: true });

  useEffect(() => {
    // To satisfy react-hooks/set-state-in-effect and avoid synchronous cascading renders
    const timer = setTimeout(async () => {
      syncFromStorage();
      setDate(new Date());
      try {
        const session = await repository.getSession();
        setAuthenticated(session.authenticated);
        setCsrfToken(session.csrfToken);
        if (session.authenticated) setVisits(await repository.list());
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "記録の読み込みに失敗しました。");
      } finally {
        setMounted(true);
      }
    }, 0);

    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, [repository, syncFromStorage]);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  /**
   * 訪問済みの履歴エントリ。カレンダー・月別グラフ・満足度分布はいずれも
   * これだけを見るため、ここで一度だけ平坦化して各コンポーネントへ渡す。
   */
  const visitedEntries = useMemo(
    () => flattenVisitHistory(visits).filter((entry) => entry.status === "visited"),
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
