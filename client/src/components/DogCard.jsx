import { Link } from 'react-router-dom';

/**
 * Displays a card with summary information about a dog.
 *
 * @param {Object} props
 * @param {Object} props.dog
 * @param {number} [props.index]
 */
export default function DogCard({ dog, index = 0 }) {
  const monogram = (dog.name || '?').trim().charAt(0).toUpperCase();
  const upcoming = Number(dog.upcoming_events_count) || 0;

  return (
    <Link
      to={`/dogs/${dog.id}`}
      className="dog-card"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className={`dog-card__photo ${dog.photo_url ? '' : 'dog-card__photo--placeholder'}`}>
        {dog.photo_url ? (
          <img src={dog.photo_url} alt={dog.name} />
        ) : (
          <span className="dog-card__monogram">{monogram}</span>
        )}
      </div>
      <div className="dog-card__body">
        <div>
          <h3 className="dog-card__name">{dog.name}</h3>
          {dog.breed && <p className="dog-card__breed">{dog.breed}</p>}
        </div>
        {upcoming > 0 && (
          <div className="dog-card__count">
            <span className="dog-card__count-num">{upcoming}</span>
            <span className="dog-card__count-label">à venir</span>
          </div>
        )}
      </div>
    </Link>
  );
}
