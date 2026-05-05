const { pool } = require('../config/db');

// @desc    Toggle tracking status
// @route   POST /api/location/toggle
// @access  Private
exports.toggleTracking = async (req, res) => {
  try {
    const { is_tracking_enabled } = req.body;
    const userId = req.user.id;

    await pool.query(
      'UPDATE users SET is_tracking_enabled = $1 WHERE id = $2',
      [is_tracking_enabled, userId]
    );

    res.json({
      success: true,
      message: `Tracking ${is_tracking_enabled ? 'enabled' : 'disabled'}`,
      is_tracking_enabled
    });
  } catch (error) {
    console.error('Error toggling tracking:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update worker location
// @route   POST /api/location/update
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.id;

    // Check if tracking is enabled for this user
    const userResult = await pool.query(
      'SELECT is_tracking_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!userResult.rows[0].is_tracking_enabled) {
      return res.status(400).json({ success: false, message: 'Tracking is disabled' });
    }

    // Insert into worker_locations
    await pool.query(
      'INSERT INTO worker_locations (user_id, latitude, longitude, accuracy) VALUES ($1, $2, $3, $4)',
      [userId, latitude, longitude, accuracy]
    );

    // Update users table with last known location
    await pool.query(
      'UPDATE users SET last_latitude = $1, last_longitude = $2, last_location_time = NOW() WHERE id = $3',
      [latitude, longitude, userId]
    );

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Error updating location:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get live + last location of all workers
// @route   GET /api/admin/live-locations
// @access  Private/Admin
exports.getLiveLocations = async (req, res) => {
  try {
    // Get all workers (or all users if preferred, but usually workers are tracked)
    // We join with roles to filter by 'worker' role if necessary, or just show all who have ever enabled tracking
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.is_tracking_enabled, 
        u.last_latitude, 
        u.last_longitude, 
        u.last_location_time,
        r.role_name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name = 'worker'
    `;
    
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting live locations:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get location history for a specific user
// @route   GET /api/admin/location-history/:user_id
// @access  Private/Admin
exports.getLocationHistory = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM worker_locations WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 100',
      [user_id]
    );

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [user_id]);

    res.json({
      success: true,
      userName: userResult.rows[0]?.name || 'Unknown',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting location history:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
