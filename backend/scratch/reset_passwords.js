const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function resetPasswords() {
  const client = await pool.connect();
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('Resetting passwords to: ' + password);
    
    const emails = ['creator@gmail.com', 'approver@gmail.com', 'worker@gmail.com'];
    
    for (const email of emails) {
      const res = await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log(`Updated ${email}: ${res.rowCount} row(s)`);
    }
    
    console.log('Password reset complete.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPasswords();
