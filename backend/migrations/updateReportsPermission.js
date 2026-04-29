const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Updating Permissions with Reports Module ---');
    await client.query('BEGIN');

    // 1. Get all roles
    const rolesResult = await client.query('SELECT id, role_name FROM roles');
    const roles = rolesResult.rows;

    // 2. Add 'reports' permission for admin by default
    const adminRole = roles.find(r => r.role_name === 'admin');
    if (adminRole) {
      await client.query(`
        INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES ($1, 'reports', true, true, true, true)
        ON CONFLICT (role_id, module) DO UPDATE SET 
          can_view = true, can_create = true, can_edit = true, can_delete = true
      `, [adminRole.id]);
      console.log('✅ Reports permission added for Admin');
    }

    // 3. Add 'reports' permission for manager by default (view only)
    const managerRole = roles.find(r => r.role_name === 'manager');
    if (managerRole) {
      await client.query(`
        INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES ($1, 'reports', true, false, false, false)
        ON CONFLICT (role_id, module) DO UPDATE SET 
          can_view = true
      `, [managerRole.id]);
      console.log('✅ Reports permission added for Manager');
    }

    await client.query('COMMIT');
    console.log('--- Migration Complete ---');
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
