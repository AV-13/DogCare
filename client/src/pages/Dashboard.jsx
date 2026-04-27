import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDogs } from '../services/dogService';
import DogCard from '../components/DogCard';
import VaccineAlertBanner from '../components/VaccineAlertBanner';

/**
 * Dashboard page displaying vaccine alerts and the user's list of dogs.
 *
 * @returns {JSX.Element}
 */
export default function Dashboard() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDogs()
      .then((res) => setDogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">Chargement…</p>;

  return (
    <div>
      <header className="page-head">
        <div className="page-head__left">
          <span className="eyebrow">Votre album</span>
          <h1>
            Mes <span className="serif-italic">chiens.</span>
          </h1>
        </div>
        <Link to="/dogs/new" className="btn btn-primary">
          + Ajouter un chien
        </Link>
      </header>

      <VaccineAlertBanner />

      {dogs.length === 0 ? (
        <div className="empty">
          <div className="empty__mark">＋</div>
          <h3>Le carnet est encore vierge.</h3>
          <p>Ajoutez votre premier compagnon pour commencer à consigner son histoire.</p>
          <Link to="/dogs/new" className="btn btn-primary">
            Ajouter mon premier chien
          </Link>
        </div>
      ) : (
        <div className="dog-grid">
          {dogs.map((dog, i) => (
            <DogCard key={dog.id} dog={dog} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
