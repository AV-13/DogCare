const request = require('supertest');
const app = require('../src/app');
const {
  pool,
  cleanDb,
  createUserAndToken,
  createDog,
  createEvent,
} = require('./helpers');

let user;
let token;
let dog;

beforeEach(async () => {
  await cleanDb();
  const created = await createUserAndToken();
  user = created.user;
  token = created.token;
  dog = await createDog(user.id);
});

afterAll(async () => {
  await pool.end();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('GET /api/dogs/:dogId/events', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/dogs/${dog.id}/events`);
    expect(res.status).toBe(401);
  });

  it('returns events sorted by event_date desc', async () => {
    await createEvent(dog.id, { title: 'Old', event_date: '2020-01-01T00:00:00Z' });
    await createEvent(dog.id, { title: 'New', event_date: '2025-01-01T00:00:00Z' });
    await createEvent(dog.id, { title: 'Mid', event_date: '2022-06-01T00:00:00Z' });

    const res = await auth(request(app).get(`/api/dogs/${dog.id}/events`));

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.title)).toEqual(['New', 'Mid', 'Old']);
  });

  it('filters events by type via the query param', async () => {
    await createEvent(dog.id, { type: 'walk', title: 'Balade' });
    await createEvent(dog.id, { type: 'vaccine', title: 'Rage' });

    const res = await auth(request(app).get(`/api/dogs/${dog.id}/events?type=vaccine`));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Rage');
  });

  it('returns 403 when listing events of another user dog', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);

    const res = await auth(request(app).get(`/api/dogs/${otherDog.id}/events`));
    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown dog', async () => {
    const res = await auth(
      request(app).get('/api/dogs/00000000-0000-0000-0000-000000000000/events')
    );
    expect(res.status).toBe(404);
  });
});

describe('POST /api/dogs/:dogId/events', () => {
  it('creates a vaccine event with next_due_date', async () => {
    const res = await auth(
      request(app)
        .post(`/api/dogs/${dog.id}/events`)
        .send({
          type: 'vaccine',
          title: 'Vaccin rage',
          description: 'Rappel annuel',
          event_date: '2025-06-15T10:00:00Z',
          next_due_date: '2026-06-15',
        })
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'vaccine',
      title: 'Vaccin rage',
      description: 'Rappel annuel',
      dog_id: dog.id,
    });
    expect(res.body.data.next_due_date).toMatch(/^2026-06-1[45]/);
  });

  it('ignores next_due_date for non-vaccine events', async () => {
    const res = await auth(
      request(app)
        .post(`/api/dogs/${dog.id}/events`)
        .send({
          type: 'walk',
          title: 'Balade',
          event_date: '2025-06-15T10:00:00Z',
          next_due_date: '2026-06-15',
        })
    );

    expect(res.status).toBe(201);
    expect(res.body.data.next_due_date).toBeNull();
  });

  it('rejects an invalid type', async () => {
    const res = await auth(
      request(app)
        .post(`/api/dogs/${dog.id}/events`)
        .send({ type: 'invalid', title: 'Foo', event_date: '2025-01-01' })
    );

    expect(res.status).toBe(400);
  });

  it('rejects a missing title', async () => {
    const res = await auth(
      request(app)
        .post(`/api/dogs/${dog.id}/events`)
        .send({ type: 'walk', title: '', event_date: '2025-01-01' })
    );

    expect(res.status).toBe(400);
  });

  it('rejects an invalid event_date', async () => {
    const res = await auth(
      request(app)
        .post(`/api/dogs/${dog.id}/events`)
        .send({ type: 'walk', title: 'Balade', event_date: 'pas-une-date' })
    );

    expect(res.status).toBe(400);
  });

  it('returns 403 when creating an event for another user dog', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);

    const res = await auth(
      request(app)
        .post(`/api/dogs/${otherDog.id}/events`)
        .send({ type: 'walk', title: 'Balade', event_date: '2025-01-01' })
    );

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/dogs/:dogId/events/:eventId', () => {
  it('updates allowed fields', async () => {
    const event = await createEvent(dog.id, { title: 'Old' });

    const res = await auth(
      request(app)
        .put(`/api/dogs/${dog.id}/events/${event.id}`)
        .send({ title: 'New', description: 'updated' })
    );

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New');
    expect(res.body.data.description).toBe('updated');
  });

  it('rejects attempts to change the type', async () => {
    const event = await createEvent(dog.id, { type: 'walk' });

    const res = await auth(
      request(app)
        .put(`/api/dogs/${dog.id}/events/${event.id}`)
        .send({ type: 'vaccine' })
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when the event does not belong to the dog', async () => {
    const otherDog = await createDog(user.id);
    const event = await createEvent(otherDog.id);

    const res = await auth(
      request(app)
        .put(`/api/dogs/${dog.id}/events/${event.id}`)
        .send({ title: 'X' })
    );

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/dogs/:dogId/events/:eventId', () => {
  it('deletes an event', async () => {
    const event = await createEvent(dog.id);

    const res = await auth(
      request(app).delete(`/api/dogs/${dog.id}/events/${event.id}`)
    );

    expect(res.status).toBe(200);
    const check = await pool.query('SELECT id FROM events WHERE id = $1', [event.id]);
    expect(check.rows).toHaveLength(0);
  });

  it('returns 404 when deleting an event from a different dog', async () => {
    const otherDog = await createDog(user.id);
    const event = await createEvent(otherDog.id);

    const res = await auth(
      request(app).delete(`/api/dogs/${dog.id}/events/${event.id}`)
    );

    expect(res.status).toBe(404);
  });
});

describe('GET /api/dogs/:dogId/events/calendar', () => {
  it('returns events grouped by day for the requested month', async () => {
    await createEvent(dog.id, {
      title: 'Le 3',
      event_date: '2025-06-03T10:00:00Z',
    });
    await createEvent(dog.id, {
      title: 'Le 15',
      event_date: '2025-06-15T10:00:00Z',
    });
    await createEvent(dog.id, {
      title: 'Mois différent',
      event_date: '2025-07-01T10:00:00Z',
    });

    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/calendar?month=2025-06`)
    );

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(['2025-06-03', '2025-06-15']);
  });

  it('rejects an invalid month format', async () => {
    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/calendar?month=2025/06`)
    );
    expect(res.status).toBe(400);
  });

  it('rejects when month parameter is missing', async () => {
    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/calendar`)
    );
    expect(res.status).toBe(400);
  });

  it('handles December rollover into next year', async () => {
    await createEvent(dog.id, {
      title: 'Décembre',
      event_date: '2025-12-15T10:00:00Z',
    });
    await createEvent(dog.id, {
      title: 'Janvier',
      event_date: '2026-01-05T10:00:00Z',
    });

    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/calendar?month=2025-12`)
    );

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toEqual(['2025-12-15']);
  });
});

describe('GET /api/dogs/:dogId/events/history', () => {
  it('returns paginated past events with pagination metadata', async () => {
    for (let i = 0; i < 25; i += 1) {
      await pool.query(
        `INSERT INTO events (dog_id, type, title, event_date)
         VALUES ($1, 'walk', $2, NOW() - ($3 || ' hours')::interval)`,
        [dog.id, `Past ${i}`, i + 1]
      );
    }

    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/history?page=1&limit=10`)
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('only includes past events, not future ones', async () => {
    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date)
       VALUES ($1, 'walk', 'futur', NOW() + INTERVAL '5 days')`,
      [dog.id]
    );
    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date)
       VALUES ($1, 'walk', 'passé', NOW() - INTERVAL '5 days')`,
      [dog.id]
    );

    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/history`)
    );

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('passé');
  });

  it('caps the limit at 100', async () => {
    const res = await auth(
      request(app).get(`/api/dogs/${dog.id}/events/history?limit=9999`)
    );
    expect(res.body.pagination.limit).toBe(100);
  });
});
