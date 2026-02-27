const pool = require('../pool');

/**
 * Find all dogs belonging to a user, with upcoming events count.
 *
 * @param {string} userId - The owner's UUID
 * @returns {Promise<Object[]>} Array of dog rows with upcoming_events_count
 */
const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT d.*,
            COUNT(e.id) FILTER (WHERE e.event_date > NOW()) AS upcoming_events_count
     FROM dogs d
     LEFT JOIN events e ON e.dog_id = d.id
     WHERE d.user_id = $1
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Find a single dog by its UUID.
 *
 * @param {string} id - The dog's UUID
 * @returns {Promise<Object|undefined>} The dog row or undefined
 */
const findById = async (id) => {
  const result = await pool.query('SELECT * FROM dogs WHERE id = $1', [id]);
  return result.rows[0];
};

/**
 * Create a new dog.
 *
 * @param {Object} params
 * @param {string} params.userId - The owner's UUID
 * @param {string} params.name - The dog's name
 * @param {string} [params.breed] - The dog's breed
 * @param {string} [params.birthDate] - The dog's birth date (YYYY-MM-DD)
 * @param {number} [params.weightKg] - The dog's weight in kg
 * @returns {Promise<Object>} The created dog row
 */
const create = async ({ userId, name, breed, birthDate, weightKg }) => {
  const result = await pool.query(
    `INSERT INTO dogs (user_id, name, breed, birth_date, weight_kg)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, breed || null, birthDate || null, weightKg || null]
  );
  return result.rows[0];
};

/**
 * Update a dog's fields dynamically.
 *
 * @param {string} id - The dog's UUID
 * @param {Object} fields - Key-value pairs of columns to update
 * @returns {Promise<Object>} The updated dog row
 */
const update = async (id, fields) => {
  const entries = Object.entries(fields);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`);
  setClauses.push(`updated_at = NOW()`);
  const values = entries.map(([, val]) => val);
  values.push(id);

  const result = await pool.query(
    `UPDATE dogs SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete a dog by its UUID.
 *
 * @param {string} id - The dog's UUID
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  await pool.query('DELETE FROM dogs WHERE id = $1', [id]);
};

module.exports = { findByUserId, findById, create, update, remove };
