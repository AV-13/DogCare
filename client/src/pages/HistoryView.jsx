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
      <Link to={`/dogs/${dogId}`} className="back-link">Retour</Link>

      <header className="page-head">
        <div className="page-head__left">
          <span className="eyebrow">Mémoire</span>
          <h1>
            <span className="serif-italic">Historique.</span>
          </h1>
        </div>
      </header>

      <div className="card">
        {loading ? (
          <p className="loading-text">Chargement…</p>
        ) : events.length === 0 ? (
          <div className="empty" style={{ border: 0, padding: '3rem 1rem', background: 'transparent' }}>
            <div className="empty__mark">∅</div>
            <h3>Pas encore d'histoire à raconter.</h3>
            <p>Les événements passés apparaîtront ici.</p>
          </div>
        ) : (
          <>
            <div className="events-list">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Précédent
                </button>
                <span>
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
