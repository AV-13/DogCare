import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';

/**
 * Registration page with email, password, and first name form.
 * Redirects to the dashboard on successful registration.
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

  /**
   * Handle form submission: call register API and store the token.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await register({ email, password, first_name: firstName });
      authLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Créer un compte</h1>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">Prénom</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              minLength={8}
            />
            <small style={{ color: '#888' }}>Minimum 8 caractères</small>
          </div>
          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            S'inscrire
          </button>
        </form>
        <p style={styles.link}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
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
