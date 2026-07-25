import { useCallback, useEffect, useMemo, useState } from 'react';
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  getInitialTheme,
  flattenVisitHistory,
  getInitialVisits,
  calculateStats,
  applyThemeClass,
  saveTheme,
} from "@/components/sauna-map/utils";

export function useStatsData() {
  const [visits, setVisits] = useState<SaunaVisit[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // To satisfy react-hooks/set-state-in-effect and avoid synchronous cascading renders
    const timer = setTimeout(() => {
      setMounted(true);
      setVisits(getInitialVisits());
      setTheme(getInitialTheme());
      setDate(new Date());
    }, 0);

    document.documentElement.classList.add("allow-page-scroll");
    document.body.classList.add("allow-page-scroll");

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove("allow-page-scroll");
      document.body.classList.remove("allow-page-scroll");
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(theme);
  }, [theme, mounted]);

  // 統計ページから直接開いた場合でもテーマを切り替えられるようにする
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  }, []);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    const dateCache = new Map<string, string>();

    flattenVisitHistory(visits).forEach((entry) => {
      if (entry.status === "visited") {
        let dateStr = dateCache.get(entry.date);
        if (!dateStr) {
          // Replace hyphens with slashes to ensure consistent local timezone parsing across browsers
          const dateToParse = typeof entry.date === 'string' ? entry.date.replace(/-/g, '/') : entry.date;
          dateStr = new Date(dateToParse).toDateString();
          dateCache.set(entry.date, dateStr);
        }
        dates.set(dateStr, (dates.get(dateStr) ?? 0) + 1);
      }
    });
    return dates;
  }, [visits]);

  return { visits, theme, toggleTheme, date, setDate, mounted, stats, visitDates };
}
