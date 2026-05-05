const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getNotificationHistory, 
  markAsRead, 
  markAllAsRead,
  broadcastNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.get('/history', getNotificationHistory);
router.put('/read/:id', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/broadcast', checkRole('admin'), broadcastNotification);

module.exports = router;
