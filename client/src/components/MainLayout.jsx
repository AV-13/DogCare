import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Layout wrapper for authenticated pages.
 * Renders the Navbar and the current route's content via Outlet.
 *
 * @returns {JSX.Element}
 */
export default function MainLayout() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
