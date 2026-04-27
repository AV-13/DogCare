import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

describe('api helper', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockOk = (data) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });

  const mockErr = (status, error) =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ success: false, error }),
    });

  it('GET sends the request to /api + endpoint', async () => {
    global.fetch.mockReturnValue(mockOk({ success: true, data: [] }));
    await api.get('/dogs');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });

  it('attaches the Authorization header when a token is in localStorage', async () => {
    localStorage.setItem('token', 'jwt-abc');
    global.fetch.mockReturnValue(mockOk({ success: true }));
    await api.get('/dogs');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-abc' }),
      })
    );
  });

  it('POST serializes the body as JSON', async () => {
    global.fetch.mockReturnValue(mockOk({ success: true, data: { id: '1' } }));
    await api.post('/dogs', { name: 'Rex' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Rex' }),
      })
    );
  });

  it('throws the error object on a non-OK response', async () => {
    global.fetch.mockReturnValue(
      mockErr(400, { message: 'Bad', code: 'VALIDATION_ERROR' })
    );
    await expect(api.post('/dogs', {})).rejects.toEqual({
      message: 'Bad',
      code: 'VALIDATION_ERROR',
    });
  });

  it('does NOT redirect on 401 from /auth endpoints', async () => {
    delete window.location;
    window.location = { href: '/login' };
    global.fetch.mockReturnValue(
      mockErr(401, { message: 'Invalid', code: 'UNAUTHORIZED' })
    );
    await expect(api.post('/auth/login', {})).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
  });

  it('upload removes the JSON Content-Type header', async () => {
    global.fetch.mockReturnValue(mockOk({ success: true }));
    const fd = new FormData();
    fd.append('photo', new Blob(['x']), 'x.jpg');
    await api.upload('/dogs/1/photo', fd);
    const call = global.fetch.mock.calls[0][1];
    expect(call.headers['Content-Type']).toBeUndefined();
    expect(call.body).toBe(fd);
  });
});
