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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        DogCare<span className="brand__dot" />
        <span className="brand__sub">Carnet de santé</span>
      </Link>
      <div className="navbar__right">
        {user && <span className="navbar__user">{user.first_name || user.email}</span>}
        <button onClick={handleLogout} className="btn btn-ghost">
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
