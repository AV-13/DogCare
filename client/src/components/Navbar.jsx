import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Top navigation bar displaying the app name, user's first name, and logout button.
 *
 * @returns {JSX.Element}
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout: clear auth state and redirect to login.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>DogCare</Link>
      <div style={styles.right}>
        {user && <span style={styles.name}>{user.first_name || user.email}</span>}
        <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
  },
  brand: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#4a90d9',
    textDecoration: 'none',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  name: {
    fontWeight: 500,
  },
  logoutBtn: {
    fontSize: '0.85rem',
    padding: '0.4rem 0.8rem',
  },
};
