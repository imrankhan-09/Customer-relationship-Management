const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Adding Approved Leads Permission Module ---');
    await client.query('BEGIN');

    // 1. Get all roles
    const rolesResult = await client.query('SELECT id, role_name FROM roles');
    const roles = rolesResult.rows;

    // 2. Add 'approved_leads' permission for admin, approver, manager
    const targetRoles = ['admin', 'approver', 'manager', 'worker'];
    
    for (const roleName of targetRoles) {
      const role = roles.find(r => r.role_name === roleName);
      if (role) {
        await client.query(`
          INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
          VALUES ($1, 'approved_leads', true, true, true, true)
          ON CONFLICT (role_id, module) DO UPDATE SET 
            can_view = true, can_create = true, can_edit = true, can_delete = true
        `, [role.id]);
        console.log(`✅ Approved Leads permission added for ${roleName}`);
      }
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
