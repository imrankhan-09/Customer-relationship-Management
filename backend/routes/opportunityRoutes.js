const express = require('express');
const router = express.Router();
const { getLeadOpportunity, createOpportunity, addItem, updateStatus, getOpportunityStats } = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/lead/:lead_id', getLeadOpportunity);
router.get('/stats', getOpportunityStats);
router.post('/', createOpportunity);
router.post('/items', addItem);
router.put('/:id/status', updateStatus);

module.exports = router;
