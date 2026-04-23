const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const updateTable = async () => {
  try {
    const query = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
    `;
    await pool.query(query);
    console.log('✅ Users table updated successfully with reset token fields');
  } catch (err) {
    console.error('❌ Error updating users table:', err.message);
  } finally {
    await pool.end();
  }
};

updateTable();
