import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import * as AuthContext from '../context/AuthContext';

const setup = (authValue) => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: authValue.user || null,
    token: authValue.token || null,
    loading: false,
    login: vi.fn(),
    logout: authValue.logout || vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Navbar />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the brand name and a logout button', () => {
    setup({});
    expect(screen.getByText('DogCare')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });

  it('shows the user first_name when available', () => {
    setup({ user: { first_name: 'Alice', email: 'a@b.com' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('falls back to email when first_name is missing', () => {
    setup({ user: { email: 'noname@x.com' } });
    expect(screen.getByText('noname@x.com')).toBeInTheDocument();
  });

  it('clicking logout calls logout() and navigates to /login', async () => {
    const logout = vi.fn();
    setup({ user: { first_name: 'Alice', email: 'a@b.com' }, logout });

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));

    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
