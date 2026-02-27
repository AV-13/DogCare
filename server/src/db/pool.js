const { Pool } = require('pg');

/**
 * PostgreSQL connection pool configured from environment variables.
 *
 * @type {import('pg').Pool}
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
