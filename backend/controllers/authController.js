const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const login = async (req, res) => {
  console.log('--- LOGIN REQUEST RECEIVED ---');
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const deviceInfo = req.headers['user-agent'];

  try {
    // 1. Check if user exists — join with roles to get role_name dynamically
    const userResult = await pool.query(
      `SELECT u.*, r.role_name 
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Log failed attempt even if user doesn't exist (can use null user_id or log email)
      await pool.query(
        `INSERT INTO login_logs (email, ip_address, device_info, status) VALUES ($1, $2, $3, 'failed')`,
        [email, ipAddress, deviceInfo]
      );
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // 2. Check if user is active
    if (user.is_active === false) {
      await pool.query(
        `INSERT INTO login_logs (user_id, email, ip_address, device_info, status) VALUES ($1, $2, $3, $4, 'failed')`,
        [user.id, email, ipAddress, deviceInfo]
      );
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact admin.' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      await pool.query(
        `INSERT INTO login_logs (user_id, email, ip_address, device_info, status) VALUES ($1, $2, $3, $4, 'failed')`,
        [user.id, email, ipAddress, deviceInfo]
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Log successful login
    await pool.query(
      `INSERT INTO login_logs (user_id, email, ip_address, device_info, status) VALUES ($1, $2, $3, $4, 'success')`,
      [user.id, email, ipAddress, deviceInfo]
    );

    // Update last_login timestamp
    await pool.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // 4. Get the role_name from DB (dynamic, not hardcoded)
    const roleName = user.role_name || user.role || 'employee';

    console.log("Login hit");
    console.log("User ID:", user.id);
    console.log("Role:", roleName);

    // 5. Fetch effective permissions (User-specific overrides > Role-based defaults)
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
    
    let permissions = [];
    try {
      if (user.role_id) {
        console.log(`Fetching permissions for RoleID: ${user.role_id}, UserID: ${user.id}`);
        const permResult = await pool.query(permissionQuery, [user.role_id, user.id]);
        permissions = permResult.rows;
        console.log(`Permissions fetched: ${permissions.length}`);
        if (permissions.length > 0) {
          console.log("First permission module:", permissions[0].module);
        }
      } else {
        console.log("No role_id for user, permissions empty. User data:", JSON.stringify({id: user.id, role: user.role, role_id: user.role_id}));
      }
    } catch (permError) {
      console.error("Permission fetch error (non-fatal):", permError.message);
      console.error(permError.stack);
    }

    // 6. Generate JWT with role info
    const token = jwt.sign(
      { id: user.id, email: user.email, role: roleName, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 7. Send response with dynamic role data
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleName,
        role_id: user.role_id,
        is_active: user.is_active,
        permissions,
      },
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const crypto = require('crypto');

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    
    // For now, return in response as requested
    res.status(200).json({ 
      message: 'Reset link generated successfully', 
      resetLink 
    });

  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2',
      [hashedPassword, token]
    );

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, forgotPassword, resetPassword };
