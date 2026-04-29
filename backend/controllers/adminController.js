const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const ADMIN_SELF_MODIFY_ERROR = 'Admin cannot modify their own role or status';
const ADMIN_ROLE_MODIFY_ERROR = 'Admin role cannot be modified';

const getUserWithRole = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.role_id, r.role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const getRoleById = async (roleId) => {
  const result = await pool.query('SELECT id, role_name FROM roles WHERE id = $1', [roleId]);
  return result.rows[0] || null;
};

// ==================== USER MANAGEMENT ====================

/**
 * @desc    Get all users with their roles
 * @route   GET /api/admin/users
 * @access  Admin, HR
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.role_id, u.created_at, u.updated_at,
             r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get All Users Error:', error.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/admin/create-user
 * @access  Admin
 */
const createUser = async (req, res) => {
  const { name, email, password, role_id, permissions } = req.body;

  const client = await pool.connect();
  try {
    // Validate required fields
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ message: 'All fields are required: name, email, password, role_id' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Verify role exists
    const roleCheck = await pool.query('SELECT id, role_name FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid role_id' });
    }

    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 12);
    const roleName = roleCheck.rows[0].role_name;

    const result = await client.query(
      `INSERT INTO users (name, email, password, role, role_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, role_id, is_active, created_at`,
      [name, email, hashedPassword, roleName, role_id]
    );

    const user = result.rows[0];
    user.role_name = roleName;

    // Handle custom permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await client.query(
          `INSERT INTO user_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, perm.module, perm.can_view || false, perm.can_create || false, perm.can_edit || false, perm.can_delete || false]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create User Error:', error.message);
    res.status(500).json({ message: 'Server error creating user' });
  } finally {
    client.release();
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/admin/update-user/:id
 * @access  Admin
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role_id, is_active, permissions } = req.body;
  const targetId = parseInt(id, 10);
  const actorId = parseInt(req.user.id, 10);

  const client = await pool.connect();
  try {
    // Block admin self-modification through admin panel actions.
    if (req.user.role === 'admin' && targetId === actorId) {
      return res.status(403).json({ message: ADMIN_SELF_MODIFY_ERROR });
    }

    // Check user exists
    const targetUser = await getUserWithRole(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // No one can change role of an admin user.
    if (role_id && targetUser.role_name === 'admin') {
      return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
    }

    // If role_id provided, verify it exists
    let roleName = null;
    if (role_id) {
      const roleCheck = await getRoleById(role_id);
      if (!roleCheck) {
        return res.status(400).json({ message: 'Invalid role_id' });
      }
      if (roleCheck.role_name === 'admin') {
        return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
      }
      roleName = roleCheck.role_name;
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role_id = COALESCE($3, role_id),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, email, role_id, is_active, updated_at`,
      [name, email, role_id, roleName, is_active, id]
    );

    const user = result.rows[0];
    
    // Handle custom permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Clear existing custom permissions first (or upsert)
      // For simplicity, we'll clear and re-insert, but ON CONFLICT is safer
      for (const perm of permissions) {
        await client.query(
          `INSERT INTO user_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, module) 
           DO UPDATE SET can_view = $3, can_create = $4, can_edit = $5, can_delete = $6`,
          [id, perm.module, perm.can_view || false, perm.can_create || false, perm.can_edit || false, perm.can_delete || false]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch role_name for response
    if (user.role_id) {
      const r = await pool.query('SELECT role_name FROM roles WHERE id = $1', [user.role_id]);
      user.role_name = r.rows[0]?.role_name;
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update User Error:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error updating user' });
  } finally {
    client.release();
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/delete-user/:id
 * @access  Admin
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);
  const actorId = parseInt(req.user.id, 10);

  try {
    // Prevent admin from deleting own account via admin actions.
    if (req.user.role === 'admin' && targetId === actorId) {
      return res.status(403).json({ message: ADMIN_SELF_MODIFY_ERROR });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [targetId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Delete User Error:', error.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

/**
 * @desc    Toggle user active/inactive
 * @route   PUT /api/admin/toggle-user/:id
 * @access  Admin
 */
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);
  const actorId = parseInt(req.user.id, 10);

  try {
    if (req.user.role === 'admin' && targetId === actorId) {
      return res.status(403).json({ message: ADMIN_SELF_MODIFY_ERROR });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, email, is_active`,
      [targetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const status = result.rows[0].is_active ? 'activated' : 'deactivated';
    res.status(200).json({ message: `User ${status} successfully`, user: result.rows[0] });
  } catch (error) {
    console.error('Toggle User Error:', error.message);
    res.status(500).json({ message: 'Server error toggling user status' });
  }
};

/**
 * @desc    Assign role to user
 * @route   POST /api/admin/assign-role
 * @access  Admin
 */
const assignRole = async (req, res) => {
  const { user_id, role_id } = req.body;

  try {
    if (!user_id || !role_id) {
      return res.status(400).json({ message: 'user_id and role_id are required' });
    }

    const roleCheck = await getRoleById(role_id);
    if (!roleCheck) {
      return res.status(400).json({ message: 'Invalid role_id' });
    }
    if (roleCheck.role_name === 'admin') {
      return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
    }

    const targetUser = await getUserWithRole(user_id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.role_name === 'admin') {
      return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
    }

    const result = await pool.query(
      `UPDATE users SET role_id = $1, role = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, name, email, role_id`,
      [role_id, roleCheck.role_name, user_id]
    );

    res.status(200).json({
      message: 'Role assigned successfully',
      user: { ...result.rows[0], role_name: roleCheck.role_name }
    });
  } catch (error) {
    console.error('Assign Role Error:', error.message);
    res.status(500).json({ message: 'Server error assigning role' });
  }
};

// ==================== ROLE MANAGEMENT ====================

/**
 * @desc    Get all roles
 * @route   GET /api/admin/roles
 * @access  Admin
 */
const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.role_name, r.created_at,
             COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      GROUP BY r.id, r.role_name, r.created_at
      ORDER BY r.id ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Roles Error:', error.message);
    res.status(500).json({ message: 'Server error fetching roles' });
  }
};

/**
 * @desc    Create a new role
 * @route   POST /api/admin/create-role
 * @access  Admin
 */
const createRole = async (req, res) => {
  const { role_name } = req.body;

  try {
    if (!role_name || role_name.trim() === '') {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const sanitized = role_name.trim().toLowerCase();

    const result = await pool.query(
      'INSERT INTO roles (role_name) VALUES ($1) RETURNING id, role_name, created_at',
      [sanitized]
    );

    res.status(201).json({ message: 'Role created successfully', role: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Role already exists' });
    }
    console.error('Create Role Error:', error.message);
    res.status(500).json({ message: 'Server error creating role' });
  }
};

/**
 * @desc    Update a role name
 * @route   PUT /api/admin/update-role/:id
 * @access  Admin
 */
const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;

  try {
    const targetRole = await getRoleById(id);
    if (!targetRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (targetRole.role_name === 'admin') {
      return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
    }

    if (!role_name || role_name.trim() === '') {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const sanitized = role_name.trim().toLowerCase();

    // Also update the role column in users table to keep in sync
    const oldRole = await pool.query('SELECT role_name FROM roles WHERE id = $1', [id]);

    const result = await pool.query(
      'UPDATE roles SET role_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, role_name, updated_at',
      [sanitized, id]
    );

    // Sync the role column in users table
    if (oldRole.rows.length > 0) {
      await pool.query('UPDATE users SET role = $1 WHERE role_id = $2', [sanitized, id]);
    }

    res.status(200).json({ message: 'Role updated successfully', role: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    console.error('Update Role Error:', error.message);
    res.status(500).json({ message: 'Server error updating role' });
  }
};

/**
 * @desc    Delete a role (only if not assigned to any user)
 * @route   DELETE /api/admin/delete-role/:id
 * @access  Admin
 */
const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const targetRole = await getRoleById(id);
    if (!targetRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (targetRole.role_name === 'admin') {
      return res.status(403).json({ message: ADMIN_ROLE_MODIFY_ERROR });
    }

    // Check if any users are assigned this role
    const usersWithRole = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
      [id]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(400).json({
        message: `Cannot delete this role. ${usersWithRole.rows[0].count} user(s) are assigned to it.`
      });
    }

    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id, role_name',
      [id]
    );

    res.status(200).json({ message: 'Role deleted successfully', role: result.rows[0] });
  } catch (error) {
    console.error('Delete Role Error:', error.message);
    res.status(500).json({ message: 'Server error deleting role' });
  }
};

// ==================== PERMISSIONS MANAGEMENT ====================

/**
 * @desc    Get permissions for a specific role
 * @route   GET /api/admin/permissions/:roleId
 * @access  Admin
 */
const getRolePermissions = async (req, res) => {
  const { roleId } = req.params;

  try {
    const result = await pool.query(
      `SELECT rp.*, r.role_name 
       FROM role_permissions rp 
       JOIN roles r ON r.id = rp.role_id 
       WHERE rp.role_id = $1 
       ORDER BY rp.module`,
      [roleId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Permissions Error:', error.message);
    res.status(500).json({ message: 'Server error fetching permissions' });
  }
};

/**
 * @desc    Update permissions for a role
 * @route   PUT /api/admin/permissions/:roleId
 * @access  Admin
 */
const updateRolePermissions = async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body; // Array of { module, can_view, can_create, can_edit, can_delete }

  try {
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions array is required' });
    }

    // Verify role exists
    const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Upsert each permission
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (role_id, module) 
         DO UPDATE SET can_view = $3, can_create = $4, can_edit = $5, can_delete = $6`,
        [roleId, perm.module, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete]
      );
    }

    // Return updated permissions
    const result = await pool.query(
      'SELECT * FROM role_permissions WHERE role_id = $1 ORDER BY module',
      [roleId]
    );

    res.status(200).json({ message: 'Permissions updated successfully', permissions: result.rows });
  } catch (error) {
    console.error('Update Permissions Error:', error.message);
    res.status(500).json({ message: 'Server error updating permissions' });
  }
};

/**
 * @desc    Get specific permissions for a user
 * @route   GET /api/admin/user-permissions/:userId
 * @access  Admin
 */
const getUserPermissions = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT up.*, u.name as user_name 
       FROM user_permissions up 
       JOIN users u ON u.id = up.user_id 
       WHERE up.user_id = $1 
       ORDER BY up.module`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get User Permissions Error:', error.message);
    res.status(500).json({ message: 'Server error fetching user permissions' });
  }
};

/**
 * @desc    Update specific permissions for a user
 * @route   PUT /api/admin/user-permissions/:userId
 * @access  Admin
 */
const updateUserPermissions = async (req, res) => {
  const { userId } = req.params;
  const { permissions } = req.body; // Array of { module, can_view, can_create, can_edit, can_delete }

  try {
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions array is required' });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upsert each permission
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO user_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, module) 
         DO UPDATE SET can_view = $3, can_create = $4, can_edit = $5, can_delete = $6`,
        [userId, perm.module, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete]
      );
    }

    // Return updated permissions
    const result = await pool.query(
      'SELECT * FROM user_permissions WHERE user_id = $1 ORDER BY module',
      [userId]
    );

    res.status(200).json({ message: 'User permissions updated successfully', permissions: result.rows });
  } catch (error) {
    console.error('Update User Permissions Error:', error.message);
    res.status(500).json({ message: 'Server error updating user permissions' });
  }
};

// ==================== DASHBOARD STATS ====================

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard-stats
 * @access  Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      usersCount,
      activeUsers,
      deactivatedUsers,
      leadsCount,
      convertedLeads,
      failedLogins,
      recentActivity
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = false'),
      pool.query('SELECT COUNT(*) as count FROM leads'),
      pool.query(`
        SELECT COUNT(*) as count
        FROM leads l
        WHERE LOWER(COALESCE(l.status, '')) = 'converted'
          OR LOWER(COALESCE(l.pipeline_stage, '')) = 'won'
          OR EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.lead_id = l.id AND o.status = 'won'
          )
      `),
      pool.query(`SELECT COUNT(*) as count FROM login_logs WHERE status = 'failed'`),
      pool.query(`
        SELECT
          u.id,
          u.name AS user_name,
          COALESCE(r.role_name, u.role, 'unknown') AS role_name,
          'login' AS action,
          u.last_login AS action_time,
          u.last_login AS last_seen
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.last_login IS NOT NULL
        ORDER BY u.last_login DESC
        LIMIT 12
      `)
    ]);

    const totalUsers = parseInt(usersCount.rows[0].count, 10) || 0;
    const activeUsersCount = parseInt(activeUsers.rows[0].count, 10) || 0;
    const deactivatedUsersCount = parseInt(deactivatedUsers.rows[0].count, 10) || 0;
    const totalLeads = parseInt(leadsCount.rows[0].count, 10) || 0;
    const convertedLeadsCount = parseInt(convertedLeads.rows[0].count, 10) || 0;
    const failedLoginAttempts = parseInt(failedLogins.rows[0].count, 10) || 0;

    res.status(200).json({
      // Requested API keys
      total_users: totalUsers,
      active_users: activeUsersCount,
      deactivated_users: deactivatedUsersCount,
      total_leads: totalLeads,
      converted_leads: convertedLeadsCount,
      failed_login_attempts: failedLoginAttempts,
      recent_activity: recentActivity.rows,

      // Backward-compatible keys
      totalUsers,
      activeUsers: activeUsersCount,
      deactivatedUsers: deactivatedUsersCount,
      totalLeads,
      convertedLeads: convertedLeadsCount,
      failedLoginAttempts,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

/**
 * @desc    Get admin leads list with optional status filter
 * @route   GET /api/admin/leads
 * @access  Admin
 */
const getAdminLeads = async (req, res) => {
  const { status = 'all' } = req.query;
  const normalizedStatus = String(status).toLowerCase();

  try {
    let whereClause = '';
    const values = [];

    if (normalizedStatus !== 'all') {
      if (normalizedStatus === 'converted') {
        whereClause = `
          WHERE (
            LOWER(COALESCE(l.status, '')) = 'converted'
            OR LOWER(COALESCE(l.pipeline_stage, '')) = 'won'
            OR EXISTS (
              SELECT 1 FROM opportunities o
              WHERE o.lead_id = l.id AND o.status = 'won'
            )
          )
        `;
      } else {
        whereClause = 'WHERE LOWER(COALESCE(l.status, \'\')) = $1';
        values.push(normalizedStatus);
      }
    }

    const result = await pool.query(
      `
        SELECT
          l.id,
          l.name,
          l.phone,
          l.email,
          l.type,
          l.status,
          l.pipeline_stage,
          l.created_at,
          creator.name AS creator_name,
          worker.name AS assigned_worker_name
        FROM leads l
        LEFT JOIN users creator ON creator.id = l.created_by
        LEFT JOIN users worker ON worker.id = l.assigned_to
        ${whereClause}
        ORDER BY l.created_at DESC
      `,
      values
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Admin Leads Error:', error.message);
    res.status(500).json({ message: 'Server error fetching leads' });
  }
};

/**
 * @desc    Get creator/worker performance report
 * @route   GET /api/admin/performance-report
 * @access  Admin
 */
const getPerformanceReport = async (req, res) => {
  const { role, from, to } = req.query;
  const selectedRole = ['creator', 'worker'].includes(role) ? role : 'creator';

  try {
    const activitiesCompletedColumn = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activities'
          AND column_name = 'completed'
      ) AS exists`
    );
    const hasCompletedColumn = activitiesCompletedColumn.rows[0]?.exists === true;

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if ((from && Number.isNaN(fromDate.getTime())) || (to && Number.isNaN(toDate.getTime()))) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    let result;
    if (selectedRole === 'creator') {
      result = await pool.query(
        `
          SELECT
            u.id AS user_id,
            u.name AS user_name,
            u.email,
            r.role_name,
            COUNT(l.id) AS total_leads,
            COUNT(DISTINCT CASE
              WHEN LOWER(COALESCE(l.status, '')) = 'converted' OR o.id IS NOT NULL
              THEN l.id
            END) AS conversion_or_completed,
            COUNT(CASE
              WHEN LOWER(COALESCE(l.status, '')) = 'rejected'
              THEN 1
            END) AS rejected_or_followups
          FROM users u
          JOIN roles r ON r.id = u.role_id
          LEFT JOIN leads l ON l.created_by = u.id
            AND ($2::timestamp IS NULL OR l.created_at >= $2::timestamp)
            AND ($3::timestamp IS NULL OR l.created_at <= $3::timestamp)
          LEFT JOIN opportunities o ON o.lead_id = l.id AND o.status = 'won'
          WHERE r.role_name = $1
          GROUP BY u.id, u.name, u.email, r.role_name
          ORDER BY u.name ASC
        `,
        [selectedRole, fromDate, toDate]
      );
    } else {
      result = await pool.query(
        `
          SELECT
            u.id AS user_id,
            u.name AS user_name,
            u.email,
            r.role_name,
            COUNT(DISTINCT l.id) AS total_leads,
            COUNT(CASE
              WHEN ${hasCompletedColumn ? 'a.completed = true' : "LOWER(COALESCE(a.type, '')) LIKE '%complete%'"}
              THEN 1
            END) AS conversion_or_completed,
            COUNT(CASE
              WHEN a.next_followup IS NOT NULL
              THEN 1
            END) AS rejected_or_followups
          FROM users u
          JOIN roles r ON r.id = u.role_id
          LEFT JOIN leads l ON l.assigned_to = u.id
            AND ($2::timestamp IS NULL OR l.created_at >= $2::timestamp)
            AND ($3::timestamp IS NULL OR l.created_at <= $3::timestamp)
          LEFT JOIN activities a ON a.user_id = u.id
            AND ($2::timestamp IS NULL OR a.created_at >= $2::timestamp)
            AND ($3::timestamp IS NULL OR a.created_at <= $3::timestamp)
          WHERE r.role_name = $1
          GROUP BY u.id, u.name, u.email, r.role_name
          ORDER BY u.name ASC
        `,
        [selectedRole, fromDate, toDate]
      );
    }

    res.status(200).json({
      role: selectedRole,
      from: from || null,
      to: to || null,
      rows: result.rows
    });
  } catch (error) {
    console.error('Performance Report Error:', error.message);
    res.status(500).json({ message: 'Server error fetching performance report' });
  }
};

/**
 * @desc    Get admin reports (creator/worker performance)
 * @route   GET /api/admin/reports
 * @access  Admin
 */
const getAdminReports = async (req, res) => {
  const { role = 'all', from, to } = req.query;
  const normalizedRole = String(role).toLowerCase();

  if (!['all', 'creator', 'worker'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Invalid role filter' });
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if ((from && Number.isNaN(fromDate.getTime())) || (to && Number.isNaN(toDate.getTime()))) {
    return res.status(400).json({ message: 'Invalid date range' });
  }

  try {
    const completedColumnCheck = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activities'
          AND column_name = 'completed'
      ) AS exists`
    );
    const hasCompletedColumn = completedColumnCheck.rows[0]?.exists === true;

    const creatorRowsResult = await pool.query(
      `
        SELECT
          u.id AS user_id,
          u.name,
          u.email,
          COUNT(l.id) AS leads_created,
          COUNT(CASE WHEN LOWER(COALESCE(l.status, '')) = 'approved' THEN 1 END) AS approved_leads,
          COUNT(CASE WHEN LOWER(COALESCE(l.status, '')) = 'rejected' THEN 1 END) AS rejected_leads,
          COUNT(DISTINCT CASE
            WHEN LOWER(COALESCE(l.status, '')) = 'converted' OR o.id IS NOT NULL
            THEN l.id
          END) AS converted_leads
        FROM users u
        JOIN roles r ON r.id = u.role_id AND r.role_name = 'creator'
        LEFT JOIN leads l ON l.created_by = u.id
          AND ($1::timestamp IS NULL OR l.created_at >= $1::timestamp)
          AND ($2::timestamp IS NULL OR l.created_at <= $2::timestamp)
        LEFT JOIN opportunities o ON o.lead_id = l.id AND o.status = 'won'
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name ASC
      `,
      [fromDate, toDate]
    );

    const workerRowsResult = await pool.query(
      `
        SELECT
          u.id AS user_id,
          u.name,
          u.email,
          COUNT(DISTINCT l.id) AS assigned_leads,
          COUNT(CASE
            WHEN ${hasCompletedColumn ? 'a.completed = true' : "LOWER(COALESCE(a.type, '')) LIKE '%complete%'"}
            THEN 1
          END) AS completed_activities,
          COUNT(CASE
            WHEN a.next_followup IS NOT NULL
             AND (a.next_followup > NOW())
            THEN 1
          END) AS pending_followups,
          COUNT(DISTINCT CASE
            WHEN LOWER(COALESCE(l.status, '')) = 'converted'
              OR LOWER(COALESCE(l.pipeline_stage, '')) = 'won'
              OR ow.id IS NOT NULL
            THEN l.id
          END) AS conversion_count
        FROM users u
        JOIN roles r ON r.id = u.role_id AND r.role_name = 'worker'
        LEFT JOIN leads l ON l.assigned_to = u.id
          AND ($1::timestamp IS NULL OR l.created_at >= $1::timestamp)
          AND ($2::timestamp IS NULL OR l.created_at <= $2::timestamp)
        LEFT JOIN activities a ON a.user_id = u.id
          AND ($1::timestamp IS NULL OR a.created_at >= $1::timestamp)
          AND ($2::timestamp IS NULL OR a.created_at <= $2::timestamp)
        LEFT JOIN opportunities ow ON ow.lead_id = l.id AND ow.status = 'won'
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name ASC
      `,
      [fromDate, toDate]
    );

    const creatorReports = normalizedRole === 'worker' ? [] : creatorRowsResult.rows;
    const workerReports = normalizedRole === 'creator' ? [] : workerRowsResult.rows;

    return res.status(200).json({
      filters: {
        role: normalizedRole,
        from: from || null,
        to: to || null
      },
      creatorReports,
      workerReports
    });
  } catch (error) {
    console.error('Admin Reports Error:', error.message);
    return res.status(500).json({ message: 'Server error fetching admin reports' });
  }
};

// ==================== LOGIN TRACKING ====================

/**
 * @desc    Get all users with their last login time
 * @route   GET /api/admin/users-with-last-login
 * @access  Admin
 */
const getUsersWithLastLogin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.last_login, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.last_login DESC NULLS LAST
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Users With Last Login Error:', error.message);
    res.status(500).json({ message: 'Server error fetching users with last login' });
  }
};

/**
 * @desc    Get complete login history for a specific user
 * @route   GET /api/admin/login-history/:user_id
 * @access  Admin
 */
const getUserLoginHistory = async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT id, email, login_time, ip_address, device_info, status
      FROM login_logs
      WHERE user_id = $1
      ORDER BY login_time DESC
    `, [user_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Login History Error:', error.message);
    res.status(500).json({ message: 'Server error fetching login history' });
  }
};

/**
 * @desc    Get overall login statistics
 * @route   GET /api/admin/login-stats
 * @access  Admin
 */
const getLoginStats = async (req, res) => {
  try {
    const totalLogins = await pool.query(`SELECT COUNT(*) as count FROM login_logs`);
    const failedLogins = await pool.query(`SELECT COUNT(*) as count FROM login_logs WHERE status = 'failed'`);
    const activeUsers = await pool.query(`SELECT COUNT(*) as count FROM users WHERE is_active = true`);

    res.status(200).json({
      totalLogins: parseInt(totalLogins.rows[0].count),
      failedLogins: parseInt(failedLogins.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count)
    });
  } catch (error) {
    console.error('Get Login Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching login stats' });
  }
};

/**
 * @desc    Get recent logins (overall)
 * @route   GET /api/admin/recent-logins
 * @access  Admin
 */
const getRecentLogins = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ll.id, ll.email, ll.login_time, ll.ip_address, ll.status, u.name
      FROM login_logs ll
      LEFT JOIN users u ON ll.user_id = u.id
      ORDER BY ll.login_time DESC
      LIMIT 10
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Recent Logins Error:', error.message);
    res.status(500).json({ message: 'Server error fetching recent logins' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignRole,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions,
  getDashboardStats,
  getAdminLeads,
  getPerformanceReport,
  getAdminReports,
  getUsersWithLastLogin,
  getUserLoginHistory,
  getLoginStats,
  getRecentLogins
};
