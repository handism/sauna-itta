import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import MonthlyVisitsChart from './MonthlyVisitsChart';
import { FlatVisitHistoryEntry } from '@/components/sauna-map/utils/visitHistory';

vi.mock('recharts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('recharts')>();
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: '100%', height: 260 }}>
        {children}
      </div>
    ),
  };
});

describe('MonthlyVisitsChart', () => {
  afterEach(() => {
    cleanup();
  });

  const mockEntries: FlatVisitHistoryEntry[] = [
    { visitId: '1', date: '2023-01-15', status: 'visited', comment: '' },
    { visitId: '2', date: '2023-01-20', status: 'visited', comment: '' },
    { visitId: '3', date: '2023-02-05', status: 'visited', comment: '' },
    { visitId: '4', date: '2024-01-10', status: 'visited', comment: '' },
  ];

  it('renders empty state when no entries are provided', () => {
    render(<MonthlyVisitsChart entries={[]} theme="light" />);
    expect(screen.getByText(/訪問記録がありません/i)).toBeInTheDocument();
  });

  it('calculates correctly the amount of entries per month and renders year boundaries', () => {
    render(<MonthlyVisitsChart entries={mockEntries} theme="light" />);
    const chart = screen.getByRole('img', { name: /月別訪問数の棒グラフ/ });
    expect(chart).toBeInTheDocument();

    expect(chart.getAttribute('aria-label')).toContain('2023-01から2024-01まで');
    expect(chart.getAttribute('aria-label')).toContain('合計4件の訪問');
  });

  it('renders correctly with single year entries', () => {
    const singleYearEntries: FlatVisitHistoryEntry[] = [
      { visitId: '1', date: '2023-01-15', status: 'visited', comment: '' },
      { visitId: '2', date: '2023-03-20', status: 'visited', comment: '' },
    ];

    render(<MonthlyVisitsChart entries={singleYearEntries} theme="light" />);
    const chart = screen.getByRole('img', { name: /月別訪問数の棒グラフ/ });
    expect(chart).toBeInTheDocument();
    expect(chart.getAttribute('aria-label')).toContain('2023-01から2023-03まで');
    expect(chart.getAttribute('aria-label')).toContain('合計2件の訪問');
  });

  it('renders correctly in dark theme', () => {
    render(<MonthlyVisitsChart entries={mockEntries} theme="dark" />);
    const chart = screen.getByRole('img', { name: /月別訪問数の棒グラフ/ });
    expect(chart).toBeInTheDocument();
  });
});

