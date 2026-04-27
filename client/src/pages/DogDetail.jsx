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

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer ${dog.name} et tous ses événements ?`)) return;
    try {
      await deleteDog(dog.id);
      navigate('/');
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <p className="loading-text">Chargement…</p>;
  if (!dog) return null;

  const monogram = (dog.name || '?').trim().charAt(0).toUpperCase();
  const ageYears = dog.birth_date
    ? Math.floor((Date.now() - new Date(dog.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div>
      <Link to="/" className="back-link">Retour</Link>

      <section className="dog-hero">
        <div className="dog-hero__frame">
          {dog.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} className="dog-hero__photo" />
          ) : (
            <div className="dog-hero__monogram-large">{monogram}</div>
          )}
          <div className="dog-hero__caption">{dog.breed || 'Chien de famille'}</div>
        </div>

        <div className="dog-hero__info">
          <span className="eyebrow">Fiche compagnon</span>
          <h1>{dog.name}</h1>

          <div className="stats">
            {dog.breed && (
              <div>
                <div className="stat__label">Race</div>
                <div className="stat__value">{dog.breed}</div>
              </div>
            )}
            {dog.birth_date && (
              <div>
                <div className="stat__label">Naissance</div>
                <div className="stat__value">
                  {new Date(dog.birth_date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
            {ageYears !== null && (
              <div>
                <div className="stat__label">Âge</div>
                <div className="stat__value">
                  {ageYears} {ageYears > 1 ? 'ans' : 'an'}
                </div>
              </div>
            )}
            {dog.weight_kg && (
              <div>
                <div className="stat__label">Poids</div>
                <div className="stat__value">{dog.weight_kg} kg</div>
              </div>
            )}
          </div>

          <div className="action-row">
            <Link to={`/dogs/${dog.id}/events/new`} className="btn btn-primary">
              + Événement
            </Link>
            <Link to={`/dogs/${dog.id}/calendar`} className="btn btn-secondary">
              Calendrier
            </Link>
            <Link to={`/dogs/${dog.id}/history`} className="btn btn-secondary">
              Historique
            </Link>
            <Link to={`/dogs/${dog.id}/edit`} className="btn btn-secondary">
              Modifier
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Supprimer
            </button>
          </div>
        </div>
      </section>

      <div className="section-head">
        <h2 className="section-head__title">Événements récents</h2>
        <span className="rule-ornament" />
      </div>

      <div className="card">
        {dog.recent_events && dog.recent_events.length > 0 ? (
          <div className="events-list">
            {dog.recent_events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--ink-mute)', textAlign: 'center', padding: '1rem 0' }}>
            Aucun événement pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
