const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @access  Private
router.get('/', protect, getUsers);

module.exports = router;
