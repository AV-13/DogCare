const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool, cleanDb } = require('./helpers');

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns a JWT + user data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'secret12345', first_name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      email: 'alice@example.com',
      first_name: 'Alice',
    });
    expect(res.body.data.user).not.toHaveProperty('password_hash');

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(res.body.data.user.id);
    expect(decoded.email).toBe('alice@example.com');
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'secret12345', first_name: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'short', first_name: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty first_name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'longenough', first_name: '   ' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when the email is already taken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'longpassword', first_name: 'A' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'otherpassword', first_name: 'B' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'mypassword', first_name: 'Bob' });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('bob@example.com');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 with a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  it('rejects a missing password (validation)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
