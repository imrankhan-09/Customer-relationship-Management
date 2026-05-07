const { pool } = require('../config/db');
const axios = require('axios');

// Helper function for reverse geocoding (Nominatim - Free)
const getCityFromCoords = async (lat, lon) => {
  if (!lat || !lon) return 'Unknown';
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { 
        headers: { 'User-Agent': 'CRM-Pro-Tracking' },
        timeout: 5000 
      }
    );
    return response.data.address.city || response.data.address.town || response.data.address.village || response.data.address.county || 'Unknown';
  } catch (err) {
    console.error('Reverse Geocoding Error:', err.message);
    return 'Unknown';
  }
};

// Helper function for Haversine formula (Distance in meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

// @desc    Toggle tracking status
// @route   POST /api/location/toggle
// @access  Private
exports.toggleTracking = async (req, res) => {
  try {
    const { is_tracking_enabled, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({ success: false, message: 'Invalid Latitude' });
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({ success: false, message: 'Invalid Longitude' });
    }

    let city = null;
    if (latitude && longitude) {
      city = await getCityFromCoords(latitude, longitude);
    }

    if (is_tracking_enabled) {
      // START TRACKING
      await pool.query(
        `UPDATE users SET 
          is_tracking_enabled = true, 
          start_latitude = $1, 
          start_longitude = $2, 
          start_city = $3, 
          start_time = NOW(),
          last_latitude = $1,
          last_longitude = $2,
          last_location_time = NOW(),
          end_latitude = NULL,
          end_longitude = NULL,
          end_city = NULL,
          end_time = NULL
         WHERE id = $4`,
        [latitude, longitude, city, userId]
      );

      // Record in history as start point
      if (latitude && longitude) {
        await pool.query(
          'INSERT INTO worker_locations (user_id, latitude, longitude, city, is_tracking_start) VALUES ($1, $2, $3, $4, true)',
          [userId, latitude, longitude, city]
        );
      }
    } else {
      // STOP TRACKING
      await pool.query(
        `UPDATE users SET 
          is_tracking_enabled = false, 
          end_latitude = $1, 
          end_longitude = $2, 
          end_city = $3, 
          end_time = NOW(),
          last_latitude = $1,
          last_longitude = $2,
          last_location_time = NOW()
         WHERE id = $4`,
        [latitude, longitude, city, userId]
      );

      // Record in history as end point
      if (latitude && longitude) {
        await pool.query(
          'INSERT INTO worker_locations (user_id, latitude, longitude, city, is_tracking_end) VALUES ($1, $2, $3, $4, true)',
          [userId, latitude, longitude, city]
        );
      }
    }

    // Notify Admins about status change
    if (req.io) {
        req.io.emit('worker_status_change', {
            userId,
            is_tracking_enabled,
            latitude,
            longitude,
            city,
            time: new Date()
        });
    }

    res.json({
      success: true,
      message: `Tracking ${is_tracking_enabled ? 'enabled' : 'disabled'}`,
      is_tracking_enabled,
      city
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
    const { latitude, longitude, accuracy, city: clientCity } = req.body;
    const userId = req.user.id;

    // Validation
    if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    // 1. Fetch user tracking status and assigned geo-fence
    const userResult = await pool.query(
      `SELECT u.is_tracking_enabled, u.assigned_geofence_id, u.current_geofence_status,
              gf.latitude as gf_lat, gf.longitude as gf_lng, gf.radius as gf_radius
       FROM users u
       LEFT JOIN geo_fences gf ON u.assigned_geofence_id = gf.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userResult.rows[0];

    if (!userData.is_tracking_enabled) {
      return res.status(400).json({ success: false, message: 'Tracking is disabled' });
    }

    // 2. Calculate geo-fence status if geo-fence is assigned
    let geofenceStatus = 'UNKNOWN';
    if (userData.gf_lat && userData.gf_lng) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(userData.gf_lat),
        parseFloat(userData.gf_lng)
      );

      geofenceStatus = distance <= parseFloat(userData.gf_radius) ? 'INSIDE' : 'OUTSIDE';
    }

    // 3. Use client city or fetch if missing
    let city = clientCity;
    if (!city) {
        city = await getCityFromCoords(latitude, longitude);
    }

    // 4. Insert into worker_locations
    await pool.query(
      'INSERT INTO worker_locations (user_id, latitude, longitude, accuracy, geofence_status, city) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, latitude, longitude, accuracy, geofenceStatus, city]
    );

    // 5. Update users table with last known location and geo-fence status
    await pool.query(
      'UPDATE users SET last_latitude = $1, last_longitude = $2, last_location_time = NOW(), current_geofence_status = $3 WHERE id = $4',
      [latitude, longitude, geofenceStatus, userId]
    );

    // 6. Emit Real-time Update via Socket.io
    if (req.io) {
        req.io.emit('location_update', {
            userId,
            name: req.user.name,
            latitude,
            longitude,
            accuracy,
            geofence_status: geofenceStatus,
            city,
            recorded_at: new Date()
        });
    }

    res.json({ 
      success: true, 
      message: 'Location updated',
      geofence_status: geofenceStatus,
      city
    });
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
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.is_tracking_enabled, 
        u.last_latitude, 
        u.last_longitude, 
        u.last_location_time,
        u.current_geofence_status,
        u.assigned_geofence_id,
        u.start_latitude,
        u.start_longitude,
        u.start_city,
        u.start_time,
        u.end_latitude,
        u.end_longitude,
        u.end_city,
        u.end_time,
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

// @desc    Get current user's assigned geofence
// @route   GET /api/location/my-geofence
// @access  Private
exports.getMyGeofence = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT gf.* 
       FROM geo_fences gf
       JOIN users u ON u.assigned_geofence_id = gf.id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error getting geofence:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all geofences (Admin only)
// @route   GET /api/admin/geofences
// @access  Private/Admin
exports.getGeofences = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM geo_fences');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting geofences:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
