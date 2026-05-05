const { pool } = require('../config/db');

// @desc    Get latest notifications for dropdown
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE receiver_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    const unreadCount = await pool.query(
      'SELECT COUNT(*)::int as count FROM notifications WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      unreadCount: unreadCount.rows[0].count
    });
  } catch (error) {
    console.error('Error getting notifications:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get notification history with pagination
// @route   GET /api/notifications/history
// @access  Private
exports.getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // 'all', 'unread', 'read'

    let whereClause = 'WHERE receiver_id = $1';
    let params = [userId];

    if (filter === 'unread') {
      whereClause += ' AND is_read = false';
    } else if (filter === 'read') {
      whereClause += ' AND is_read = true';
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM notifications ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting notification history:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/read/:id
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND receiver_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Broadcast notification to all users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.broadcastNotification = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Get all active users
    const usersResult = await pool.query('SELECT id FROM users WHERE is_active = true');
    const users = usersResult.rows;

    const title = "Admin Alert";
    const type = "admin_alert";

    // 2. Create notifications for all users
    // Using a transaction or loop (for small user base, loop is fine, but for scale use batch insert)
    const notifications = [];
    for (const targetUser of users) {
      const result = await pool.query(
        `INSERT INTO notifications (title, message, receiver_id, type, sender_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, message, targetUser.id, type, senderId]
      );
      notifications.push(result.rows[0]);
      
      // 3. Emit real-time socket event if possible
      if (req.sendNotification) {
        req.sendNotification(targetUser.id, result.rows[0]);
      }
    }

    res.json({ 
      success: true, 
      message: `Alert broadcasted to ${users.length} users`,
      data: notifications[0] // Return one sample
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Helper function to create notification (internal use)
exports.createNotification = async ({ title, message, receiver_id, type, reference_id, redirect_url, sender_id = null }) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (title, message, receiver_id, type, reference_id, redirect_url, sender_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, message, receiver_id, type, reference_id, redirect_url, sender_id]
    );

    // If we have Socket.io, we should emit here.
    // For now, return the notification data.
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification helper:', error.message);
    return null;
  }
};
