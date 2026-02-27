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

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h1 className="page-title">Mes chiens</h1>
        <Link to="/dogs/new" className="btn btn-primary">
          + Ajouter un chien
        </Link>
      </div>

      <VaccineAlertBanner />

      {dogs.length === 0 ? (
        <div className="card" style={styles.empty}>
          <p>Vous n'avez pas encore ajouté de chien.</p>
          <Link to="/dogs/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Ajouter mon premier chien
          </Link>
        </div>
      ) : (
        dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: '#888',
  },
};
