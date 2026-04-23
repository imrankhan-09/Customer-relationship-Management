const express = require('express');
const router = express.Router();
const { getCreatorReports, getWorkerReports } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/creator', protect, getCreatorReports);
router.get('/worker', protect, getWorkerReports);

module.exports = router;
