const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

module.exports = async () => {
  const envPath = path.join(__dirname, '..', '.env.test');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }

  const dbName = process.env.DB_NAME || 'dogcare_test';
  const baseConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  const adminPool = new Pool({ ...baseConfig, database: 'postgres' });
  try {
    const { rows } = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
    }
  } finally {
    await adminPool.end();
  }

  const testPool = new Pool({ ...baseConfig, database: dbName });
  try {
    const { rows } = await testPool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'"
    );
    if (rows.length === 0) {
      const initSql = fs.readFileSync(
        path.join(__dirname, '..', 'src', 'db', 'init.sql'),
        'utf-8'
      );
      await testPool.query(initSql);
    }
  } finally {
    await testPool.end();
  }
};
