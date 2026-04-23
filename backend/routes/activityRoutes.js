const express = require('express');
const router = express.Router();
const { createActivity, getLeadActivities, getFollowUps, markActivityCompleted } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFollowUps);
router.post('/', createActivity);
router.get('/lead/:lead_id', getLeadActivities);
router.put('/:id/complete', markActivityCompleted);

module.exports = router;
