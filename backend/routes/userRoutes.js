const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// @route   GET /api/users
// @access  Private
router.get('/', protect, checkPermission('users', 'view'), getUsers);

module.exports = router;
