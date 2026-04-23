const { pool } = require('../config/db');

// @desc    Get active opportunity for a lead
// @route   GET /api/opportunities/lead/:lead_id
// @access  Private
const getLeadOpportunity = async (req, res) => {
  const { lead_id } = req.params;
  try {
    // Get the latest opportunity for this lead
    const query = `
      SELECT o.*, 
             (SELECT json_agg(i.*) FROM opportunity_items i WHERE i.opportunity_id = o.id) as items
      FROM opportunities o
      WHERE o.lead_id = $1
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [lead_id]);
    res.status(200).json(result.rows[0] || null);
  } catch (error) {
    console.error('Get Lead Opportunity Error:', error.message);
    res.status(500).json({ message: 'Server error fetching opportunity' });
  }
};

// @desc    Create a new opportunity
// @route   POST /api/opportunities
// @access  Private
const createOpportunity = async (req, res) => {
  const { lead_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if an open opportunity already exists
    const checkQuery = "SELECT id FROM opportunities WHERE lead_id = $1 AND status = 'open'";
    const checkResult = await pool.query(checkQuery, [lead_id]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'An open opportunity already exists for this lead' });
    }

    const insertQuery = `
      INSERT INTO opportunities (lead_id, created_by, status, total_amount)
      VALUES ($1, $2, 'open', 0)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [lead_id, user_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Opportunity Error:', error.message);
    res.status(500).json({ message: 'Server error creating opportunity' });
  }
};

// @desc    Add item to opportunity
// @route   POST /api/opportunities/items
// @access  Private
const addItem = async (req, res) => {
  const { opportunity_id, product_name, mrp, discount, quantity } = req.body;
  
  if (!product_name || !mrp || !quantity) {
    return res.status(400).json({ message: 'Product name, MRP, and quantity are required' });
  }

  const final_price = parseFloat(mrp) - parseFloat(discount || 0);
  const total = final_price * parseInt(quantity || 1);

  try {
    // Check if opportunity is open
    const oppCheck = await pool.query("SELECT status FROM opportunities WHERE id = $1", [opportunity_id]);
    if (oppCheck.rows.length === 0) return res.status(404).json({ message: 'Opportunity not found' });
    if (oppCheck.rows[0].status !== 'open') return res.status(400).json({ message: 'Cannot add items to a closed opportunity' });

    const query = `
      INSERT INTO opportunity_items (opportunity_id, product_name, mrp, discount, final_price, quantity, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query(query, [opportunity_id, product_name, mrp, discount, final_price, quantity, total]);

    // Update opportunity total_amount
    await pool.query(
      'UPDATE opportunities SET total_amount = (SELECT SUM(total) FROM opportunity_items WHERE opportunity_id = $1), updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [opportunity_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add Item Error:', error.message);
    res.status(500).json({ message: 'Server error adding product' });
  }
};

// @desc    Update opportunity status (WON/LOST)
// @route   PUT /api/opportunities/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, lost_reason } = req.body; // 'won' or 'lost'

  try {
    // 1. Validation for WON
    if (status === 'won') {
      const itemsCheck = await pool.query("SELECT COUNT(*) FROM opportunity_items WHERE opportunity_id = $1", [id]);
      if (parseInt(itemsCheck.rows[0].count) === 0) {
        return res.status(400).json({ message: 'Cannot mark as WON without adding any products' });
      }
    }

    // 2. Update opportunity
    const query = `
      UPDATE opportunities 
      SET status = $1, lost_reason = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *;
    `;
    const result = await pool.query(query, [status, lost_reason, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    const opportunity = result.rows[0];

    // 3. Sync with lead status and pipeline stage
    const leadStatus = status === 'won' ? 'Converted' : 'Lost';
    const pipelineStage = status === 'won' ? 'won' : 'lost';

    await pool.query(
      'UPDATE leads SET status = $1, pipeline_stage = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [leadStatus, pipelineStage, opportunity.lead_id]
    );

    res.status(200).json(opportunity);
  } catch (error) {
    console.error('Update Opportunity Status Error:', error.message);
    res.status(500).json({ message: 'Server error updating deal status' });
  }
};

// @desc    Get opportunity statistics for a worker
// @route   GET /api/opportunities/stats
// @access  Private
const getOpportunityStats = async (req, res) => {
  const user_id = req.user.id;
  try {
    const query = `
      SELECT 
        COUNT(*) as total_deals,
        SUM(CASE WHEN status = 'won' THEN total_amount ELSE 0 END) as total_revenue,
        COUNT(*) FILTER (WHERE status = 'open') as open_deals,
        COUNT(*) FILTER (WHERE status = 'won') as won_deals,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_deals
      FROM opportunities
      WHERE created_by = $1
    `;
    const result = await pool.query(query, [user_id]);
    
    // Also get pipeline distribution from leads assigned to this user
    const pipelineQuery = `
      SELECT pipeline_stage, COUNT(*) 
      FROM leads 
      WHERE assigned_to = $1 
      AND pipeline_stage IN ('negotiation', 'won', 'lost')
      GROUP BY pipeline_stage
    `;
    const pipelineResult = await pool.query(pipelineQuery, [user_id]);

    res.status(200).json({
      ...result.rows[0],
      pipeline_distribution: pipelineResult.rows
    });
  } catch (error) {
    console.error('Get Opportunity Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching opportunity stats' });
  }
};

module.exports = {
  getLeadOpportunity,
  createOpportunity,
  addItem,
  updateStatus,
  getOpportunityStats
};
