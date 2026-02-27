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

  /**
   * Handle form submission: call login API and store the token.
   *
   * @param {React.FormEvent} e
   */
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
    <div style={styles.wrapper}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Connexion</h1>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Se connecter
          </button>
        </form>
        <p style={styles.link}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#2c3e50',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
};
