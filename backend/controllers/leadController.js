const { pool } = require('../config/db');

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  const { name, phone, email, type, extra_data } = req.body;
  const created_by = req.user.id;

  // Basic validation
  if (!name || !type) {
    return res.status(400).json({ message: 'Name and Type are required' });
  }

  try {
    const query = `
      INSERT INTO leads (name, phone, email, type, extra_data, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [name, phone, email, type, JSON.stringify(extra_data || {}), created_by];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Lead Error:', error.message);
    res.status(500).json({ message: 'Server error creating lead' });
  }
};

// @desc    Get all leads (with optional search)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT l.*, u.name as assigned_worker_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id
    `;
    let values = [];

    if (search) {
      query += ` WHERE 
        l.name ILIKE $1 OR 
        l.email ILIKE $1 OR 
        l.phone ILIKE $1 OR 
        l.type ILIKE $1`;
      values.push(`%${search}%`);
    }

    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Leads Error:', error.message);
    res.status(500).json({ message: 'Server error fetching leads' });
  }
};


// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM leads WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get Lead Error:', error.message);
    res.status(500).json({ message: 'Server error fetching lead' });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    phone, 
    email, 
    type, 
    status, 
    pipeline_stage, 
    assigned_to, 
    extra_data,
    notes,
    rejection_reason
  } = req.body;
  const userRole = req.user.role;

  try {
    // 1. Fetch ALL current lead data to support partial updates
    const parsedId = parseInt(id);
    const currentLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [parsedId]);
    
    if (currentLeadResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const currentLead = currentLeadResult.rows[0];

    // 2. Merge values (use existing if not provided in body)
    const finalName = name !== undefined ? name : currentLead.name;
    const finalPhone = phone !== undefined ? phone : currentLead.phone;
    const finalEmail = email !== undefined ? email : currentLead.email;
    const finalType = type !== undefined ? type : currentLead.type;
    const finalExtraData = extra_data !== undefined ? extra_data : currentLead.extra_data;
    const finalNotes = notes !== undefined ? notes : currentLead.notes;
    let finalRejectionReason = rejection_reason !== undefined ? rejection_reason : currentLead.rejection_reason;
    
    let finalStatus = status !== undefined ? status : currentLead.status;
    let finalPipelineStage = pipeline_stage !== undefined ? pipeline_stage : currentLead.pipeline_stage;
    let finalAssignedTo = assigned_to !== undefined ? assigned_to : currentLead.assigned_to;

    // Ensure numeric types are actually numbers or null
    const parsedAssignedTo = finalAssignedTo ? parseInt(finalAssignedTo) : null;
    const parsedLeadId = parseInt(id);

    // Automatic status update: If assigned_to is provided and it's a verification flow
    if (assigned_to !== undefined && assigned_to !== null && finalStatus === 'approved') {
      finalStatus = 'assigned';
    }

    // 3. Enforce restrictions for non-approver roles
    if (userRole !== 'approver') {
      const isTryingToChangeStatus = status !== undefined && status !== currentLead.status;
      const isTryingToChangePipeline = pipeline_stage !== undefined && pipeline_stage !== currentLead.pipeline_stage;
      const isTryingToChangeAssignment = assigned_to !== undefined && assigned_to !== currentLead.assigned_to;

      // Special case: Allow Creator to resubmit a rejected lead (rejected -> pending)
      const isResubmitting = currentLead.status === 'rejected' && status === 'pending';

      if ((isTryingToChangeStatus && !isResubmitting) || isTryingToChangePipeline || isTryingToChangeAssignment) {
        return res.status(403).json({ 
          message: 'Permission Denied: Only Approvers can modify lead status, pipeline stage, or assignments.' 
        });
      }
      
      if (isResubmitting) {
        finalRejectionReason = null;
      } else {
        finalStatus = currentLead.status;
        finalPipelineStage = currentLead.pipeline_stage;
        finalAssignedTo = currentLead.assigned_to;
      }
    }

    // 4. Perform update
    const query = `
      UPDATE leads 
      SET 
        name = $1, 
        phone = $2, 
        email = $3, 
        type = $4, 
        status = $5, 
        pipeline_stage = $6, 
        extra_data = $7, 
        assigned_to = $8, 
        notes = $9, 
        rejection_reason = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *;
    `;
    const values = [
      finalName,
      finalPhone,
      finalEmail,
      finalType,
      finalStatus,
      finalPipelineStage,
      finalExtraData || {}, // Pass as object, pg driver handles jsonb
      parsedAssignedTo,
      finalNotes,
      finalRejectionReason,
      parsedLeadId
    ];

    const result = await pool.query(query, values);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update Lead Error Detail:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params
    });
    res.status(500).json({ message: `Server error updating lead: ${error.message}` });
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = async (req, res) => {
  try {
    console.log('--- Fetching Lead Statistics ---');
    const totalLeadsQuery = 'SELECT COUNT(*) FROM leads';
    const activeLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status != 'converted' AND status != 'rejected'";
    const convertedLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status = 'converted'";
    const approvedLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status = 'approved'";
    const rejectedLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status = 'rejected'";
    const pendingLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status = 'pending'";
    const assignedLeadsQuery = "SELECT COUNT(*) FROM leads WHERE status = 'assigned'";
    
    const [total, active, converted, approved, rejected, pending, assigned] = await Promise.all([
      pool.query(totalLeadsQuery),
      pool.query(activeLeadsQuery),
      pool.query(convertedLeadsQuery),
      pool.query(approvedLeadsQuery),
      pool.query(rejectedLeadsQuery),
      pool.query(pendingLeadsQuery),
      pool.query(assignedLeadsQuery)
    ]);

    const typeBreakdownQuery = 'SELECT type, COUNT(*) as value FROM leads GROUP BY type';
    const typeResult = await pool.query(typeBreakdownQuery);

    const recentLeadsQuery = 'SELECT * FROM leads ORDER BY created_at DESC LIMIT 5';
    const recentResult = await pool.query(recentLeadsQuery);

    const stats = {
      total: parseInt(total.rows[0].count) || 0,
      active: parseInt(active.rows[0].count) || 0,
      converted: parseInt(converted.rows[0].count) || 0,
      approved: parseInt(approved.rows[0].count) || 0,
      rejected: parseInt(rejected.rows[0].count) || 0,
      pending: parseInt(pending.rows[0].count) || 0,
      assigned: parseInt(assigned.rows[0].count) || 0,
      byType: typeResult.rows,
      recent: recentResult.rows
    };

    console.log('Stats calculated:', stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// @desc    Get monthly lead performance stats
// @route   GET /api/leads/stats/monthly
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    console.log('--- Fetching Monthly Stats ---');
    const query = `
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        MIN(created_at) as sort_date
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY sort_date ASC
    `;
    const result = await pool.query(query);
    
    const stats = {
      months: result.rows.map(r => r.month),
      total: result.rows.map(r => parseInt(r.total)),
      approved: result.rows.map(r => parseInt(r.approved)),
      rejected: result.rows.map(r => parseInt(r.rejected)),
      assigned: result.rows.map(r => parseInt(r.assigned)),
      converted: result.rows.map(r => parseInt(r.converted))
    };

    console.log('Monthly stats result:', stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Monthly Stats Error:', error.message);
    res.status(500).json({ message: 'Server error fetching monthly stats' });
  }
};


// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM leads WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete Lead Error:', error.message);
    res.status(500).json({ message: 'Server error deleting lead' });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  getLeadStats,
  deleteLead,
  getMonthlyStats
};



