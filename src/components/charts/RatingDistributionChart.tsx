"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SaunaVisit } from '@/components/sauna-map/types';
import { flattenVisitHistory } from '@/components/sauna-map/utils';

interface RatingDistributionChartProps {
  visits: SaunaVisit[];
  theme: 'dark' | 'light';
}

const RATING_COLORS: { [key: number]: string } = {
  1: '#e0574c',
  2: '#f08d49',
  3: '#f8c04e',
  4: '#a3d977',
  5: '#6fcf97',
};
const FALLBACK_COLOR = '#8f7cf7';
const RATING_LABELS: { [key: number]: string } = {
  1: '★1',
  2: '★2',
  3: '★3',
  4: '★4',
  5: '★5',
};

export default function RatingDistributionChart({ visits, theme }: RatingDistributionChartProps) {
  const data = useMemo(() => {
    const ratingCounts: { [key: string]: number } = {};

    flattenVisitHistory(visits)
      .forEach((entry) => {
        if (entry.status === "visited" && entry.rating && entry.rating > 0) {
          const rating = entry.rating;
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        }
      });

    const chartData = Object.keys(ratingCounts).map(rating => {
      const ratingNum = parseInt(rating, 10);
      return {
        rating: ratingNum,
        name: RATING_LABELS[ratingNum] || `評価${rating}`,
        value: ratingCounts[rating],
      };
    });

    // Sort by rating (numeric, not string)
    chartData.sort((a, b) => a.rating - b.rating);

    return chartData;
  }, [visits]);

  const textColor = theme === 'light' ? '#2c3e50' : '#f2f2f2';

  type PieLabelProps = {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  };

  const renderCustomizedLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
    name = '',
  }: PieLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill={textColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        <PieChartIcon size={32} />
        <p>評価付きの訪問記録がありません。訪問に評価を付けると分布が表示されます。</p>
      </div>
    );
  }

  const chartSummary = `満足度分布の円グラフ。${data
    .map((d) => `${d.name}が${d.value}件`)
    .join('、')}。`;

  return (
    <div role="img" aria-label={chartSummary}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill={theme === 'light' ? '#e3702d' : '#f49b56'}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.rating}`} fill={RATING_COLORS[entry.rating] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(13, 13, 13, 0.8)',
              borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              color: textColor
            }}
          />
          <Legend wrapperStyle={{ color: textColor, fontSize: 12 }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
