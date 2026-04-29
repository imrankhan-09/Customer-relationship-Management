const express = require('express');
const router = express.Router();
const { getLeadOpportunity, createOpportunity, addItem, updateStatus, getOpportunityStats } = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/lead/:lead_id', checkPermission('opportunities', 'view'), getLeadOpportunity);
router.get('/stats', checkPermission('opportunities', 'view'), getOpportunityStats);
router.post('/', checkPermission('opportunities', 'create'), createOpportunity);
router.post('/items', checkPermission('opportunities', 'create'), addItem);
router.put('/:id/status', checkPermission('opportunities', 'edit'), updateStatus);

module.exports = router;
