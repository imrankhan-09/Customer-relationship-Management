const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Starting Tracking Upgrade Migration ---');
    await client.query('BEGIN');

    // 1. Update worker_locations table with new fields
    console.log('Updating worker_locations table...');
    await client.query(`
      ALTER TABLE worker_locations 
      ADD COLUMN IF NOT EXISTS city VARCHAR(150),
      ADD COLUMN IF NOT EXISTS is_tracking_start BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_tracking_end BOOLEAN DEFAULT false;
    `);
    console.log('✅ worker_locations table updated');

    // 2. Add start/end location storage to users table for quick access
    console.log('Updating users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS start_latitude DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS start_longitude DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS start_city VARCHAR(150),
      ADD COLUMN IF NOT EXISTS start_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS end_latitude DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS end_longitude DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS end_city VARCHAR(150),
      ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
    `);
    console.log('✅ Users table updated');

    await client.query('COMMIT');
    console.log('--- Tracking Upgrade Migration Complete ---');

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
