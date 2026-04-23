const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDB = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Supabase Connected:', res.rows[0].now);
  } catch (err) {
    console.error('Supabase Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
