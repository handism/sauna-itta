import Calendar from 'react-calendar';
import styles from '../stats.module.css';

interface VisitCalendarProps {
  theme: 'light' | 'dark';
  date: Date | null;
  setDate: (date: Date | null) => void;
  visitDates: Map<string, number>;
}

export function VisitCalendar({ theme, date, setDate, visitDates }: VisitCalendarProps) {
  return (
    <div className={styles.chartsWrap}>
      <section className={styles.chartCard} aria-labelledby="visit-calendar-title">
        <h2 id="visit-calendar-title">訪問カレンダー</h2>
        <div className="calendarContainer" role="group" aria-label="訪問カレンダー。訪問記録がある日にはマーカーが表示されます">
          <Calendar
            onChange={(value) => setDate(value instanceof Date ? value : null)}
            value={date}
            calendarType="gregory"
            className={theme === 'light' ? 'light-theme' : 'dark-theme'}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;
              if (!visitDates.has(date.toDateString())) return null;
              return (
                <>
                  <div className="calendar-dot" aria-hidden="true"></div>
                  <span className="sr-only">訪問記録あり</span>
                </>
              );
            }}
            tileClassName={({ date, view }) => {
              if (view !== 'month') return null;
              return visitDates.has(date.toDateString()) ? "react-calendar__tile--has-visit" : null;
            }}
          />
        </div>
      </section>
    </div>
  );
}
