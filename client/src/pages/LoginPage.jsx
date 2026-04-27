import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

/**
 * Login page with email and password form.
 * Redirects to the dashboard on successful authentication.
 *
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password });
      authLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-layout__left">
        <Link to="/" className="auth-layout__brand">
          DogCare<span className="brand__dot" />
        </Link>
        <div className="auth-layout__hero">
          <span className="auth-layout__eyebrow">Carnet de santé · No 01</span>
          <h1 className="auth-layout__title">
            Le quotidien de vos chiens, <em>consigné</em> avec soin.
          </h1>
          <p className="auth-layout__lead">
            Vaccins, balades, repas, rendez-vous. Une seule reliure, faite pour durer.
          </p>
        </div>
        <span className="auth-layout__signature">Édition 2026 · Paris</span>
      </aside>

      <section className="auth-layout__right">
        <div className="auth-card">
          <h2 className="auth-card__title">Bon retour.</h2>
          <p className="auth-card__sub">Connectez-vous pour ouvrir votre carnet.</p>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
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
              />
            </div>
            <button type="submit" className="btn btn-primary btn--block">
              Se connecter
            </button>
          </form>
          <p className="auth-card__switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
