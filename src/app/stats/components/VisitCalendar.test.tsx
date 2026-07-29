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
      />
    );

    const dot = container.querySelector('.calendar-dot');
    expect(dot).not.toBeInTheDocument();

    const srTexts = screen.queryAllByText('訪問記録あり');
    expect(srTexts.length).toBe(0);

    const tilesWithVisit = container.querySelectorAll('.react-calendar__tile--has-visit');
    expect(tilesWithVisit.length).toBe(0);
  });
});
