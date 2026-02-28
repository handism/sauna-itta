"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SaunaVisit {
  id: string;
  date: string;
  rating?: number;
  status?: "visited" | "wishlist";
}

interface RatingDistributionChartProps {
  visits: SaunaVisit[];
  theme: 'dark' | 'light';
}

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];
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

    visits.forEach(visit => {
      if (visit.status === 'visited' && visit.rating && visit.rating > 0) {
        const rating = visit.rating;
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      }
    });

    const chartData = Object.keys(ratingCounts).map(rating => ({
      name: RATING_LABELS[parseInt(rating, 10)] || `評価${rating}`,
      value: ratingCounts[rating],
    }));

    // Sort by rating
    chartData.sort((a, b) => (a.name).localeCompare(b.name));

    return chartData;
  }, [visits]);

  const textColor = theme === 'light' ? '#2c3e50' : '#f2f2f2';

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
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
    return <p>評価付きの訪問記録がありません。</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(13, 13, 13, 0.8)',
            borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
            color: textColor
          }}
        />
        <Legend wrapperStyle={{ color: textColor }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
