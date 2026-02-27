import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDog, deleteDog } from '../services/dogService';
import EventRow from '../components/EventRow';

/**
 * Dog detail page showing dog info, recent events, and action buttons.
 *
 * @returns {JSX.Element}
 */
export default function DogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDog(id)
      .then((res) => setDog(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /**
   * Delete the dog after user confirmation.
   */
  const handleDelete = async () => {
    if (!window.confirm(`Supprimer ${dog.name} et tous ses événements ?`)) return;
    try {
      await deleteDog(dog.id);
      navigate('/');
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!dog) return null;

  return (
    <div>
      <Link to="/" style={styles.backLink}>← Retour</Link>

      <div className="card" style={styles.infoCard}>
        <div style={styles.topRow}>
          <div style={styles.photoContainer}>
            {dog.photo_url ? (
              <img src={dog.photo_url} alt={dog.name} style={styles.photo} />
            ) : (
              <div style={styles.placeholder}>🐕</div>
            )}
          </div>
          <div style={styles.details}>
            <h1 style={{ margin: 0 }}>{dog.name}</h1>
            {dog.breed && <p style={styles.meta}>Race : {dog.breed}</p>}
            {dog.birth_date && (
              <p style={styles.meta}>
                Naissance : {new Date(dog.birth_date).toLocaleDateString('fr-FR')}
              </p>
            )}
            {dog.weight_kg && <p style={styles.meta}>Poids : {dog.weight_kg} kg</p>}
          </div>
        </div>

        <div style={styles.actions}>
          <Link to={`/dogs/${dog.id}/edit`} className="btn btn-primary">Modifier</Link>
          <Link to={`/dogs/${dog.id}/events/new`} className="btn btn-primary">+ Événement</Link>
          <Link to={`/dogs/${dog.id}/calendar`} className="btn btn-secondary">Calendrier</Link>
          <Link to={`/dogs/${dog.id}/history`} className="btn btn-secondary">Historique</Link>
          <button onClick={handleDelete} className="btn btn-danger">Supprimer</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Événements récents</h2>
        {dog.recent_events && dog.recent_events.length > 0 ? (
          dog.recent_events.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <p style={{ color: '#888' }}>Aucun événement pour le moment.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  backLink: {
    display: 'inline-block',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  infoCard: {
    marginBottom: '1rem',
  },
  topRow: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    fontSize: '3rem',
  },
  details: {
    flex: 1,
  },
  meta: {
    margin: '0.3rem 0',
    color: '#555',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
};
