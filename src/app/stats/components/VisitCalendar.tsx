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
              if (view === 'month') {
                const dateStr = date.toDateString();
                if (visitDates.has(dateStr)) {
                  return <div className="calendar-dot"></div>;
                }
              }
              return null;
            }}
            tileClassName={({ date, view }) => {
              if (view === 'month') {
                const dateStr = date.toDateString();
                if (visitDates.has(dateStr)) {
                  return "react-calendar__tile--has-visit";
                }
              }
              return null;
            }}
          />
        </div>
      </section>
    </div>
  );
}
