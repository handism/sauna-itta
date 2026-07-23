"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, PieChart as PieChartIcon } from 'lucide-react';
import { SaunaVisit } from '@/components/sauna-map/types';
import { flattenVisitHistory } from '@/components/sauna-map/utils';

interface RatingDistributionChartProps {
  visits: SaunaVisit[];
  theme: 'dark' | 'light';
}

const RATING_COLORS: { [key: number]: string } = {
  5: '#10b981', // Emerald green
  4: '#3b82f6', // Blue
  3: '#f59e0b', // Amber
  2: '#f97316', // Orange
  1: '#ef4444', // Red
};
const FALLBACK_COLOR = '#8b5cf6';
const RATING_LABELS: { [key: number]: string } = {
  5: '★5 (最高)',
  4: '★4 (満足)',
  3: '★3 (普通)',
  2: '★2 (イマイチ)',
  1: '★1 (うーん)',
};

export default function RatingDistributionChart({ visits, theme }: RatingDistributionChartProps) {
  const { data, avgRating, totalRated } = useMemo(() => {
    const ratingCounts: { [key: number]: number } = {};
    let totalScore = 0;
    let totalCount = 0;

    flattenVisitHistory(visits).forEach((entry) => {
      if (entry.status === "visited" && entry.rating && entry.rating > 0) {
        const rating = entry.rating;
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        totalScore += rating;
        totalCount += 1;
      }
    });

    const chartData = [5, 4, 3, 2, 1]
      .filter((r) => ratingCounts[r])
      .map((r) => ({
        rating: r,
        name: RATING_LABELS[r] || `★${r}`,
        value: ratingCounts[r],
      }));

    const avg = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : "0.0";

    return { data: chartData, avgRating: avg, totalRated: totalCount };
  }, [visits]);

  const textColor = theme === 'light' ? '#1e293b' : '#f8fafc';

  if (data.length === 0) {
    return (
      <div className="chart-empty-state" style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        <PieChartIcon size={32} style={{ marginBottom: 8 }} />
        <p>評価付きの訪問記録がありません。訪問に評価を付けると分布が表示されます。</p>
      </div>
    );
  }

  const chartSummary = `満足度分布のドーナツグラフ。平均満足度${avgRating}。`;

  return (
    <div role="img" aria-label={chartSummary} style={{ width: '100%', height: 260, position: 'relative' }}>
      {/* Center avg rating indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textColor, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
          <span>{avgRating}</span>
          <Star size={18} fill="#f59e0b" color="#f59e0b" style={{ marginTop: -2 }} />
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: '2px', letterSpacing: '0.05em' }}>
          平均 ({totalRated}件)
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.rating}`}
                fill={RATING_COLORS[entry.rating] ?? FALLBACK_COLOR}
                style={{ outline: 'none', filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))' }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 24, 33, 0.92)',
              backdropFilter: 'blur(12px)',
              borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              color: textColor,
              fontWeight: 600,
              fontSize: '13px',
              padding: '8px 14px',
            }}
            formatter={(value: number | string | undefined) => [`${value ?? 0} 件`, '訪問数']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
