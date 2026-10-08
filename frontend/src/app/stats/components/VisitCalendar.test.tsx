import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { VisitCalendar } from './VisitCalendar';

describe('VisitCalendar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockSetDate = vi.fn();

  // Create a map with one visited date
  const visitedDate = new Date(2024, 0, 10); // Jan 10, 2024
  const mockVisitDates = new Map<string, number>();
  mockVisitDates.set(visitedDate.toDateString(), 1);

  const today = new Date(2024, 0, 15); // Jan 15, 2024

  it('renders correctly with light theme', () => {
    const { container } = render(
      <VisitCalendar
        theme="light"
        date={today}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
      />
    );

    expect(screen.getByText('訪問カレンダー')).toBeInTheDocument();

    const calendarElement = container.querySelector('.react-calendar');
    expect(calendarElement).toHaveClass('light-theme');
    expect(calendarElement).not.toHaveClass('dark-theme');
  });

  it('renders correctly with dark theme', () => {
    const { container } = render(
      <VisitCalendar
        theme="dark"
        date={today}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
      />
    );

    const calendarElement = container.querySelector('.react-calendar');
    expect(calendarElement).toHaveClass('dark-theme');
    expect(calendarElement).not.toHaveClass('light-theme');
  });

  it('calls setDate when a date button is clicked', () => {
    render(
      <VisitCalendar
        theme="light"
        date={today}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
      />
    );

    // react-calendar renders day numbers
    const dayButtons = screen.getAllByText('16');
    const dayButton = dayButtons[0].closest('button');
    expect(dayButton).toBeInTheDocument();

    fireEvent.click(dayButton!);
    expect(mockSetDate).toHaveBeenCalledTimes(1);
    const passedDate = mockSetDate.mock.calls[0][0];
    expect(passedDate).toBeInstanceOf(Date);
    expect(passedDate.getDate()).toBe(16);
  });

  it('renders a dot and sets class for dates with visits', () => {
    const { container } = render(
      <VisitCalendar
        theme="light"
        date={today}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
      />
    );

    const dot = container.querySelector('.calendar-dot');
    expect(dot).toBeInTheDocument();

    const tileWithDot = dot?.closest('.react-calendar__tile');
    expect(tileWithDot).toHaveClass('react-calendar__tile--has-visit');

    const srTexts = screen.getAllByText('訪問記録あり');
    expect(srTexts.length).toBeGreaterThan(0);
  });

  it('does not render a dot for dates without visits', () => {
    // Empty visitDates map
    const { container } = render(
      <VisitCalendar
        theme="light"
        date={today}
        setDate={mockSetDate}
        visitDates={new Map<string, number>()}
        visits={[]}
        entries={[]}
      />
    );

    const dot = container.querySelector('.calendar-dot');
    expect(dot).not.toBeInTheDocument();

    const srTexts = screen.queryAllByText('訪問記録あり');
    expect(srTexts.length).toBe(0);

    const tilesWithVisit = container.querySelectorAll('.react-calendar__tile--has-visit');
    expect(tilesWithVisit.length).toBe(0);
  });

  it('renders correctly when date prop is null', () => {
    const { container } = render(
      <VisitCalendar
        theme="light"
        date={null}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
      />
    );

    const calendarElement = container.querySelector('.react-calendar');
    expect(calendarElement).toBeInTheDocument();
  });

  it('年を選んでいるときは、その年の 1〜12 月をヒートマップに並べ、見出しも年にする', () => {
    render(
      <VisitCalendar
        theme="dark"
        date={null}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[]}
        entries={[]}
        year="2024"
      />
    );

    expect(screen.getByText('2024年のペースと、月ごとの訪問日')).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveTextContent('2024年は 1 日 訪問');
    // 1 月 10 日で訪問が途切れていても、右端はその年の大みそか
    expect(screen.getByRole('img', { name: /〜2024\/12\/31の/ })).toBeInTheDocument();
  });

  it('表示している月の訪問を横に並べ、日を選ぶとその日の訪問に絞り込む', () => {
    const visit = {
      id: 'v1',
      name: 'テスト湯',
      area: '東京都 台東区',
      lat: 35.7,
      lng: 139.8,
      date: '2024-01-10',
      comment: '',
      rating: 4,
      status: 'visited' as const,
    };
    const entries = [{ date: '2024-01-10', comment: '', rating: 4, visitId: 'v1', status: 'visited' as const }];

    render(
      <VisitCalendar
        theme="dark"
        date={null}
        setDate={mockSetDate}
        visitDates={mockVisitDates}
        visits={[visit]}
        entries={entries}
      />
    );

    expect(screen.getByRole('heading', { name: '2024年1月の訪問' })).toBeInTheDocument();
    expect(screen.getByText('テスト湯')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'テスト湯を地図で見る' })).toHaveAttribute('href', '/?id=v1');

    fireEvent.click(screen.getAllByText('16')[0].closest('button')!);
    expect(screen.getByRole('heading', { name: '1月16日（火）の訪問' })).toBeInTheDocument();
    expect(screen.getByText('この日の訪問はありません')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '1月の訪問をすべて表示' }));
    expect(screen.getByText('テスト湯')).toBeInTheDocument();
  });
});
