const { pool } = require('../config/db');

// @desc    Get all users (optionally filtered by role)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  const { role } = req.query;
  try {
    let query = 'SELECT id, name, email, role, created_at FROM users';
    let values = [];

    if (role) {
      query += ' WHERE role = $1';
      values.push(role);
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Users Error:', error.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

module.exports = {
  getUsers
};
