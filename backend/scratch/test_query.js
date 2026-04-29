const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testQuery() {
  const client = await pool.connect();
  try {
    const role_id = 2; // Creator
    const user_id = 1; // Creator user
    
    console.log(`Testing permission query for RoleID: ${role_id}, UserID: ${user_id}`);
    
    const permissionQuery = `
      WITH modules AS (
        SELECT DISTINCT module FROM role_permissions WHERE role_id = $1
        UNION
        SELECT DISTINCT module FROM user_permissions WHERE user_id = $2
      )
      SELECT 
        m.module,
        COALESCE(up.can_view, rp.can_view, false) as can_view,
        COALESCE(up.can_create, rp.can_create, false) as can_create,
        COALESCE(up.can_edit, rp.can_edit, false) as can_edit,
        COALESCE(up.can_delete, rp.can_delete, false) as can_delete
      FROM modules m
      LEFT JOIN role_permissions rp ON rp.module = m.module AND rp.role_id = $1
      LEFT JOIN user_permissions up ON up.module = m.module AND up.user_id = $2
    `;
    
    const res = await client.query(permissionQuery, [role_id, user_id]);
    console.log('Query result:', JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testQuery();
