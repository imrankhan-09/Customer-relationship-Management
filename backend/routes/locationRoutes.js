const express = require('express');
const router = express.Router();
const { toggleTracking, updateLocation } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/toggle', protect, toggleTracking);
router.post('/update', protect, updateLocation);

module.exports = router;
