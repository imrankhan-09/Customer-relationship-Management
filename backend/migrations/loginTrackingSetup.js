const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Starting Login Tracking Migration ---');
    await client.query('BEGIN');

    // 1. Add last_login to users table
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_login'
    `);

    if (colCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN last_login TIMESTAMP`);
      console.log('✅ last_login column added to users table');
    } else {
      console.log('ℹ️ last_login column already exists');
    }

    // 2. Create login_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(150),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        device_info TEXT,
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ login_logs table created');

    await client.query('COMMIT');
    console.log('--- Login Tracking Migration Complete ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runMigration();
