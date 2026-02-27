import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DogDetail from './pages/DogDetail';
import DogForm from './pages/DogForm';
import EventForm from './pages/EventForm';
import CalendarView from './pages/CalendarView';
import HistoryView from './pages/HistoryView';

/**
 * Root application component.
 * Sets up authentication context and client-side routing.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dogs/new" element={<DogForm />} />
              <Route path="/dogs/:id" element={<DogDetail />} />
              <Route path="/dogs/:id/edit" element={<DogForm />} />
              <Route path="/dogs/:id/events/new" element={<EventForm />} />
              <Route path="/dogs/:id/calendar" element={<CalendarView />} />
              <Route path="/dogs/:id/history" element={<HistoryView />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
