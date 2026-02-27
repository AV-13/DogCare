import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../services/eventService';

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

  /**
   * Handle form submission: create the event and navigate back to the dog detail page.
   *
   * @param {React.FormEvent} e
   */
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
      <Link to={`/dogs/${dogId}`} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour
      </Link>

      <div className="card" style={{ maxWidth: 500 }}>
        <h1 className="page-title">Ajouter un événement</h1>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="walk">Balade</option>
              <option value="vaccine">Vaccin</option>
              <option value="meal">Repas</option>
              <option value="vet">Vétérinaire</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
