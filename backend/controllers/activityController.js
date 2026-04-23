const { pool } = require('../config/db');

// @desc    Log a new activity for a lead
// @route   POST /api/activities
// @access  Private
const createActivity = async (req, res) => {
  const { lead_id, type, description, next_followup } = req.body;
  const user_id = req.user.id;

  console.log('--- Logging Activity ---');
  console.log('Payload:', { lead_id, type, description, next_followup, user_id });

  try {
    // 1. Validation & Formatting
    if (!lead_id || !type) {
      return res.status(400).json({ message: 'Lead ID and Type are required' });
    }

    const formattedLeadId = parseInt(lead_id, 10);
    const formattedNextFollowup = next_followup ? new Date(next_followup) : null;

    // 2. Store the activity
    const activityQuery = `
      INSERT INTO activities (lead_id, user_id, type, description, next_followup)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    // Fixed: Passing 5 parameters to match 5 placeholders
    const activityResult = await pool.query(activityQuery, [
      formattedLeadId, 
      user_id, 
      type, 
      description || null, 
      formattedNextFollowup
    ]);

    console.log('Activity logged successfully:', activityResult.rows[0].id);

    // 3. Auto-update lead status/pipeline based on activity type
    let newPipelineStage = null;

    const typeLower = type.toLowerCase();
    if (typeLower.includes('call')) {
      newPipelineStage = 'contacted';
    } else if (typeLower.includes('demo')) {
      newPipelineStage = 'demo';
    } else if (typeLower.includes('follow-up') || typeLower.includes('followup') || typeLower.includes('negotiation')) {
      newPipelineStage = 'negotiation';
    }

    if (newPipelineStage) {
      console.log(`Updating lead ${formattedLeadId} pipeline to ${newPipelineStage}`);
      await pool.query(
        'UPDATE leads SET pipeline_stage = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newPipelineStage, 'assigned', formattedLeadId]
      );

      // 4. Auto-create Opportunity if lead reaches Demo or Negotiation
      if (newPipelineStage === 'demo' || newPipelineStage === 'negotiation') {
        const checkOpp = await pool.query(
          "SELECT id FROM opportunities WHERE lead_id = $1 AND status = 'open'",
          [formattedLeadId]
        );

        if (checkOpp.rows.length === 0) {
          await pool.query(
            "INSERT INTO opportunities (lead_id, created_by, status, total_amount) VALUES ($1, $2, 'open', 0)",
            [formattedLeadId, user_id]
          );
          console.log(`Auto-created opportunity for lead ${formattedLeadId}`);
        }
      }
    }

    res.status(201).json(activityResult.rows[0]);
  } catch (error) {
    console.error('Create Activity Error Details:', {
      message: error.message,
      stack: error.stack,
      payload: req.body
    });
    res.status(500).json({ 
      message: 'Server error logging activity',
      error: error.message 
    });
  }
};

// @desc    Get all activities for a lead
// @route   GET /api/activities/lead/:lead_id
// @access  Private
const getLeadActivities = async (req, res) => {
  const { lead_id } = req.params;
  try {
    const query = `
      SELECT a.*, u.name as user_name 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.lead_id = $1 
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [lead_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Lead Activities Error:', error.message);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
};

// @desc    Get all follow-ups for current user or all (if approver)
// @route   GET /api/activities
// @access  Private
const getFollowUps = async (req, res) => {
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {
    let query = `
      SELECT a.*, l.name as lead_name, l.phone as lead_phone, u.name as worker_name
      FROM activities a
      JOIN leads l ON a.lead_id = l.id
      JOIN users u ON a.user_id = u.id
    `;
    let values = [];

    if (user_role !== 'approver') {
      query += ` WHERE (a.user_id = $1 OR l.assigned_to = $1)`;
      values.push(user_id);
    }

    query += ` ORDER BY a.next_followup ASC NULLS LAST, a.created_at DESC`;
    
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Follow-ups Error:', error.message);
    res.status(500).json({ message: 'Server error fetching follow-ups' });
  }
};

// @desc    Mark activity as completed
// @route   PUT /api/activities/:id/complete
// @access  Private
const markActivityCompleted = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE activities 
      SET completed = true, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Mark Activity Completed Error:', error.message);
    res.status(500).json({ message: 'Server error updating activity' });
  }
};

module.exports = {
  createActivity,
  getLeadActivities,
  getFollowUps,
  markActivityCompleted
};
