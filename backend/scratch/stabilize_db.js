const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function stabilizeDB() {
  const client = await pool.connect();
  try {
    console.log('--- DB Stabilization Started ---');
    await client.query('BEGIN');

    // 1. Drop unused duplicate tables
    console.log('Removing unused duplicate tables...');
    await client.query('DROP TABLE IF EXISTS role_permission_map CASCADE');
    await client.query('DROP TABLE IF EXISTS permissions CASCADE');
    console.log('✅ role_permission_map and permissions removed');

    // 2. Fix user_permissions table structure
    console.log('Fixing user_permissions table structure...');
    await client.query('DROP TABLE IF EXISTS user_permissions CASCADE');
    await client.query(`
      CREATE TABLE user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        module VARCHAR(50) NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module)
      );
    `);
    console.log('✅ user_permissions table recreated with correct structure');

    // 3. Ensure roles exist
    const roles = ['admin', 'creator', 'approver', 'worker', 'manager', 'employee', 'hr', 'sales'];
    for (const r of roles) {
      await client.query('INSERT INTO roles (role_name) VALUES ($1) ON CONFLICT (role_name) DO NOTHING', [r]);
    }
    console.log('✅ Roles verified');

    // 4. Ensure admin user exists and has correct role_id
    const adminEmail = 'admin@medbridge.com';
    const adminPass = 'Admin@123';
    const hashedAdmin = await bcrypt.hash(adminPass, 12);
    
    const adminRole = await client.query('SELECT id FROM roles WHERE role_name = \'admin\'');
    const adminRoleId = adminRole.rows[0].id;

    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      await client.query(
        'INSERT INTO users (name, email, password, role, role_id, is_active) VALUES ($1, $2, $3, $4, $5, true)',
        ['System Admin', adminEmail, hashedAdmin, 'admin', adminRoleId]
      );
      console.log('✅ Admin user created');
    } else {
      await client.query('UPDATE users SET role_id = $1, is_active = true WHERE email = $2', [adminRoleId, adminEmail]);
      console.log('✅ Admin user role_id updated');
    }

    // 5. Ensure non-admin users have correct passwords for testing
    const testUsers = [
      { email: 'creator@gmail.com', role: 'creator' },
      { email: 'approver@gmail.com', role: 'approver' },
      { email: 'worker@gmail.com', role: 'worker' }
    ];
    const hashedTest = await bcrypt.hash('password123', 12);
    for (const u of testUsers) {
      const roleResult = await client.query('SELECT id FROM roles WHERE role_name = $1', [u.role]);
      if (roleResult.rows.length > 0) {
        const role_id = roleResult.rows[0].id;
        await client.query(
          'UPDATE users SET password = $1, role_id = $2, is_active = true WHERE email = $3',
          [hashedTest, role_id, u.email]
        );
      }
    }
    console.log('✅ Test users stabilized');

    await client.query('COMMIT');
    console.log('--- DB Stabilization Complete ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ DB Stabilization Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

stabilizeDB();
