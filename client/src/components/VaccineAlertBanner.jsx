import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingVaccines } from '../services/dogService';

/**
 * Banner that displays upcoming or overdue vaccine reminders.
 * Fetches data from the API on mount.
 *
 * @returns {JSX.Element|null} The banner or null if no reminders
 */
export default function VaccineAlertBanner() {
  const [vaccines, setVaccines] = useState([]);

  useEffect(() => {
    getUpcomingVaccines()
      .then((res) => setVaccines(res.data))
      .catch(() => {});
  }, []);

  if (vaccines.length === 0) return null;

  const overdue = vaccines.filter((v) => v.status === 'overdue');
  const upcoming = vaccines.filter((v) => v.status === 'upcoming');

  return (
    <div style={styles.wrapper}>
      {overdue.length > 0 && (
        <div className="alert alert-danger">
          <strong>Vaccins en retard :</strong>
          <ul style={styles.list}>
            {overdue.map((v) => (
              <li key={v.event_id}>
                <Link to={`/dogs/${v.dog_id}`}>
                  {v.dog_name} — {v.title} (retard de {Math.abs(v.days_remaining)} jour{Math.abs(v.days_remaining) > 1 ? 's' : ''})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="alert alert-warning">
          <strong>Vaccins à venir :</strong>
          <ul style={styles.list}>
            {upcoming.map((v) => (
              <li key={v.event_id}>
                <Link to={`/dogs/${v.dog_id}`}>
                  {v.dog_name} — {v.title} (dans {v.days_remaining} jour{v.days_remaining > 1 ? 's' : ''})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginBottom: '1.5rem',
  },
  list: {
    margin: '0.5rem 0 0 1.2rem',
    padding: 0,
  },
};
