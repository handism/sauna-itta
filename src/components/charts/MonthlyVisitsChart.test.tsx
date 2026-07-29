import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import MonthlyVisitsChart from './MonthlyVisitsChart';
import { ChartTheme } from './chartTheme';
import { FlatVisitHistoryEntry } from '@/components/sauna-map/utils/visitHistory';

vi.mock('recharts', async () => {
  const ActualRecharts = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...ActualRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: '100%', height: 260 }}>
        {children}
      </div>
    )
  };
});

describe('MonthlyVisitsChart', () => {
  const mockTheme: ChartTheme = 'light';

  const mockEntries = [
    { visitId: '1', date: '2023-01-15', status: 'visited', comment: '', id: 'a', name: 'a', lat: 1, lng: 1 },
    { visitId: '2', date: '2023-01-20', status: 'visited', comment: '', id: 'a', name: 'a', lat: 1, lng: 1 },
    { visitId: '3', date: '2023-02-05', status: 'visited', comment: '', id: 'a', name: 'a', lat: 1, lng: 1 },
    { visitId: '4', date: '2024-01-10', status: 'visited', comment: '', id: 'a', name: 'a', lat: 1, lng: 1 },
  ] as FlatVisitHistoryEntry[];

  it('renders empty state when no entries are provided', () => {
    render(<MonthlyVisitsChart entries={[]} theme={mockTheme} />);
    expect(screen.getByText(/訪問記録がありません/i)).toBeInTheDocument();
  });

  it('calculates correctly the amount of entries per month and renders year boundaries', () => {
    render(<MonthlyVisitsChart entries={mockEntries} theme={mockTheme} />);
    const chart = screen.getByRole('img', { name: /月別訪問数の棒グラフ/ });
    expect(chart).toBeInTheDocument();

    expect(chart.getAttribute('aria-label')).toContain('2023-01から2024-01まで');
    expect(chart.getAttribute('aria-label')).toContain('合計4件の訪問');
  });
});
