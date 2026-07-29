"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, PieChart as PieChartIcon } from 'lucide-react';
import { FlatVisitHistoryEntry } from '@/components/sauna-map/utils';
import { ChartTheme, getChartColors, getTooltipStyle } from './chartTheme';
import { ChartEmptyState } from './ChartEmptyState';

interface RatingDistributionChartProps {
  /** 訪問済みの履歴エントリ。平坦化と status の絞り込みは useStatsData で済ませてある */
  entries: FlatVisitHistoryEntry[];
  /**
   * 平均満足度。サマリーと同じ値を表示する必要があるため、ここで再計算せず
   * calculateStats() の結果（stats.avgRating）を受け取る。
   */
  avgRating: number;
  theme: ChartTheme;
}

const RATING_COLORS: { [key: number]: string } = {
  5: '#10b981', // Emerald green
  4: '#3b82f6', // Blue
  3: '#f59e0b', // Amber
  2: '#f97316', // Orange
  1: '#ef4444', // Red
};
const FALLBACK_COLOR = '#8b5cf6';
const RATING_VALUES = [5, 4, 3, 2, 1] as const;
const RATING_LABELS: { [key: number]: string } = {
  5: '★5 (最高)',
  4: '★4 (満足)',
  3: '★3 (普通)',
  2: '★2 (イマイチ)',
  1: '★1 (うーん)',
};

export default function RatingDistributionChart({
  entries,
  avgRating,
  theme,
}: RatingDistributionChartProps) {
  const { data, totalRated, ratingCounts } = useMemo(() => {
    const ratingCounts: { [key: number]: number } = {};
    let totalCount = 0;

    entries.forEach((entry) => {
      if (entry.rating && entry.rating > 0) {
        const rating = entry.rating;
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        totalCount += 1;
      }
    });

    const chartData = RATING_VALUES.reduce<{ rating: number; name: string; value: number }[]>((acc, r) => {
      if (ratingCounts[r]) {
        acc.push({
          rating: r,
          name: RATING_LABELS[r] || `★${r}`,
          value: ratingCounts[r],
        });
      }
      return acc;
    }, []);

    return { data: chartData, totalRated: totalCount, ratingCounts };
  }, [entries]);

  const avgLabel = avgRating.toFixed(1);

  const { text: textColor } = getChartColors(theme);

  if (data.length === 0) {
    return (
      <ChartEmptyState
        icon={PieChartIcon}
        message="評価付きの訪問記録がありません。訪問に評価を付けると分布が表示されます。"
      />
    );
  }

  const chartSummary = `満足度分布のドーナツグラフ。平均満足度${avgLabel}。`;

  return (
    <>
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
            <span>{avgLabel}</span>
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
              contentStyle={getTooltipStyle(theme)}
              formatter={(value: number | string | undefined) => [`${value ?? 0} 件`, '訪問数']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>満足度分布の詳細</caption>
        <thead>
          <tr>
            <th scope="col">満足度</th>
            <th scope="col">訪問数</th>
          </tr>
        </thead>
        <tbody>
          {RATING_VALUES.map((rating) => (
            <tr key={rating}>
              <th scope="row">★{rating}</th>
              <td>{ratingCounts[rating] ?? 0}件</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
