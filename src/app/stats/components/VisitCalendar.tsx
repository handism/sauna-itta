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
      <section className={styles.chartCard}>
        <h2>訪問カレンダー</h2>
        <div className="calendarContainer">
          <Calendar
            onChange={(value) => setDate(value instanceof Date ? value : null)}
            value={date}
            calendarType="gregory"
            className={theme === 'light' ? 'light-theme' : 'dark-theme'}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;
              return visitDates.has(date.toDateString()) ? <div className="calendar-dot"></div> : null;
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
