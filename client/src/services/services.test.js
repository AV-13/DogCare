import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dogService from './dogService';
import * as eventService from './eventService';

const mockOk = (data) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });

describe('dogService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(global, 'fetch').mockReturnValue(mockOk({ success: true, data: [] }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getDogs hits /dogs', async () => {
    await dogService.getDogs();
    expect(global.fetch).toHaveBeenCalledWith('/api/dogs', expect.any(Object));
  });

  it('getDog hits /dogs/:id', async () => {
    await dogService.getDog('abc');
    expect(global.fetch).toHaveBeenCalledWith('/api/dogs/abc', expect.any(Object));
  });

  it('createDog POSTs the dog data', async () => {
    await dogService.createDog({ name: 'Rex' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ name: 'Rex' }));
  });

  it('updateDog PUTs to /dogs/:id', async () => {
    await dogService.updateDog('abc', { name: 'Bella' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/abc');
    expect(opts.method).toBe('PUT');
  });

  it('deleteDog DELETEs /dogs/:id', async () => {
    await dogService.deleteDog('abc');
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/abc');
    expect(opts.method).toBe('DELETE');
  });

  it('uploadPhoto sends FormData to /dogs/:id/photo', async () => {
    const file = new Blob(['x'], { type: 'image/jpeg' });
    await dogService.uploadPhoto('abc', file);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/abc/photo');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get('photo')).toBeInstanceOf(Blob);
  });

  it('getUpcomingVaccines hits /dogs/vaccines/upcoming', async () => {
    await dogService.getUpcomingVaccines();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs/vaccines/upcoming',
      expect.any(Object)
    );
  });
});

describe('eventService', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockReturnValue(mockOk({ success: true, data: [] }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getEvents without filter', async () => {
    await eventService.getEvents('d1');
    expect(global.fetch).toHaveBeenCalledWith('/api/dogs/d1/events', expect.any(Object));
  });

  it('getEvents with type filter appends ?type=', async () => {
    await eventService.getEvents('d1', 'vaccine');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs/d1/events?type=vaccine',
      expect.any(Object)
    );
  });

  it('createEvent POSTs to the dog events endpoint', async () => {
    await eventService.createEvent('d1', { type: 'walk', title: 'X', event_date: 'd' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/d1/events');
    expect(opts.method).toBe('POST');
  });

  it('updateEvent PUTs to /dogs/:dogId/events/:eventId', async () => {
    await eventService.updateEvent('d1', 'e1', { title: 'X' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/d1/events/e1');
    expect(opts.method).toBe('PUT');
  });

  it('deleteEvent DELETEs the event', async () => {
    await eventService.deleteEvent('d1', 'e1');
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/dogs/d1/events/e1');
    expect(opts.method).toBe('DELETE');
  });

  it('getCalendar appends month query param', async () => {
    await eventService.getCalendar('d1', '2025-06');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs/d1/events/calendar?month=2025-06',
      expect.any(Object)
    );
  });

  it('getHistory uses default page/limit', async () => {
    await eventService.getHistory('d1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs/d1/events/history?page=1&limit=20',
      expect.any(Object)
    );
  });

  it('getHistory passes custom page/limit', async () => {
    await eventService.getHistory('d1', 3, 50);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dogs/d1/events/history?page=3&limit=50',
      expect.any(Object)
    );
  });
});
