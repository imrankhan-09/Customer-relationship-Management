const { pool } = require('../config/db');

/**
 * Dynamic role-based middleware
 * Checks if the user has one of the allowed roles
 * @param  {...string} allowedRoles - Role names that are allowed
 */
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Fetch user's role from DB (not from token, for real-time accuracy)
      const result = await pool.query(
        `SELECT r.role_name FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1 AND u.is_active = true`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ message: 'User not found or inactive' });
      }

      const userRole = result.rows[0].role_name;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
      }

      // Attach role_name to req for downstream use
      req.user.role_name = userRole;
      next();
    } catch (error) {
      console.error('Role check error:', error.message);
      res.status(500).json({ message: 'Server error during role verification' });
    }
  };
};

/**
 * Dynamic permission-based middleware
 * Checks if the user has permission for a specific module and action
 * @param {string} module - Module name (users, leads, opportunities, activities)
 * @param {string} action - Action name (view, create, edit, delete)
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      const actionColumn = `can_${action}`;
      const validActions = ['can_view', 'can_create', 'can_edit', 'can_delete'];
      
      if (!validActions.includes(actionColumn)) {
        return res.status(400).json({ message: `Invalid action: ${action}` });
      }

      const result = await pool.query(
        `SELECT rp.${actionColumn} as has_permission, r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN role_permissions rp ON rp.role_id = r.id AND rp.module = $1
         WHERE u.id = $2 AND u.is_active = true`,
        [module, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          message: `No permissions configured for module: ${module}` 
        });
      }

      if (!result.rows[0].has_permission) {
        return res.status(403).json({ 
          message: `Access denied. You don't have '${action}' permission for '${module}'` 
        });
      }

      req.user.role_name = result.rows[0].role_name;
      next();
    } catch (error) {
      console.error('Permission check error:', error.message);
      res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

module.exports = { checkRole, checkPermission };
