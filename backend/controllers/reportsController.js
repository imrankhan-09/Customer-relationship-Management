const { pool } = require('../config/db');

exports.getCreatorReports = async (req, res) => {
  try {
    let creatorId = req.user.id;
    let { start_date, end_date, status, creator_id } = req.query;

    if (req.user.role === 'approver' || req.user.role === 'admin') {
      if (creator_id && creator_id !== 'all') {
        creatorId = creator_id;
      } else {
        creatorId = null; // null means all creators if requested by approver
      }
    } else if (req.user.role !== 'creator') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let baseQuery = `SELECT * FROM leads WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (creatorId) {
      baseQuery += ` AND created_by = $${paramIndex}`;
      queryParams.push(creatorId);
      paramIndex++;
    }

    if (start_date) {
      baseQuery += ` AND created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      baseQuery += ` AND created_at < $${paramIndex}::date + '1 day'::interval`;
      queryParams.push(end_date);
      paramIndex++;
    }

    if (status && status !== 'all') {
      if (status === 'assigned') {
        baseQuery += ` AND status = 'approved' AND assigned_to IS NOT NULL`;
      } else if (status === 'approved') {
        baseQuery += ` AND status = 'approved' AND assigned_to IS NULL`;
      } else {
        baseQuery += ` AND status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }
    }

    baseQuery += ` ORDER BY created_at ASC`;

    const { rows: leads } = await pool.query(baseQuery, queryParams);

    const total_leads = leads.length;
    
    const status_counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      assigned: 0,
      converted: 0
    };

    const leads_by_date = {};

    leads.forEach(lead => {
      const leadStatus = lead.status?.toLowerCase() || 'pending';
      if (leadStatus === 'approved' && lead.assigned_to) {
        status_counts['assigned']++;
      } else if (status_counts[leadStatus] !== undefined) {
        status_counts[leadStatus]++;
      } else {
        // Handle unexpected statuses gracefully
        if (!status_counts[leadStatus]) status_counts[leadStatus] = 0;
        status_counts[leadStatus]++;
      }

      const dateKey = new Date(lead.created_at).toISOString().split('T')[0];
      leads_by_date[dateKey] = (leads_by_date[dateKey] || 0) + 1;
    });

    const timeline = Object.keys(leads_by_date).map(date => ({
      date,
      count: leads_by_date[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      total_leads,
      status_counts,
      timeline,
      leads
    });

  } catch (error) {
    console.error('Error fetching creator reports:', error);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
};

exports.getWorkerReports = async (req, res) => {
  try {
    let workerId = req.user.id;
    let { start_date, end_date, worker_id, status } = req.query;

    if (req.user.role === 'approver' || req.user.role === 'admin') {
      if (worker_id && worker_id !== 'all') {
        workerId = worker_id;
      } else {
        workerId = null; 
      }
    } else if (req.user.role !== 'worker') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let leadsQuery = `SELECT * FROM leads WHERE 1=1 AND assigned_to IS NOT NULL`;
    let actQuery = `SELECT a.*, l.name as lead_name FROM activities a JOIN leads l ON a.lead_id = l.id WHERE 1=1`;
    
    let leadsParams = [];
    let actParams = [];
    let paramIndexL = 1;
    let paramIndexA = 1;

    if (workerId) {
      leadsQuery += ` AND assigned_to = $${paramIndexL}`;
      leadsParams.push(workerId);
      paramIndexL++;
      
      actQuery += ` AND a.user_id = $${paramIndexA}`;
      actParams.push(workerId);
      paramIndexA++;
    }

    if (start_date) {
      leadsQuery += ` AND created_at >= $${paramIndexL}`;
      leadsParams.push(start_date);
      paramIndexL++;
      
      actQuery += ` AND a.created_at >= $${paramIndexA}`;
      actParams.push(start_date);
      paramIndexA++;
    }

    if (end_date) {
      leadsQuery += ` AND created_at < $${paramIndexL}::date + '1 day'::interval`;
      leadsParams.push(end_date);
      paramIndexL++;
      
      actQuery += ` AND a.created_at < $${paramIndexA}::date + '1 day'::interval`;
      actParams.push(end_date);
      paramIndexA++;
    }

    // Status filter usually applies to the pipeline stage for workers or lead status
    if (status && status !== 'all') {
      // Worker typically manages pipeline_stage (won, lost, in progress)
      // but let's allow filtering by lead status as well if requested.
      if (['won', 'lost', 'new', 'contacted', 'demo', 'negotiation'].includes(status.toLowerCase())) {
         leadsQuery += ` AND pipeline_stage = $${paramIndexL}`;
         leadsParams.push(status.toLowerCase());
         paramIndexL++;
      } else {
         leadsQuery += ` AND status = $${paramIndexL}`;
         leadsParams.push(status);
         paramIndexL++;
      }
    }

    leadsQuery += ` ORDER BY created_at ASC`;
    actQuery += ` ORDER BY a.created_at ASC`;

    const [leadsResult, actResult] = await Promise.all([
      pool.query(leadsQuery, leadsParams),
      pool.query(actQuery, actParams)
    ]);

    const leads = leadsResult.rows;
    const activities = actResult.rows;

    const total_assigned = leads.length;
    let converted = 0;
    let lost = 0;
    let in_progress = 0;
    
    // Some status tracking for workers
    const status_dist = { assigned: 0, in_progress: 0, converted: 0, lost: 0 };
    
    // Determine worked on leads
    const workedLeadIds = new Set(activities.map(a => a.lead_id));
    const total_worked_on = workedLeadIds.size;

    leads.forEach(lead => {
      const stage = lead.pipeline_stage?.toLowerCase() || 'new';
      if (stage === 'won') {
        converted++;
        status_dist['converted']++;
      } else if (stage === 'lost') {
        lost++;
        status_dist['lost']++;
      } else if (['contacted', 'demo', 'negotiation'].includes(stage)) {
        in_progress++;
        status_dist['in_progress']++;
      } else {
        status_dist['assigned']++;
      }
    });

    // Activity types
    const act_types = {};
    const act_by_date = {};
    
    let pending_followups = 0;
    let completed_followups = 0;

    activities.forEach(act => {
      const type = act.type || 'Other';
      act_types[type] = (act_types[type] || 0) + 1;
      
      const dateKey = new Date(act.created_at).toISOString().split('T')[0];
      act_by_date[dateKey] = (act_by_date[dateKey] || 0) + 1;
      
      if (type.toLowerCase() === 'follow-up' || type.toLowerCase() === 'followup') {
        if (new Date(act.next_followup) < new Date()) {
          completed_followups++;
        } else {
          pending_followups++;
        }
      }
    });
    
    const timeline = Object.keys(act_by_date).map(date => ({
      date,
      count: act_by_date[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Also get opportunity details for leads if needed
    let ops = [];
    if (leads.length > 0) {
      const leadIds = leads.map(l => l.id);
      const { rows } = await pool.query(`SELECT * FROM opportunities WHERE lead_id = ANY($1::int[])`, [leadIds]);
      ops = rows;
    }

    res.json({
      summary: {
        total_assigned,
        total_worked_on,
        converted,
        lost,
        in_progress,
        total_activities: activities.length,
        pending_followups,
        completed_followups
      },
      status_dist,
      act_types,
      timeline,
      leads,
      activities,
      opportunities: ops
    });

  } catch (error) {
    console.error('Error fetching worker reports:', error);
    res.status(500).json({ error: 'Server error fetching worker reports' });
  }
};
