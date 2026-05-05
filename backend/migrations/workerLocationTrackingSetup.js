const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Starting Worker Location Tracking Migration ---');
    await client.query('BEGIN');

    // 1. Update users table with tracking fields
    console.log('Updating users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_tracking_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS last_latitude DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS last_longitude DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS last_location_time TIMESTAMP;
    `);
    console.log('✅ Users table updated');

    // 2. Create worker_locations table
    console.log('Creating worker_locations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS worker_locations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        accuracy DECIMAL(10,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ worker_locations table created');

    // 3. Create index on user_id and recorded_at for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_worker_locations_user_id ON worker_locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_worker_locations_recorded_at ON worker_locations(recorded_at);
    `);
    console.log('✅ Indexes created');

    await client.query('COMMIT');
    console.log('--- Worker Location Tracking Migration Complete ---');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runMigration();
