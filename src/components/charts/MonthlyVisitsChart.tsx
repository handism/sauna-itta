"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SaunaVisit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  comment: string;
  image?: string;
  date: string;
  rating?: number;
  tags?: string[];
  status?: "visited" | "wishlist";
  area?: string;
  visitCount?: number;
}

interface MonthlyVisitsChartProps {
  visits: SaunaVisit[];
  theme: 'dark' | 'light';
}

export default function MonthlyVisitsChart({ visits, theme }: MonthlyVisitsChartProps) {
  const data = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {};

    visits.forEach(visit => {
      if (visit.status === 'visited') {
        const month = visit.date.substring(0, 7); // YYYY-MM
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

  const tickColor = theme === 'light' ? '#334155' : '#f1f5f9';
  const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.14)' : 'rgba(241, 245, 249, 0.18)';

  if (data.length === 0) {
    return <p>訪問記録がありません。</p>;
  }

  return (
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
      </BarChart>
    </ResponsiveContainer>
  );
}
