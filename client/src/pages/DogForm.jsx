import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createDog, updateDog, getDog, uploadPhoto } from '../services/dogService';

/**
 * Form page for creating or editing a dog.
 * Detects edit mode when an :id param is present in the URL.
 *
 * @returns {JSX.Element}
 */
export default function DogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getDog(id)
      .then((res) => {
        const dog = res.data;
        setName(dog.name);
        setBreed(dog.breed || '');
        setBirthDate(dog.birth_date ? dog.birth_date.split('T')[0] : '');
        setWeightKg(dog.weight_kg || '');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  /**
   * Handle form submission: create or update the dog, then upload photo if provided.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const data = { name };
    if (breed) data.breed = breed;
    if (birthDate) data.birth_date = birthDate;
    if (weightKg) data.weight_kg = parseFloat(weightKg);

    try {
      let dog;
      if (isEdit) {
        const res = await updateDog(id, data);
        dog = res.data;
      } else {
        const res = await createDog(data);
        dog = res.data;
      }

      if (photo) {
        await uploadPhoto(dog.id, photo);
      }

      navigate(`/dogs/${dog.id}`);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <Link to={isEdit ? `/dogs/${id}` : '/'} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour
      </Link>

      <div className="card" style={{ maxWidth: 500 }}>
        <h1 className="page-title">{isEdit ? 'Modifier le chien' : 'Ajouter un chien'}</h1>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="breed">Race</label>
            <input
              id="breed"
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="birthDate">Date de naissance</label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="weightKg">Poids (kg)</label>
            <input
              id="weightKg"
              type="number"
              step="0.1"
              min="0"
              max="200"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="photo">Photo</label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
}
