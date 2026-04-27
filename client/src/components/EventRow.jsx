const TYPE_CONFIG = {
  vaccine: { label: 'Vaccin', badgeClass: 'badge-vaccine' },
  walk: { label: 'Balade', badgeClass: 'badge-walk' },
  meal: { label: 'Repas', badgeClass: 'badge-meal' },
  vet: { label: 'Vétérinaire', badgeClass: 'badge-vet' },
};

const FR_MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * Displays a single event as an editorial-style row with date stamp, badge,
 * title and optional description.
 *
 * @param {Object} props
 * @param {Object} props.event
 */
export default function EventRow({ event }) {
  const config = TYPE_CONFIG[event.type] || { label: event.type, badgeClass: '' };
  const date = new Date(event.event_date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = FR_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="event-row">
      <div className="event-row__date">
        <span className="event-row__date-day">{day}</span>
        <span className="event-row__date-monthtime">{month} {year} · {time}</span>
      </div>
      <div className="event-row__body">
        <div className="event-row__meta">
          <span className={`badge ${config.badgeClass}`}>{config.label}</span>
        </div>
        <h4 className="event-row__title">{event.title}</h4>
        {event.description && <p className="event-row__desc">{event.description}</p>}
      </div>
    </div>
  );
}
