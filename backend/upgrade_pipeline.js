const { pool } = require('./config/db');

async function upgradePipeline() {
  try {
    console.log('--- Upgrading Pipeline Infrastructure ---');

    // 1. Add last_stage_change column to leads
    await pool.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS last_stage_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('Column last_stage_change added to leads.');

    // 2. Create lead_stage_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_stage_history (
        id SERIAL PRIMARY KEY,
        lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        duration_seconds INT,
        changed_by INT REFERENCES users(id)
      );
    `);
    console.log('lead_stage_history table created.');

    // 3. Initialize history for existing leads
    await pool.query(`
      INSERT INTO lead_stage_history (lead_id, stage, entered_at, changed_by)
      SELECT id, pipeline_stage, created_at, created_by 
      FROM leads 
      WHERE id NOT IN (SELECT lead_id FROM lead_stage_history);
    `);
    console.log('Initialized stage history for existing leads.');

    console.log('--- Pipeline Upgrade Completed ---');
    process.exit(0);
  } catch (err) {
    console.error('Error upgrading pipeline:', err.message);
    process.exit(1);
  }
}

upgradePipeline();
