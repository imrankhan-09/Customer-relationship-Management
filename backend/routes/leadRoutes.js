const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  getLeadStats,
  deleteLead,
  getMonthlyStats
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

// All lead routes are protected
router.use(protect);

router.get('/stats', getLeadStats);
router.get('/stats/monthly', getMonthlyStats);
router.post('/', createLead);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);


module.exports = router;
