const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

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
  const { name, email, password, role_id } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 12);
    const roleName = roleCheck.rows[0].role_name;

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, role_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, role_id, is_active, created_at`,
      [name, email, hashedPassword, roleName, role_id]
    );

    const user = result.rows[0];
    user.role_name = roleName;

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create User Error:', error.message);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/admin/update-user/:id
 * @access  Admin
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role_id, is_active } = req.body;

  try {
    // Check user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If role_id provided, verify it exists
    let roleName = null;
    if (role_id) {
      const roleCheck = await pool.query('SELECT role_name FROM roles WHERE id = $1', [role_id]);
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid role_id' });
      }
      roleName = roleCheck.rows[0].role_name;
    }

    const result = await pool.query(
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
    // Fetch role_name for response
    if (user.role_id) {
      const r = await pool.query('SELECT role_name FROM roles WHERE id = $1', [user.role_id]);
      user.role_name = r.rows[0]?.role_name;
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update User Error:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error updating user' });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/delete-user/:id
 * @access  Admin
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [id]);

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

  try {
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, email, is_active`,
      [id]
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

    const roleCheck = await pool.query('SELECT role_name FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid role_id' });
    }

    const result = await pool.query(
      `UPDATE users SET role_id = $1, role = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, name, email, role_id`,
      [role_id, roleCheck.rows[0].role_name, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Role assigned successfully',
      user: { ...result.rows[0], role_name: roleCheck.rows[0].role_name }
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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

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

// ==================== DASHBOARD STATS ====================

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard-stats
 * @access  Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');

    // Total leads
    const leadsCount = await pool.query('SELECT COUNT(*) as count FROM leads');

    // Active users
    const activeUsers = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');

    // Role-wise user stats
    const roleStats = await pool.query(`
      SELECT r.role_name, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      GROUP BY r.id, r.role_name
      ORDER BY count DESC
    `);

    // Total roles
    const rolesCount = await pool.query('SELECT COUNT(*) as count FROM roles');

    // Recent users (last 5)
    const recentUsers = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalLeads: parseInt(leadsCount.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count),
      totalRoles: parseInt(rolesCount.rows[0].count),
      roleStats: roleStats.rows,
      recentUsers: recentUsers.rows,
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
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
  getDashboardStats,
  getUsersWithLastLogin,
  getUserLoginHistory,
  getLoginStats,
  getRecentLogins
};
