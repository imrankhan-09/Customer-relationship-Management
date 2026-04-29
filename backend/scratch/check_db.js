const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkDB() {
  const client = await pool.connect();
  try {
    console.log('--- Checking Database Tables ---');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', tables.rows.map(r => r.table_name).join(', '));
    
    const rolePermissions = await client.query('SELECT COUNT(*) FROM role_permissions');
    console.log('Role permissions count:', rolePermissions.rows[0].count);
    
    const sampleRolePerms = await client.query(`
      SELECT rp.*, r.role_name 
      FROM role_permissions rp 
      JOIN roles r ON rp.role_id = r.id 
      LIMIT 10
    `);
    console.log('Sample role permissions:', JSON.stringify(sampleRolePerms.rows, null, 2));
    
    const userPermissions = await client.query('SELECT COUNT(*) FROM user_permissions');
    console.log('User permissions count:', userPermissions.rows[0].count);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDB();
