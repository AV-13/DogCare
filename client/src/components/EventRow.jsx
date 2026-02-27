/**
 * Map of event types to their display labels and CSS badge classes.
 *
 * @type {Record<string, {label: string, badgeClass: string}>}
 */
const TYPE_CONFIG = {
  vaccine: { label: 'Vaccin', badgeClass: 'badge-vaccine' },
  walk: { label: 'Balade', badgeClass: 'badge-walk' },
  meal: { label: 'Repas', badgeClass: 'badge-meal' },
  vet: { label: 'Vétérinaire', badgeClass: 'badge-vet' },
};

/**
 * Displays a single event as a row with type badge, title, date, and description.
 *
 * @param {Object} props
 * @param {Object} props.event - The event object
 * @param {string} props.event.id - Event UUID
 * @param {string} props.event.type - Event type
 * @param {string} props.event.title - Event title
 * @param {string} props.event.event_date - Event date (ISO string)
 * @param {string} [props.event.description] - Optional description
 * @returns {JSX.Element}
 */
export default function EventRow({ event }) {
  const config = TYPE_CONFIG[event.type] || { label: event.type, badgeClass: '' };
  const date = new Date(event.event_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={styles.row}>
      <span className={`badge ${config.badgeClass}`}>{config.label}</span>
      <div style={styles.content}>
        <strong>{event.title}</strong>
        <span style={styles.date}>{date}</span>
        {event.description && <p style={styles.desc}>{event.description}</p>}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.8rem',
    padding: '0.8rem 0',
    borderBottom: '1px solid #eee',
  },
  content: {
    flex: 1,
  },
  date: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '0.15rem',
  },
  desc: {
    margin: '0.3rem 0 0',
    fontSize: '0.9rem',
    color: '#555',
  },
};
