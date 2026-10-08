import { useEffect, useMemo, useState } from "react";
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  flattenVisitHistory,
  calculateStats,
  filterVisitsByYear,
  getVisitYears,
  rankVisitsByCount,
  toDateString,
} from "@/components/sauna-map/utils";
import { useTheme } from "@/components/sauna-map/hooks/useTheme";
import { useVisitSession } from "@/components/sauna-map/hooks/useVisitSession";
import { getVisitRepository } from "@/components/sauna-map/repositories";

export function useStatsData() {
  const [allVisits, setAllVisits] = useState<SaunaVisit[]>([]);
  // 集計する年（"2026" の形）。null は全期間
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  // テーマと日付の初期化が済んだか。date は利用者がカレンダーで選択を外すと null に戻るため、
  // マウント済みの判定には使えない
  const [initialized, setInitialized] = useState(false);
  const [repository] = useState(() => getVisitRepository());
  // セッション確認と記録の読み込みは地図側と同じ手順を共有する
  const { loading, authenticated, csrfToken, loadError } = useVisitSession(repository, {
    onVisitsLoaded: setAllVisits,
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

  /** 訪問がある年（新しい順）。期間の切り替えの選択肢になる */
  const years = useMemo(() => getVisitYears(allVisits), [allVisits]);
  // 記録が読み込み直されて選んでいた年が無くなったときは全期間へ戻す
  const year = selectedYear !== null && years.includes(selectedYear) ? selectedYear : null;

  /**
   * 選んだ年で絞り込んだ記録。サマリー・ランキング・グラフ・タグ・カレンダーはすべてこれを見る
   * （一部だけ全期間のままだと、同じ画面の数字同士が食い違う）。
   */
  const visits = useMemo(() => filterVisitsByYear(allVisits, year), [allVisits, year]);

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
    years,
    year,
    setYear: setSelectedYear,
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
