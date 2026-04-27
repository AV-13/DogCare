import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingVaccines } from '../services/dogService';

/**
 * Banner that displays upcoming or overdue vaccine reminders.
 *
 * @returns {JSX.Element|null}
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
    <div style={{ marginBottom: '2rem' }}>
      {overdue.length > 0 && (
        <div className="alert alert-danger">
          <strong>Vaccins en retard :</strong>
          <ul>
            {overdue.map((v) => {
              const days = Math.abs(v.days_remaining);
              return (
                <li key={v.event_id}>
                  <Link to={`/dogs/${v.dog_id}`}>
                    {v.dog_name} — {v.title} (retard de {days} jour{days > 1 ? 's' : ''})
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="alert alert-warning">
          <strong>Vaccins à venir :</strong>
          <ul>
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
