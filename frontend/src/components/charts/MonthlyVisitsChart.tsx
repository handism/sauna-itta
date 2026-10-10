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
import { FlatVisitHistoryEntry, getMonthlyVisitCounts } from "@/components/sauna-map/utils";
import { ChartTheme, getChartColors, getTooltipStyle } from "./chartTheme";
import { ChartEmptyState } from "./ChartEmptyState";

/**
 * 横軸に目盛りを付ける月（"YYYY-MM"）。Recharts の自動の間引きは幅だけで決めるため、
 * 「2024-03, 2024-06, 2024-09, 2024-11」のように間隔が不揃いになる。
 * 月の数に応じて 1・2・3・6・12 か月おきの刻みを選び、1 月を起点にした月（3 か月おきなら 1・4・7・10 月）に揃える。
 */
export function getMonthTicks(months: string[]): string[] {
  const count = months.length;
  const step = count <= 6 ? 1 : count <= 12 ? 2 : count <= 36 ? 3 : count <= 72 ? 6 : 12;
  return months.filter((month) => (Number(month.slice(5, 7)) - 1) % step === 0);
}

/** 目盛りは「3月」の形にする。年は年の境目の縦線のラベルが示す */
export function formatMonthTick(month: string): string {
  return `${Number(month.slice(5, 7))}月`;
}

interface MonthlyVisitsChartProps {
  /** 訪問済みの履歴エントリ。平坦化と status の絞り込みは useStatsData で済ませてある */
  entries: FlatVisitHistoryEntry[];
  theme: ChartTheme;
}

export default function MonthlyVisitsChart({
  entries,
  theme,
}: MonthlyVisitsChartProps) {
  // 訪問の無い月も 0 件で埋める（飛び飛びの月を等間隔に並べると空白期間が読めない）
  const data = useMemo(() => getMonthlyVisitCounts(entries), [entries]);
  const ticks = useMemo(() => getMonthTicks(data.map((d) => d.month)), [data]);

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
  // 毎月の件数が近いと棒の高さがそろって見え、多い月・少ない月が読めない。平均の横線を基準に置く
  const averageVisits = Math.round((totalVisits / data.length) * 10) / 10;
  const chartSummary = `月別訪問数の棒グラフ。${data[0].month}から${data[data.length - 1].month}まで、合計${totalVisits}件の訪問。月平均${averageVisits}回。`;

  return (
    <>
      <div
        role="img"
        aria-label={chartSummary}
        style={{ width: "100%", height: 260 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {/*
            棒の間を空ける（既定の 10% だと隣の棒と接して 1 枚の面に見える）。
            月の数が少ないときに棒が太くなりすぎないよう maxBarSize でも抑える
          */}
          <BarChart
            data={data}
            // 右の余白は平均線のラベル（「平均 4.9回」）を棒に重ねずプロットの外に置くため
            margin={{ top: 15, right: 64, left: -20, bottom: 5 }}
            barCategoryGap="30%"
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
              ticks={ticks}
              interval={0}
              tickFormatter={formatMonthTick}
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
              labelFormatter={(label) =>
                typeof label === "string" ? `${label.slice(0, 4)}年${formatMonthTick(label)}` : label
              }
              formatter={(value) => [`${value ?? 0} 回`, "訪問数"] as const}
            />
            <Bar
              dataKey="visits"
              fill="url(#barGradient)"
              name="訪問数"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            {data.length > 1 && (
              <ReferenceLine
                y={averageVisits}
                stroke={tickColor}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  value: `平均 ${averageVisits}回`,
                  position: "right",
                  fill: tickColor,
                  fontSize: 11,
                }}
              />
            )}
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
