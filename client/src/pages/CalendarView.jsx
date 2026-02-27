import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCalendar } from '../services/eventService';

/**
 * Color mapping for event type dots on the calendar.
 *
 * @type {Record<string, string>}
 */
const TYPE_COLORS = {
  vaccine: '#3498db',
  walk: '#2ecc71',
  meal: '#f39c12',
  vet: '#e74c3c',
};

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * Monthly calendar view showing colored dots for each event type per day.
 *
 * @returns {JSX.Element}
 */
export default function CalendarView() {
  const { id: dogId } = useParams();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendar(dogId, currentMonth)
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dogId, currentMonth]);

  /**
   * Navigate to the previous month.
   */
  const goToPrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
    setCurrentMonth(prev);
  };

  /**
   * Navigate to the next month.
   */
  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
    setCurrentMonth(next);
  };

  /**
   * Build the calendar grid cells for the current month.
   *
   * @returns {Array<{day: number|null, dateStr: string|null}>}
   */
  const buildCalendarDays = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  };

  const [year, month] = currentMonth.split('-').map(Number);
  const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const cells = buildCalendarDays();

  return (
    <div>
      <Link to={`/dogs/${dogId}`} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour
      </Link>

      <div className="card">
        <div style={styles.header}>
          <button onClick={goToPrevMonth} className="btn btn-secondary">←</button>
          <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{monthLabel}</h2>
          <button onClick={goToNextMonth} className="btn btn-secondary">→</button>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div style={styles.grid}>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} style={styles.dayHeader}>{d}</div>
            ))}
            {cells.map((cell, i) => (
              <div key={i} style={styles.cell}>
                {cell.day && (
                  <>
                    <span style={styles.dayNumber}>{cell.day}</span>
                    <div style={styles.dots}>
                      {(events[cell.dateStr] || []).map((ev) => (
                        <span
                          key={ev.id}
                          style={{ ...styles.dot, backgroundColor: TYPE_COLORS[ev.type] || '#999' }}
                          title={ev.title}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.legend}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} style={styles.legendItem}>
              <span style={{ ...styles.dot, backgroundColor: color }} />
              {type === 'vaccine' ? 'Vaccin' : type === 'walk' ? 'Balade' : type === 'meal' ? 'Repas' : 'Vétérinaire'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  dayHeader: {
    textAlign: 'center',
    fontWeight: 600,
    padding: '0.5rem',
    fontSize: '0.85rem',
    color: '#666',
  },
  cell: {
    minHeight: 60,
    border: '1px solid #eee',
    borderRadius: 4,
    padding: '0.3rem',
    position: 'relative',
  },
  dayNumber: {
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  dots: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 4,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  legend: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.85rem',
  },
};
