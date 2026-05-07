const express = require('express');
const router = express.Router();
const { toggleTracking, updateLocation, getMyGeofence } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/toggle', protect, toggleTracking);
router.post('/update', protect, updateLocation);
router.get('/my-geofence', protect, getMyGeofence);

module.exports = router;
