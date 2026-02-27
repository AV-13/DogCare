const pool = require('../pool');

/**
 * Find all events for a dog, optionally filtered by type.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} [type] - Optional event type filter ('vaccine', 'walk', 'meal', 'vet')
 * @returns {Promise<Object[]>} Array of event rows
 */
const findByDogId = async (dogId, type) => {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE dog_id = $1
       AND ($2::event_type IS NULL OR type = $2)
     ORDER BY event_date DESC`,
    [dogId, type || null]
  );
  return result.rows;
};

/**
 * Find recent events for a dog (last 5).
 *
 * @param {string} dogId - The dog's UUID
 * @returns {Promise<Object[]>} Array of the 5 most recent event rows
 */
const findRecentByDogId = async (dogId) => {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE dog_id = $1
     ORDER BY event_date DESC
     LIMIT 5`,
    [dogId]
  );
  return result.rows;
};

/**
 * Find a single event by its UUID.
 *
 * @param {string} id - The event's UUID
 * @returns {Promise<Object|undefined>} The event row or undefined
 */
const findById = async (id) => {
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return result.rows[0];
};

/**
 * Create a new event for a dog.
 *
 * @param {Object} params
 * @param {string} params.dogId - The dog's UUID
 * @param {string} params.type - The event type
 * @param {string} params.title - The event title
 * @param {string} [params.description] - Optional description
 * @param {string} params.eventDate - ISO 8601 date string
 * @param {string} [params.nextDueDate] - Optional next due date (vaccines only)
 * @returns {Promise<Object>} The created event row
 */
const create = async ({ dogId, type, title, description, eventDate, nextDueDate }) => {
  const result = await pool.query(
    `INSERT INTO events (dog_id, type, title, description, event_date, next_due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [dogId, type, title, description || null, eventDate, type === 'vaccine' ? nextDueDate || null : null]
  );
  return result.rows[0];
};

/**
 * Update an event's fields dynamically. The 'type' column cannot be changed.
 *
 * @param {string} id - The event's UUID
 * @param {Object} fields - Key-value pairs of columns to update (excluding 'type')
 * @returns {Promise<Object>} The updated event row
 */
const update = async (id, fields) => {
  const entries = Object.entries(fields);
  if (entries.length === 0) return findById(id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`);
  setClauses.push(`updated_at = NOW()`);
  const values = entries.map(([, val]) => val);
  values.push(id);

  const result = await pool.query(
    `UPDATE events SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete an event by its UUID.
 *
 * @param {string} id - The event's UUID
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  await pool.query('DELETE FROM events WHERE id = $1', [id]);
};

/**
 * Find all events for a dog within a given month (for calendar view).
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} startDate - Start of the month (ISO string)
 * @param {string} endDate - Start of the next month (ISO string)
 * @returns {Promise<Object[]>} Array of event rows within the month
 */
const findByMonth = async (dogId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT * FROM events
     WHERE dog_id = $1
       AND event_date >= $2
       AND event_date < $3
     ORDER BY event_date ASC`,
    [dogId, startDate, endDate]
  );
  return result.rows;
};

/**
 * Find past events for a dog with pagination (for history view).
 *
 * @param {string} dogId - The dog's UUID
 * @param {number} limit - Maximum number of results
 * @param {number} offset - Number of rows to skip
 * @returns {Promise<{rows: Object[], total: number}>} Paginated result with total count
 */
const findHistory = async (dogId, limit, offset) => {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM events WHERE dog_id = $1 AND event_date < NOW()',
    [dogId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT * FROM events
     WHERE dog_id = $1 AND event_date < NOW()
     ORDER BY event_date DESC
     LIMIT $2 OFFSET $3`,
    [dogId, limit, offset]
  );

  return { rows: result.rows, total };
};

/**
 * Find upcoming or overdue vaccine reminders for all dogs of a user.
 * Returns vaccines whose next_due_date is within 30 days or already past.
 *
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object[]>} Array of vaccine reminder objects
 */
const findUpcomingVaccines = async (userId) => {
  const result = await pool.query(
    `SELECT
       d.name AS dog_name,
       d.id AS dog_id,
       e.id AS event_id,
       e.title,
       e.next_due_date,
       (e.next_due_date - CURRENT_DATE) AS days_remaining,
       CASE
         WHEN e.next_due_date < CURRENT_DATE THEN 'overdue'
         ELSE 'upcoming'
       END AS status
     FROM events e
     JOIN dogs d ON d.id = e.dog_id
     WHERE d.user_id = $1
       AND e.type = 'vaccine'
       AND e.next_due_date IS NOT NULL
       AND e.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
     ORDER BY e.next_due_date ASC`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  findByDogId,
  findRecentByDogId,
  findById,
  create,
  update,
  remove,
  findByMonth,
  findHistory,
  findUpcomingVaccines,
};
