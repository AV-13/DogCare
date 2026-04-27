const request = require('supertest');
const app = require('../src/app');
const { pool, cleanDb, createUserAndToken, createDog } = require('./helpers');

let user;
let token;

beforeEach(async () => {
  await cleanDb();
  const created = await createUserAndToken();
  user = created.user;
  token = created.token;
});

afterAll(async () => {
  await pool.end();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('GET /api/dogs', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/dogs');
    expect(res.status).toBe(401);
  });

  it('returns the dogs of the current user only', async () => {
    const other = await createUserAndToken();
    await createDog(user.id, { name: 'Rex' });
    await createDog(user.id, { name: 'Bella' });
    await createDog(other.user.id, { name: 'Médor' });

    const res = await auth(request(app).get('/api/dogs'));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const names = res.body.data.map((d) => d.name).sort();
    expect(names).toEqual(['Bella', 'Rex']);
  });

  it('includes upcoming_events_count for each dog', async () => {
    const dog = await createDog(user.id);
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const past = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date) VALUES
       ($1, 'walk', 'futur 1', $2),
       ($1, 'walk', 'futur 2', $2),
       ($1, 'walk', 'passé', $3)`,
      [dog.id, future, past]
    );

    const res = await auth(request(app).get('/api/dogs'));
    expect(Number(res.body.data[0].upcoming_events_count)).toBe(2);
  });
});

describe('POST /api/dogs', () => {
  it('creates a dog for the authenticated user', async () => {
    const res = await auth(
      request(app)
        .post('/api/dogs')
        .send({ name: 'Rex', breed: 'Labrador', birth_date: '2020-01-01', weight_kg: 28.5 })
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Rex',
      breed: 'Labrador',
      user_id: user.id,
    });
    expect(Number(res.body.data.weight_kg)).toBeCloseTo(28.5);
  });

  it('rejects an empty name', async () => {
    const res = await auth(request(app).post('/api/dogs').send({ name: '' }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid weight', async () => {
    const res = await auth(
      request(app).post('/api/dogs').send({ name: 'Rex', weight_kg: 999 })
    );
    expect(res.status).toBe(400);
  });

  it('rejects an invalid birth_date', async () => {
    const res = await auth(
      request(app).post('/api/dogs').send({ name: 'Rex', birth_date: 'not-a-date' })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/dogs/:id', () => {
  it('returns the dog with its 5 most recent events', async () => {
    const dog = await createDog(user.id);
    for (let i = 0; i < 7; i += 1) {
      await pool.query(
        `INSERT INTO events (dog_id, type, title, event_date)
         VALUES ($1, 'walk', $2, NOW() - ($3 || ' hours')::interval)`,
        [dog.id, `Event ${i}`, i]
      );
    }

    const res = await auth(request(app).get(`/api/dogs/${dog.id}`));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(dog.id);
    expect(res.body.data.recent_events).toHaveLength(5);
  });

  it('returns 404 for an unknown dog', async () => {
    const res = await auth(
      request(app).get('/api/dogs/00000000-0000-0000-0000-000000000000')
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 when accessing another user dog', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);

    const res = await auth(request(app).get(`/api/dogs/${otherDog.id}`));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('PUT /api/dogs/:id', () => {
  it('updates only the provided fields', async () => {
    const dog = await createDog(user.id, { name: 'Rex', breed: 'Husky' });

    const res = await auth(
      request(app).put(`/api/dogs/${dog.id}`).send({ name: 'Bella' })
    );

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Bella');
    expect(res.body.data.breed).toBe('Husky');
  });

  it('returns 403 when updating another user dog', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);

    const res = await auth(
      request(app).put(`/api/dogs/${otherDog.id}`).send({ name: 'Hacked' })
    );
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/dogs/:id', () => {
  it('deletes the dog and returns success', async () => {
    const dog = await createDog(user.id);

    const res = await auth(request(app).delete(`/api/dogs/${dog.id}`));

    expect(res.status).toBe(200);
    const check = await pool.query('SELECT id FROM dogs WHERE id = $1', [dog.id]);
    expect(check.rows).toHaveLength(0);
  });

  it('cascades and deletes events too', async () => {
    const dog = await createDog(user.id);
    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date) VALUES ($1, 'walk', 'x', NOW())`,
      [dog.id]
    );

    await auth(request(app).delete(`/api/dogs/${dog.id}`));

    const check = await pool.query('SELECT id FROM events WHERE dog_id = $1', [dog.id]);
    expect(check.rows).toHaveLength(0);
  });

  it('returns 403 when deleting another user dog', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);

    const res = await auth(request(app).delete(`/api/dogs/${otherDog.id}`));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/dogs/vaccines/upcoming', () => {
  it('returns upcoming vaccines (within 30 days) and overdue ones', async () => {
    const dog = await createDog(user.id, { name: 'Rex' });
    const today = new Date();
    const inFiveDays = new Date(today.getTime() + 5 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    const inOneHundredDays = new Date(today.getTime() + 100 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    const yesterday = new Date(today.getTime() - 1 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];

    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date, next_due_date) VALUES
       ($1, 'vaccine', 'Bientôt', NOW(), $2),
       ($1, 'vaccine', 'Trop loin', NOW(), $3),
       ($1, 'vaccine', 'Retard', NOW(), $4),
       ($1, 'walk', 'Promenade', NOW(), null)`,
      [dog.id, inFiveDays, inOneHundredDays, yesterday]
    );

    const res = await auth(request(app).get('/api/dogs/vaccines/upcoming'));

    expect(res.status).toBe(200);
    const titles = res.body.data.map((v) => v.title).sort();
    expect(titles).toEqual(['Bientôt', 'Retard']);
    const overdue = res.body.data.find((v) => v.title === 'Retard');
    expect(overdue.status).toBe('overdue');
    const upcoming = res.body.data.find((v) => v.title === 'Bientôt');
    expect(upcoming.status).toBe('upcoming');
  });

  it('only returns vaccines belonging to the current user', async () => {
    const other = await createUserAndToken();
    const otherDog = await createDog(other.user.id);
    const inFiveDays = new Date(Date.now() + 5 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    await pool.query(
      `INSERT INTO events (dog_id, type, title, event_date, next_due_date)
       VALUES ($1, 'vaccine', 'Pas pour moi', NOW(), $2)`,
      [otherDog.id, inFiveDays]
    );

    const res = await auth(request(app).get('/api/dogs/vaccines/upcoming'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
