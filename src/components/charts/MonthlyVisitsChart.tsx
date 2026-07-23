"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { SaunaVisit } from '@/components/sauna-map/types';
import { flattenVisitHistory } from '@/components/sauna-map/utils';

interface MonthlyVisitsChartProps {
  visits: SaunaVisit[];
  theme: 'dark' | 'light';
}

export default function MonthlyVisitsChart({ visits, theme }: MonthlyVisitsChartProps) {
  const data = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {};

    flattenVisitHistory(visits).forEach((entry) => {
      if (entry.status === "visited") {
        const month = entry.date.substring(0, 7); // YYYY-MM
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });

    const chartData = Object.keys(monthlyCounts).map(month => ({
      month,
      visits: monthlyCounts[month],
    }));

    chartData.sort((a, b) => a.month.localeCompare(b.month));
    return chartData;
  }, [visits]);

  const yearBoundaries = useMemo(() => {
    const seenYears = new Set<string>();
    return data
      .filter((d) => {
        const year = d.month.slice(0, 4);
        if (seenYears.has(year)) return false;
        seenYears.add(year);
        return true;
      })
      .map((d) => ({ month: d.month, year: d.month.slice(0, 4) }));
  }, [data]);

  const tickColor = theme === 'light' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)';
  const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(241, 245, 249, 0.1)';

  if (data.length === 0) {
    return (
      <div className="chart-empty-state" style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        <BarChart3 size={32} style={{ marginBottom: 8 }} />
        <p>訪問記録がありません。サウナを追加すると月別の推移が表示されます。</p>
      </div>
    );
  }

  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const chartSummary = `月別訪問数の棒グラフ。${data[0].month}から${data[data.length - 1].month}まで、合計${totalVisits}件の訪問。`;

  return (
    <div role="img" aria-label={chartSummary} style={{ width: '100%', height: 260 }}>
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

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
            cursor={{ fill: theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 24, 33, 0.92)',
              backdropFilter: 'blur(12px)',
              borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              color: tickColor,
              fontWeight: 600,
              fontSize: '13px',
              padding: '8px 14px',
            }}
            formatter={(value: number | string | undefined) => [`${value ?? 0} 回`, '訪問数']}
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
                label={{ value: year, position: 'insideTopLeft', fill: tickColor, fontSize: 10, opacity: 0.7 }}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
