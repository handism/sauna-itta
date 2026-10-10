import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import MonthlyVisitsChart, { formatMonthTick, getMonthTicks } from './MonthlyVisitsChart';
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
    const table = screen.getByRole('table', { name: '月別訪問数の詳細' });
    expect(table).toHaveTextContent('2023-01');
    expect(table).toHaveTextContent('2回');
    expect(table).toHaveTextContent('2024-01');
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
    // 0 件の月も含めた 3 か月で割った平均を、グラフの平均線と同じ値で読み上げる
    expect(chart.getAttribute('aria-label')).toContain('月平均0.7回');
  });

  it('renders correctly in dark theme', () => {
    render(<MonthlyVisitsChart entries={mockEntries} theme="dark" />);
    const chart = screen.getByRole('img', { name: /月別訪問数の棒グラフ/ });
    expect(chart).toBeInTheDocument();
  });
});

describe('getMonthTicks', () => {
  const monthsFrom = (startYear: number, startMonth: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const d = new Date(startYear, startMonth - 1 + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

  it('6 か月以内は毎月に目盛りを付ける', () => {
    expect(getMonthTicks(monthsFrom(2025, 3, 4))).toEqual(['2025-03', '2025-04', '2025-05', '2025-06']);
  });

  it('1 年半ほどなら 1・4・7・10 月の 3 か月おきに揃える', () => {
    expect(getMonthTicks(monthsFrom(2024, 3, 18))).toEqual([
      '2024-04',
      '2024-07',
      '2024-10',
      '2025-01',
      '2025-04',
      '2025-07',
    ]);
  });

  it('長い期間は 1 月だけにする', () => {
    expect(getMonthTicks(monthsFrom(2018, 5, 80))).toEqual([
      '2019-01',
      '2020-01',
      '2021-01',
      '2022-01',
      '2023-01',
      '2024-01',
    ]);
  });

  it('目盛りは「3月」の形で出す', () => {
    expect(formatMonthTick('2024-03')).toBe('3月');
    expect(formatMonthTick('2024-12')).toBe('12月');
  });
});
