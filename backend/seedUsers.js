const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const users = [
  {
    name: 'Creator',
    email: 'creator@gmail.com',
    password: '$2a$12$2.FONtA0v3B2TYe8ZcKd8.EW/DpLWreWO25cR9PIoJgRKm2ietaxe',
    role: 'creator',
  },
  {
    name: 'Approver',
    email: 'approver@gmail.com',
    password: '$2a$12$HTOtZ8vb/nYXoau2tU6JGel6yQf7qQqZeGNz8aeumBUjIcd5QGWf2',
    role: 'approver',
  },
  {
    name: 'Worker',
    email: 'worker@gmail.com',
    password: '$2a$12$2.FONtA0v3B2TYe8ZcKd8.EW/DpLWreWO25cR9PIoJgRKm2ietaxe',
    role: 'worker',
  },
];

const seedUsers = async () => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING;
    `;

    for (const user of users) {
      await client.query(query, [user.name, user.email, user.password, user.role]);
    }

    console.log('Users inserted successfully');
  } catch (err) {
    console.error('Error seeding users:', err.message);
  } finally {
    client.release();
    await pool.end();
    process.exit();
  }
};

seedUsers();
