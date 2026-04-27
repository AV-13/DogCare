const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../src/db/pool');

/**
 * Truncate all data tables between tests so each test starts from a clean state.
 */
const cleanDb = async () => {
  await pool.query('TRUNCATE TABLE events, dogs, users RESTART IDENTITY CASCADE');
};

/**
 * Insert a user directly in DB and return the row + a signed JWT.
 *
 * @param {Object} [overrides]
 * @returns {Promise<{ user: Object, token: string }>}
 */
const createUserAndToken = async (overrides = {}) => {
  const email = overrides.email || `user-${Date.now()}-${Math.random()}@example.com`;
  const password = overrides.password || 'password123';
  const firstName = overrides.first_name || 'Tester';
  const passwordHash = await bcrypt.hash(password, 4);

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, first_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, first_name, created_at`,
    [email, passwordHash, firstName]
  );
  const user = rows[0];

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token, password };
};

/**
 * Insert a dog directly in DB.
 */
const createDog = async (userId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO dogs (user_id, name, breed, birth_date, weight_kg)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      overrides.name || 'Rex',
      overrides.breed || null,
      overrides.birth_date || null,
      overrides.weight_kg || null,
    ]
  );
  return rows[0];
};

/**
 * Insert an event directly in DB.
 */
const createEvent = async (dogId, overrides = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO events (dog_id, type, title, description, event_date, next_due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      dogId,
      overrides.type || 'walk',
      overrides.title || 'Test event',
      overrides.description || null,
      overrides.event_date || new Date().toISOString(),
      overrides.next_due_date || null,
    ]
  );
  return rows[0];
};

module.exports = { pool, cleanDb, createUserAndToken, createDog, createEvent };
