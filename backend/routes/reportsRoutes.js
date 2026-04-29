const express = require('express');
const router = express.Router();
const { getCreatorReports, getWorkerReports } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

router.get('/creator', protect, checkPermission('leads', 'view'), getCreatorReports);
router.get('/worker', protect, checkPermission('leads', 'view'), getWorkerReports);

module.exports = router;
