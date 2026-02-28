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
}

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];
const RATING_LABELS: { [key: number]: string } = {
  1: '★1',
  2: '★2',
  3: '★3',
  4: '★4',
  5: '★5',
};

export default function RatingDistributionChart({ visits }: RatingDistributionChartProps) {
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
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
