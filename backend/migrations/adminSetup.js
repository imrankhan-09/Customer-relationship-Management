const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('--- Starting Admin System Migration ---');
    await client.query('BEGIN');

    // 1. Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Roles table created');

    // 2. Create role_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INT REFERENCES roles(id) ON DELETE CASCADE,
        module VARCHAR(50) NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, module)
      );
    `);
    console.log('✅ Role permissions table created');

    // 3. Seed default roles
    const defaultRoles = ['admin', 'creator', 'approver', 'worker', 'manager', 'employee', 'hr', 'sales'];
    for (const roleName of defaultRoles) {
      await client.query(
        `INSERT INTO roles (role_name) VALUES ($1) ON CONFLICT (role_name) DO NOTHING`,
        [roleName]
      );
    }
    console.log('✅ Default roles seeded');

    // 4. Add role_id column to users if it doesn't exist
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role_id'
    `);

    if (colCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN role_id INT`);
      console.log('✅ role_id column added to users');

      // Migrate existing role data
      const roleCheck = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
      `);

      if (roleCheck.rows.length > 0) {
        // Map existing role strings to role_id
        await client.query(`
          UPDATE users u SET role_id = r.id
          FROM roles r WHERE LOWER(u.role) = LOWER(r.role_name)
        `);
        console.log('✅ Existing users migrated to role_id');
      }

      // Add FK constraint
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT fk_users_role 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      `);
      console.log('✅ FK constraint added');
    } else {
      console.log('ℹ️  role_id column already exists');
    }

    // 5. Add is_active column to users
    const activeCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_active'
    `);

    if (activeCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true`);
      console.log('✅ is_active column added to users');
    }

    // 6. Seed default permissions
    const modules = ['users', 'leads', 'opportunities', 'activities'];
    
    // Get role IDs
    const rolesResult = await client.query(`SELECT id, role_name FROM roles`);
    const roleMap = {};
    rolesResult.rows.forEach(r => { roleMap[r.role_name] = r.id; });

    // Admin - full access to everything
    for (const mod of modules) {
      await client.query(`
        INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
        VALUES ($1, $2, true, true, true, true)
        ON CONFLICT (role_id, module) DO NOTHING
      `, [roleMap['admin'], mod]);
    }

    // Manager - view + edit leads, view opportunities, view activities
    if (roleMap['manager']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, false, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['manager']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'opportunities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['manager']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['manager']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'users', true, false, false, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['manager']]);
    }

    // Employee - only assigned leads
    if (roleMap['employee']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, false, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['employee']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, false, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['employee']]);
    }

    // HR - view users + manage employees
    if (roleMap['hr']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'users', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['hr']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, false, false, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['hr']]);
    }

    // Sales - manage leads + opportunities
    if (roleMap['sales']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, true, true, true) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['sales']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'opportunities', true, true, true, true) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['sales']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['sales']]);
    }

    // Creator - leads
    if (roleMap['creator']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['creator']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, false, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['creator']]);
    }

    // Approver - leads, users view
    if (roleMap['approver']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, false, true, true) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['approver']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'users', true, false, false, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['approver']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['approver']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'opportunities', true, true, true, true) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['approver']]);
    }

    // Worker
    if (roleMap['worker']) {
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'leads', true, false, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['worker']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'activities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['worker']]);
      await client.query(`INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES ($1, 'opportunities', true, true, true, false) ON CONFLICT (role_id, module) DO NOTHING`, [roleMap['worker']]);
    }

    console.log('✅ Default permissions seeded');

    // 7. Create admin user if not exists
    const adminEmail = 'admin@medbridge.com';
    const adminExists = await client.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
    
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      await client.query(`
        INSERT INTO users (name, email, password, role, role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `, ['System Admin', adminEmail, hashedPassword, 'admin', roleMap['admin']]);
      console.log('✅ Admin user created (admin@medbridge.com / Admin@123)');
    } else {
      // Ensure existing admin has role_id set
      await client.query(`UPDATE users SET role_id = $1 WHERE email = $2`, [roleMap['admin'], adminEmail]);
      console.log('ℹ️  Admin user already exists, role_id updated');
    }

    await client.query('COMMIT');
    console.log('--- Admin System Migration Complete ---');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runMigration();
