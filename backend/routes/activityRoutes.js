const express = require('express');
const router = express.Router();
const { createActivity, getLeadActivities, getFollowUps, markActivityCompleted } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', checkPermission('activities', 'view'), getFollowUps);
router.post('/', checkPermission('activities', 'create'), createActivity);
router.get('/lead/:lead_id', checkPermission('activities', 'view'), getLeadActivities);
router.put('/:id/complete', checkPermission('activities', 'edit'), markActivityCompleted);

module.exports = router;
