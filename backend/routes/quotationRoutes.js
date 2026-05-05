const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createQuotation,
  getQuotationsByLead,
  updateQuotation,
  updateQuotationStatus
} = require('../controllers/quotationController');

router.use(protect);

router.post('/create', createQuotation);
router.get('/:lead_id', getQuotationsByLead);
router.put('/update/:id', updateQuotation);
router.patch('/status/:id', updateQuotationStatus);

module.exports = router;
