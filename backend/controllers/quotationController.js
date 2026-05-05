const { pool } = require('../config/db');

// @desc    Create new quotation
// @route   POST /api/quotation/create
// @access  Private
const createQuotation = async (req, res) => {
  const { lead_id, title, description, base_price, discount, valid_till, notes } = req.body;
  const created_by = req.user.id;

  if (!lead_id || !base_price) {
    return res.status(400).json({ message: 'Lead ID and Base Price are required' });
  }

  try {
    const final_price = parseFloat(base_price) - (parseFloat(discount) || 0);

    const query = `
      INSERT INTO quotations (lead_id, created_by, title, description, base_price, discount, final_price, valid_till, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Draft', $9)
      RETURNING *;
    `;
    const values = [
      lead_id,
      created_by,
      title || 'MedBridge CRM Quotation',
      description,
      base_price,
      discount || 0,
      final_price,
      valid_till || null,
      notes
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Quotation Error:', error.message);
    res.status(500).json({ message: 'Server error creating quotation' });
  }
};

// @desc    Get quotations for a lead
// @route   GET /api/quotation/:lead_id
// @access  Private
const getQuotationsByLead = async (req, res) => {
  const { lead_id } = req.params;

  try {
    const query = `
      SELECT q.*, u.name as creator_name 
      FROM quotations q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.lead_id = $1
      ORDER BY q.created_at DESC
    `;
    const result = await pool.query(query, [lead_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Quotations Error:', error.message);
    res.status(500).json({ message: 'Server error fetching quotations' });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotation/update/:id
// @access  Private
const updateQuotation = async (req, res) => {
  const { id } = req.params;
  const { title, description, base_price, discount, valid_till, notes } = req.body;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    // Check permission
    const checkQuery = 'SELECT created_by FROM quotations WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (userRole !== 'admin' && userRole !== 'approver' && checkResult.rows[0].created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this quotation' });
    }

    const final_price = parseFloat(base_price) - (parseFloat(discount) || 0);

    const query = `
      UPDATE quotations 
      SET title = $1, description = $2, base_price = $3, discount = $4, final_price = $5, valid_till = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *;
    `;
    const values = [title, description, base_price, discount, final_price, valid_till, notes, id];

    const result = await pool.query(query, values);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update Quotation Error:', error.message);
    res.status(500).json({ message: 'Server error updating quotation' });
  }
};

// @desc    Update quotation status
// @route   PATCH /api/quotation/status/:id
// @access  Private
const updateQuotationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const query = `
      UPDATE quotations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update Status Error:', error.message);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

module.exports = {
  createQuotation,
  getQuotationsByLead,
  updateQuotation,
  updateQuotationStatus
};
