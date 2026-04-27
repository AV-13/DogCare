import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const makeJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no token when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('login() stores the token in localStorage and updates state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const token = makeJwt({ userId: '1', email: 'a@b.com' });

    await act(async () => {
      result.current.login(token, { id: '1', email: 'a@b.com', first_name: 'Alice' });
    });

    expect(localStorage.getItem('token')).toBe(token);
    expect(result.current.token).toBe(token);
    expect(result.current.user).toEqual({ userId: '1', email: 'a@b.com' });
  });

  it('logout() clears the token from localStorage and from state', () => {
    localStorage.setItem('token', 'jwt-existing');
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('parses the JWT payload on mount and exposes user info', async () => {
    const token = makeJwt({ userId: '42', email: 'x@y.com' });
    localStorage.setItem('token', token);

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    rerender();
    await act(async () => {});

    expect(result.current.user).toEqual({ userId: '42', email: 'x@y.com' });
  });

  it('clears a malformed token from localStorage', async () => {
    localStorage.setItem('token', 'not-a-jwt');
    const Probe = () => {
      const { token } = useAuth();
      return <div data-testid="token">{token === null ? 'null' : token}</div>;
    };
    const { findByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    const el = await findByTestId('token');
    expect(el.textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
