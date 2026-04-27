import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import * as authService from '../services/authService';

const makeJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

const setup = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/register" element={<div>Page register</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the form fields and submit button', () => {
    setup();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('calls login() and redirects to dashboard on success', async () => {
    const token = makeJwt({ userId: '1', email: 'a@b.com' });
    vi.spyOn(authService, 'login').mockResolvedValue({
      data: { token, user: { id: '1', email: 'a@b.com', first_name: 'A' } },
    });

    setup();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'secret123',
      });
    });
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('displays the error message when login fails', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue({ message: 'Invalid email or password' });

    setup();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('shows a default error message when error has no message field', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue({});

    setup();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Erreur de connexion')).toBeInTheDocument();
  });

  it('has a link to the register page', () => {
    setup();
    const link = screen.getByRole('link', { name: 'Créer un compte' });
    expect(link).toHaveAttribute('href', '/register');
  });
});
