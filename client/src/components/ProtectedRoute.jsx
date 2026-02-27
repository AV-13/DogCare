import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that redirects unauthenticated users to the login page.
 * Renders child routes via Outlet when the user is authenticated.
 *
 * @returns {JSX.Element}
 */
export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
}
