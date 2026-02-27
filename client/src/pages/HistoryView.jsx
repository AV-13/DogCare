import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHistory } from '../services/eventService';
import EventRow from '../components/EventRow';

/**
 * Paginated history view of past events for a specific dog.
 *
 * @returns {JSX.Element}
 */
export default function HistoryView() {
  const { id: dogId } = useParams();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getHistory(dogId, page)
      .then((res) => {
        setEvents(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dogId, page]);

  return (
    <div>
      <Link to={`/dogs/${dogId}`} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour
      </Link>

      <div className="card">
        <h1 className="page-title">Historique</h1>

        {loading ? (
          <p>Chargement...</p>
        ) : events.length === 0 ? (
          <p style={{ color: '#888' }}>Aucun événement passé.</p>
        ) : (
          <>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}

            {pagination && pagination.totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </button>
                <span>
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
};
