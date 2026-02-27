const pool = require('../pool');

/**
 * Find a user by their email address.
 *
 * @param {string} email - The email to search for
 * @returns {Promise<Object|undefined>} The user row or undefined
 */
const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

/**
 * Find a user by their UUID.
 *
 * @param {string} id - The user UUID
 * @returns {Promise<Object|undefined>} The user row or undefined
 */
const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, first_name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

/**
 * Create a new user in the database.
 *
 * @param {Object} params
 * @param {string} params.email - The user's email
 * @param {string} params.passwordHash - The bcrypt-hashed password
 * @param {string} params.firstName - The user's first name
 * @returns {Promise<Object>} The created user (without password_hash)
 */
const create = async ({ email, passwordHash, firstName }) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, first_name, created_at, updated_at`,
    [email, passwordHash, firstName]
  );
  return result.rows[0];
};

module.exports = { findByEmail, findById, create };
