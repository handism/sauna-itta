import { useEffect, useMemo, useState } from 'react';
import { SaunaVisit } from "@/components/sauna-map/types";
import {
  getInitialTheme,
  flattenVisitHistory,
  getInitialVisits,
  calculateStats,
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
    if (theme === 'light') {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme, mounted]);

  const stats = useMemo(() => calculateStats(visits), [visits]);

  const visitDates = useMemo(() => {
    const dates = new Map<string, number>();
    flattenVisitHistory(visits)
      .filter((entry) => entry.status === "visited")
      .forEach((entry) => {
        const dateStr = new Date(entry.date).toDateString();
        dates.set(dateStr, (dates.get(dateStr) ?? 0) + 1);
      });
    return dates;
  }, [visits]);

  return { visits, theme, date, setDate, mounted, stats, visitDates };
}
