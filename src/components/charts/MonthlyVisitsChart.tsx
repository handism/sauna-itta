"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
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

    // Sort by month
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

  const tickColor = theme === 'light' ? '#334155' : '#f1f5f9';
  const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.14)' : 'rgba(241, 245, 249, 0.18)';

  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        <BarChart3 size={32} />
        <p>訪問記録がありません。サウナを追加すると月別の推移が表示されます。</p>
      </div>
    );
  }

  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const chartSummary = `月別訪問数の棒グラフ。${data[0].month}から${data[data.length - 1].month}まで、合計${totalVisits}件の訪問。`;

  return (
    <div role="img" aria-label={chartSummary}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(13, 13, 13, 0.8)',
              borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              color: tickColor,
            }}
          />
          <Legend wrapperStyle={{ color: tickColor, fontSize: 12 }} />
          <Bar dataKey="visits" fill={theme === 'light' ? '#e3702d' : '#f49b56'} name="訪問数" />
          {yearBoundaries.length > 1 &&
            yearBoundaries.map(({ month, year }) => (
              <ReferenceLine
                key={year}
                x={month}
                stroke={gridColor}
                label={{ value: year, position: 'insideTopLeft', fill: tickColor, fontSize: 11 }}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
