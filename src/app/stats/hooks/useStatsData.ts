import { useEffect, useMemo, useState } from 'react';
import { SaunaVisit } from "@/components/sauna-map/types";
import { flattenVisitHistory, getInitialVisits, calculateStats } from "@/components/sauna-map/utils";
import { useTheme } from "@/components/sauna-map/hooks/useTheme";

export function useStatsData() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // 統計ページは静的プリレンダリングされるため、保存値の読み取りはマウント後まで遅らせる。
  // 切り替えロジック自体は地図側と共通の useTheme に集約している。
  const { theme, toggleTheme, syncFromStorage } = useTheme({ deferred: true });

  useEffect(() => {
    // To satisfy react-hooks/set-state-in-effect and avoid synchronous cascading renders
    const timer = setTimeout(() => {
      setMounted(true);
      setVisits(getInitialVisits());
      syncFromStorage();
      setDate(new Date());
    }, 0);

    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, [syncFromStorage]);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  /**
   * 訪問済みの履歴エントリ。カレンダー・月別グラフ・満足度分布はいずれも
   * これだけを見るため、ここで一度だけ平坦化して各コンポーネントへ渡す。
   */
  const visitedEntries = useMemo(
    () => flattenVisitHistory(visits).filter((entry) => entry.status === "visited"),
    [visits],
  );

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    const dateCache = new Map<string, string>();

    visitedEntries.forEach((entry) => {
      let dateStr = dateCache.get(entry.date);
      if (!dateStr) {
        // Replace hyphens with slashes to ensure consistent local timezone parsing across browsers
        const dateToParse = typeof entry.date === 'string' ? entry.date.replace(/-/g, '/') : entry.date;
        dateStr = new Date(dateToParse).toDateString();
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
    stats,
    visitedEntries,
    visitDates,
  };
}
