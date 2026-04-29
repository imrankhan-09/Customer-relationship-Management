const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  getLeadStats,
  deleteLead,
  getMonthlyStats,
  getLeadAnalytics
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// All lead routes are protected by JWT
router.use(protect);

router.get('/stats', checkPermission('leads', 'view'), getLeadStats);
router.get('/stats/monthly', checkPermission('leads', 'view'), getMonthlyStats);
router.get('/analytics/velocity', checkPermission('leads', 'view'), getLeadAnalytics);
router.post('/', checkPermission('leads', 'create'), createLead);

router.get('/', checkPermission('leads', 'view'), getLeads);
router.get('/:id', checkPermission('leads', 'view'), getLeadById);
router.put('/:id', checkPermission('leads', 'edit'), updateLead);
router.delete('/:id', checkPermission('leads', 'delete'), deleteLead);


module.exports = router;
