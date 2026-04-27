import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

const makeJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

const setup = (route = '/') =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<div>Page de login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Contenu privé</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when no token is present', async () => {
    setup('/');
    expect(await screen.findByText('Page de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenu privé')).not.toBeInTheDocument();
  });

  it('renders the protected content when a token is present', async () => {
    localStorage.setItem('token', makeJwt({ userId: '1', email: 'a@b.com' }));
    setup('/');
    expect(await screen.findByText('Contenu privé')).toBeInTheDocument();
  });
});
