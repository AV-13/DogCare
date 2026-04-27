import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './RegisterPage';
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
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Page login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the form fields', () => {
    setup();
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeInTheDocument();
  });

  it('calls register() with the form data on submit', async () => {
    const token = makeJwt({ userId: '1', email: 'a@b.com' });
    vi.spyOn(authService, 'register').mockResolvedValue({
      data: { token, user: { id: '1', email: 'a@b.com', first_name: 'Alice' } },
    });

    setup();
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'longpass' } });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'longpass',
        first_name: 'Alice',
      });
    });
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('displays the API error message on failure', async () => {
    vi.spyOn(authService, 'register').mockRejectedValue({ message: 'Email already in use' });

    setup();
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'longpass' } });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/login');
  });
});
