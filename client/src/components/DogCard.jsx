import { Link } from 'react-router-dom';

/**
 * Displays a card with summary information about a dog.
 *
 * @param {Object} props
 * @param {Object} props.dog - The dog object
 * @param {string} props.dog.id - The dog's UUID
 * @param {string} props.dog.name - The dog's name
 * @param {string} [props.dog.breed] - The dog's breed
 * @param {string} [props.dog.photo_url] - Optional photo URL
 * @param {number|string} props.dog.upcoming_events_count - Number of upcoming events
 * @returns {JSX.Element}
 */
export default function DogCard({ dog }) {
  return (
    <Link to={`/dogs/${dog.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={styles.card}>
        <div style={styles.photoContainer}>
          {dog.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} style={styles.photo} />
          ) : (
            <div style={styles.placeholder}>🐕</div>
          )}
        </div>
        <div style={styles.info}>
          <h3 style={styles.name}>{dog.name}</h3>
          {dog.breed && <p style={styles.breed}>{dog.breed}</p>}
          {Number(dog.upcoming_events_count) > 0 && (
            <span className="badge badge-vaccine">
              {dog.upcoming_events_count} à venir
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  photoContainer: {
    width: 70,
    height: 70,
    borderRadius: '50%',
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
    fontSize: '2rem',
  },
  info: {
    flex: 1,
  },
  name: {
    margin: 0,
    fontSize: '1.1rem',
  },
  breed: {
    margin: '0.2rem 0',
    color: '#777',
    fontSize: '0.9rem',
  },
};
