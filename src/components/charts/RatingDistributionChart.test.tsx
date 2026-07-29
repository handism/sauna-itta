import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RatingDistributionChart from './RatingDistributionChart';
import { FlatVisitHistoryEntry } from '@/components/sauna-map/utils';

// Recharts ResponsiveContainer needs mocking in Vitest environment
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('RatingDistributionChart', () => {
  const mockEntries: FlatVisitHistoryEntry[] = [
    {
      visitId: 'visit-1',
      date: '2026-01-01',
      rating: 5,
      comment: '最高',
      status: 'visited',
    },
    {
      visitId: 'visit-2',
      date: '2026-01-02',
      rating: 4,
      comment: '満足',
      status: 'visited',
    },
    {
      visitId: 'visit-3',
      date: '2026-01-03',
      rating: 5,
      comment: '最高再び',
      status: 'visited',
    },
  ];

  it('renders empty state when there are no rated entries', () => {
    render(
      <RatingDistributionChart
        entries={[]}
        avgRating={0}
        theme="dark"
      />
    );

    expect(
      screen.getByText('評価付きの訪問記録がありません。訪問に評価を付けると分布が表示されます。')
    ).toBeInTheDocument();
  });

  it('renders chart container and average rating when rated entries are provided', () => {
    render(
      <RatingDistributionChart
        entries={mockEntries}
        avgRating={4.7}
        theme="dark"
      />
    );

    expect(screen.getByRole('img', { name: /満足度分布のドーナツグラフ/i })).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('平均 (3件)')).toBeInTheDocument();
  });
});
