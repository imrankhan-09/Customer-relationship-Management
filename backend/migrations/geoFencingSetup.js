const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Starting Geo-Fencing Migration ---');
    await client.query('BEGIN');

    // 1. Create geo_fences table
    console.log('Creating geo_fences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS geo_fences (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        radius DECIMAL(10,2) NOT NULL DEFAULT 100, -- in meters
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ geo_fences table created');

    // 2. Update users table with geo_fence fields
    console.log('Updating users table with geo_fence fields...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS assigned_geofence_id INT REFERENCES geo_fences(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS current_geofence_status VARCHAR(20) DEFAULT 'UNKNOWN';
    `);
    console.log('✅ Users table updated');

    // 3. Update worker_locations table with geofence_status
    console.log('Updating worker_locations table...');
    await client.query(`
      ALTER TABLE worker_locations 
      ADD COLUMN IF NOT EXISTS geofence_status VARCHAR(20) DEFAULT 'UNKNOWN';
    `);
    console.log('✅ worker_locations table updated');

    // 4. Insert a default office geo-fence if none exists
    const officeCheck = await client.query('SELECT id FROM geo_fences WHERE name = $1', ['Main Office']);
    if (officeCheck.rows.length === 0) {
      console.log('Inserting default office geo-fence...');
      await client.query(`
        INSERT INTO geo_fences (name, latitude, longitude, radius)
        VALUES ($1, $2, $3, $4)
      `, ['Main Office', 28.6139, 77.2090, 100.00]); // Delhi coordinates as example
    }

    await client.query('COMMIT');
    console.log('--- Geo-Fencing Migration Complete ---');

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
