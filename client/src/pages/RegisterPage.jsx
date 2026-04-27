import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';

/**
 * Registration page with email, password, and first name form.
 *
 * @returns {JSX.Element}
 */
export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await register({ email, password, first_name: firstName });
      authLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-layout__left">
        <Link to="/" className="auth-layout__brand">
          DogCare<span className="brand__dot" />
        </Link>
        <div className="auth-layout__hero">
          <span className="auth-layout__eyebrow">Première édition</span>
          <h1 className="auth-layout__title">
            Ouvrez le <em>carnet</em> de votre compagnon.
          </h1>
          <p className="auth-layout__lead">
            Quelques secondes suffisent. Ensuite, chaque promenade, chaque vaccin,
            chaque rendez-vous trouve sa page.
          </p>
        </div>
        <span className="auth-layout__signature">Édition 2026 · Paris</span>
      </aside>

      <section className="auth-layout__right">
        <div className="auth-card">
          <h2 className="auth-card__title">Créer un compte.</h2>
          <p className="auth-card__sub">Le premier chapitre commence ici.</p>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">Prénom</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marie"
                required
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <small>Minimum 8 caractères</small>
            </div>
            <button type="submit" className="btn btn-primary btn--block">
              S'inscrire
            </button>
          </form>
          <p className="auth-card__switch">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
