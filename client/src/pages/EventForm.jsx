import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../services/eventService';

const TYPES = [
  { value: 'walk',    label: 'Balade',     color: 'var(--moss-2)' },
  { value: 'vaccine', label: 'Vaccin',     color: 'var(--terracotta-2)' },
  { value: 'meal',    label: 'Repas',      color: 'var(--ochre-2)' },
  { value: 'vet',     label: 'Vétérinaire',color: 'var(--plum-2)' },
];

/**
 * Form page for creating a new event for a dog.
 *
 * @returns {JSX.Element}
 */
export default function EventForm() {
  const { id: dogId } = useParams();
  const navigate = useNavigate();

  const [type, setType] = useState('walk');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const data = {
      type,
      title,
      event_date: new Date(eventDate).toISOString(),
    };
    if (description) data.description = description;
    if (type === 'vaccine' && nextDueDate) data.next_due_date = nextDueDate;

    try {
      await createEvent(dogId, data);
      navigate(`/dogs/${dogId}`);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <div>
      <Link to={`/dogs/${dogId}`} className="back-link">Retour</Link>

      <header className="page-head">
        <div className="page-head__left">
          <span className="eyebrow">Nouvelle entrée</span>
          <h1>
            Ajouter <span className="serif-italic">un événement.</span>
          </h1>
        </div>
      </header>

      <div className="card" style={{ maxWidth: 560 }}>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type *</label>
            <div className="type-pills" role="radiogroup">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={type === t.value}
                  className={`type-pill ${type === t.value ? 'type-pill--active' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  <span className="type-pill__dot" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vaccin rage, balade en forêt…"
              required
              maxLength={255}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quelques notes pour s'en souvenir…"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="eventDate">Date et heure *</label>
            <input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          {type === 'vaccine' && (
            <div className="form-group">
              <label htmlFor="nextDueDate">Date du prochain rappel</label>
              <input
                id="nextDueDate"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn--block">
            Consigner l'événement
          </button>
        </form>
      </div>
    </div>
  );
}
