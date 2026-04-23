const bcrypt = require('bcrypt');
const { pool } = require('./config/db');
require('dotenv').config();

const seedUser = async () => {
  const name = 'Admin User';
  const email = 'admin@example.com';
  const password = 'password123';
  const role = 'creator';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role;
    `;
    
    const res = await pool.query(query, [name, email, hashedPassword, role]);
    
    if (res.rows.length > 0) {
      console.log('Test user created:', res.rows[0]);
    } else {
      console.log('User already exists or was not created.');
    }
    
  } catch (err) {
    console.error('Error seeding user:', err.message);
  } finally {
    await pool.end();
    process.exit();
  }
};

seedUser();
