import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCalendar } from '../services/eventService';

const TYPE_COLORS = {
  vaccine: 'var(--terracotta)',
  walk:    'var(--moss)',
  meal:    'var(--ochre)',
  vet:     'var(--plum)',
};

const TYPE_LABELS = {
  vaccine: 'Vaccin',
  walk:    'Balade',
  meal:    'Repas',
  vet:     'Vétérinaire',
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

  const goToPrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
    setCurrentMonth(prev);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
    setCurrentMonth(next);
  };

  const buildCalendarDays = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

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
      <Link to={`/dogs/${dogId}`} className="back-link">Retour</Link>

      <header className="page-head">
        <div className="page-head__left">
          <span className="eyebrow">Vue mensuelle</span>
          <h1>
            <span className="serif-italic">Calendrier.</span>
          </h1>
        </div>
      </header>

      <div className="card">
        <div className="cal-head">
          <h2 className="cal-head__title">{monthLabel}</h2>
          <div className="cal-head__nav">
            <button onClick={goToPrevMonth} className="btn btn-secondary btn-sq" aria-label="Mois précédent">←</button>
            <button onClick={goToNextMonth} className="btn btn-secondary btn-sq" aria-label="Mois suivant">→</button>
          </div>
        </div>

        {loading ? (
          <p className="loading-text">Chargement…</p>
        ) : (
          <div className="cal-grid">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
            {cells.map((cell, i) => (
              <div key={i} className={`cal-cell ${cell.day ? '' : 'cal-cell--empty'}`}>
                {cell.day && (
                  <>
                    <span className="cal-cell__day">{cell.day}</span>
                    <div className="cal-cell__events">
                      {(events[cell.dateStr] || []).map((ev) => (
                        <span
                          key={ev.id}
                          className="cal-dot"
                          style={{ background: TYPE_COLORS[ev.type] || 'var(--ink-mute)' }}
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

        <div className="cal-legend">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="cal-legend__item">
              <span className="cal-dot" style={{ background: color }} />
              {TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
