"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { FlatVisitHistoryEntry } from "@/components/sauna-map/utils";
import { ChartTheme, getChartColors, getTooltipStyle } from "./chartTheme";
import { ChartEmptyState } from "./ChartEmptyState";

interface MonthlyVisitsChartProps {
  /** 訪問済みの履歴エントリ。平坦化と status の絞り込みは useStatsData で済ませてある */
  entries: FlatVisitHistoryEntry[];
  theme: ChartTheme;
}

export default function MonthlyVisitsChart({
  entries,
  theme,
}: MonthlyVisitsChartProps) {
  const data = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {};

    entries.forEach((entry) => {
      const month = entry.date.substring(0, 7); // YYYY-MM
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const chartData = Object.keys(monthlyCounts).map((month) => ({
      month,
      visits: monthlyCounts[month],
    }));

    chartData.sort((a, b) => a.month.localeCompare(b.month));
    return chartData;
  }, [entries]);

  const yearBoundaries = useMemo(() => {
    return data.reduce<{ month: string; year: string }[]>((acc, d) => {
      const year = d.month.slice(0, 4);
      if (acc.length === 0 || acc[acc.length - 1].year !== year) {
        acc.push({ month: d.month, year });
      }
      return acc;
    }, []);
  }, [data]);

  const {
    tick: tickColor,
    grid: gridColor,
    cursorFill,
  } = getChartColors(theme);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        icon={BarChart3}
        message="訪問記録がありません。サウナを追加すると月別の推移が表示されます。"
      />
    );
  }

  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const chartSummary = `月別訪問数の棒グラフ。${data[0].month}から${data[data.length - 1].month}まで、合計${totalVisits}件の訪問。`;

  return (
    <>
      <div
        role="img"
        aria-label={chartSummary}
        style={{ width: "100%", height: 260 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7e40" stopOpacity={1} />
                <stop offset="100%" stopColor="#e34d26" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: cursorFill }}
              contentStyle={getTooltipStyle(theme)}
              formatter={(value) => [`${value ?? 0} 回`, "訪問数"] as const}
            />
            <Bar
              dataKey="visits"
              fill="url(#barGradient)"
              name="訪問数"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            {yearBoundaries.length > 1 &&
              yearBoundaries.map(({ month, year }) => (
                <ReferenceLine
                  key={year}
                  x={month}
                  stroke={gridColor}
                  strokeDasharray="2 2"
                  label={{
                    value: year,
                    position: "insideTopLeft",
                    fill: tickColor,
                    fontSize: 10,
                    opacity: 0.7,
                  }}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>月別訪問数の詳細</caption>
        <thead>
          <tr>
            <th scope="col">年月</th>
            <th scope="col">訪問数</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ month, visits }) => (
            <tr key={month}>
              <th scope="row">{month}</th>
              <td>{visits}回</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
