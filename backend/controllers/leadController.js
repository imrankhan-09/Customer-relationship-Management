const { pool } = require('../config/db');

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  const { name, phone, email, type, extra_data } = req.body;
  const created_by = req.user.id;

  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedType = typeof type === 'string' ? type.trim() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';

  // Basic validation
  if (!normalizedName || !normalizedType) {
    return res.status(400).json({ message: 'Name and Type are required' });
  }

  if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
    return res.status(400).json({ message: 'Invalid phone' });
  }

  if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  try {
    if (normalizedPhone) {
      const phoneDuplicate = await pool.query(
        'SELECT id FROM leads WHERE phone = $1 LIMIT 1',
        [normalizedPhone]
      );
      if (phoneDuplicate.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate phone number' });
      }
    }

    if (normalizedEmail) {
      const emailDuplicate = await pool.query(
        'SELECT id FROM leads WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [normalizedEmail]
      );
      if (emailDuplicate.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate email' });
      }
    }

    const nameDuplicate = await pool.query(
      'SELECT id FROM leads WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [normalizedName]
    );
    if (nameDuplicate.rows.length > 0) {
      return res.status(409).json({ message: 'Duplicate name' });
    }

    const query = `
      INSERT INTO leads (name, phone, email, type, extra_data, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      normalizedName,
      normalizedPhone || null,
      normalizedEmail || null,
      normalizedType,
      JSON.stringify(extra_data || {}),
      created_by
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Lead Error:', error.message);
    if (error.code === '23505') {
      if ((error.constraint || '').includes('phone')) {
        return res.status(409).json({ message: 'Duplicate phone number' });
      }
      if ((error.constraint || '').includes('email')) {
        return res.status(409).json({ message: 'Duplicate email' });
      }
      if ((error.constraint || '').includes('name')) {
        return res.status(409).json({ message: 'Duplicate name' });
      }
      return res.status(409).json({ message: 'Duplicate lead data' });
    }
    if (error.code === '23514') {
      if ((error.constraint || '').includes('phone')) {
        return res.status(400).json({ message: 'Invalid phone' });
      }
      if ((error.constraint || '').includes('email')) {
        return res.status(400).json({ message: 'Invalid email' });
      }
    }
    res.status(500).json({ message: 'Server error creating lead' });
  }
};

// @desc    Get all leads (with optional search)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  const { search } = req.query;
  const { id: userId, role: userRole } = req.user;

  try {
    let query = `
      SELECT l.*, u.name as assigned_worker_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1
    `;
    let values = [];
    let argIndex = 1;

    // 1. Role-based filtering
    if (userRole === 'creator') {
      query += ` AND l.created_by = $${argIndex++}`;
      values.push(userId);
    } else if (userRole === 'worker') {
      query += ` AND l.assigned_to = $${argIndex++}`;
      values.push(userId);
    }
    // Admin and Approver see everything (1=1 covers them)

    // 2. Search filtering
    if (search) {
      query += ` AND (
        l.name ILIKE $${argIndex} OR 
        l.email ILIKE $${argIndex} OR 
        l.phone ILIKE $${argIndex} OR 
        l.type ILIKE $${argIndex}
      )`;
      values.push(`%${search}%`);
      argIndex++;
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

    // 3. Enforce restrictions for non-authority roles (only Admin and Approver can change status/assignment)
    if (userRole !== 'approver' && userRole !== 'admin') {
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

    // 4. Handle stage history tracking
    if (pipeline_stage !== undefined && pipeline_stage !== currentLead.pipeline_stage) {
      // Calculate duration of previous stage
      const leftAt = new Date();
      const enteredAt = new Date(currentLead.last_stage_change);
      const durationSeconds = Math.floor((leftAt - enteredAt) / 1000);

      // Close previous stage record
      await pool.query(`
        UPDATE lead_stage_history 
        SET left_at = $1, duration_seconds = $2 
        WHERE lead_id = $3 AND stage = $4 AND left_at IS NULL
      `, [leftAt, durationSeconds, parsedLeadId, currentLead.pipeline_stage]);

      // Create new stage record
      await pool.query(`
        INSERT INTO lead_stage_history (lead_id, stage, entered_at, changed_by)
        VALUES ($1, $2, $3, $4)
      `, [parsedLeadId, pipeline_stage, leftAt, req.user.id]);

      // Update lead's last_stage_change
      await pool.query(`
        UPDATE leads SET last_stage_change = $1 WHERE id = $2
      `, [leftAt, parsedLeadId]);
    }

    // 5. Perform update
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
      finalExtraData || {}, 
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
  const { id: userId, role: userRole } = req.user;

  try {
    console.log('--- Fetching Lead Statistics ---');
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    if (userRole === 'creator') {
      whereClause = 'WHERE created_by = $1';
      params = [userId];
    } else if (userRole === 'worker') {
      whereClause = 'WHERE assigned_to = $1';
      params = [userId];
    }

    const totalLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause}`;
    const activeLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status != 'converted' AND status != 'rejected'`;
    const convertedLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status = 'converted'`;
    const approvedLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status = 'approved'`;
    const rejectedLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status = 'rejected'`;
    const pendingLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status = 'pending'`;
    const assignedLeadsQuery = `SELECT COUNT(*) FROM leads ${whereClause} AND status = 'assigned'`;
    
    const [total, active, converted, approved, rejected, pending, assigned] = await Promise.all([
      pool.query(totalLeadsQuery, params),
      pool.query(activeLeadsQuery, params),
      pool.query(convertedLeadsQuery, params),
      pool.query(approvedLeadsQuery, params),
      pool.query(rejectedLeadsQuery, params),
      pool.query(pendingLeadsQuery, params),
      pool.query(assignedLeadsQuery, params)
    ]);

    const typeBreakdownQuery = `SELECT type, COUNT(*) as value FROM leads ${whereClause} GROUP BY type`;
    const typeResult = await pool.query(typeBreakdownQuery, params);

    const recentLeadsQuery = `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT 5`;
    const recentResult = await pool.query(recentLeadsQuery, params);

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
  const { id: userId, role: userRole } = req.user;

  try {
    console.log('--- Fetching Monthly Stats ---');
    
    let whereClause = 'WHERE created_at >= NOW() - INTERVAL \'6 months\'';
    let params = [];
    if (userRole === 'creator') {
      whereClause += ' AND created_by = $1';
      params = [userId];
    } else if (userRole === 'worker') {
      whereClause += ' AND assigned_to = $1';
      params = [userId];
    }

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
      ${whereClause}
      GROUP BY month
      ORDER BY sort_date ASC
    `;
    const result = await pool.query(query, params);
    
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

// @desc    Get lead analytics (stage velocity)
// @route   GET /api/leads/analytics/velocity
// @access  Private
const getLeadAnalytics = async (req, res) => {
  try {
    const query = `
      SELECT 
        stage, 
        AVG(duration_seconds) as avg_duration,
        COUNT(*) as total_occurrences
      FROM lead_stage_history
      WHERE duration_seconds IS NOT NULL
      GROUP BY stage
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Analytics Error:', error.message);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  getLeadStats,
  deleteLead,
  getMonthlyStats,
  getLeadAnalytics
};



