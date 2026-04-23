const { pool } = require('./config/db');

async function setupSalesTables() {
  try {
    console.log('--- Initializing Sales Flow Tables ---');
    
    // 1. Activities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id),
        type VARCHAR(50),
        description TEXT,
        next_followup TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Activities table verified.');

    // 2. Opportunities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        lead_id INT REFERENCES leads(id),
        created_by INT REFERENCES users(id),
        status VARCHAR(50) CHECK (status IN ('open','won','lost')),
        total_amount NUMERIC DEFAULT 0,
        lost_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Opportunities table verified.');

    // 3. Opportunity Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_items (
        id SERIAL PRIMARY KEY,
        opportunity_id INT REFERENCES opportunities(id) ON DELETE CASCADE,
        product_name VARCHAR(150),
        mrp NUMERIC,
        discount NUMERIC DEFAULT 0,
        final_price NUMERIC,
        quantity INT DEFAULT 1,
        total NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Opportunity Items table verified.');

    // 4. Appointments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        doctor_id INT REFERENCES leads(id),
        patient_id INT REFERENCES leads(id),
        appointment_date TIMESTAMP,
        status VARCHAR(50),
        notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Appointments table verified.');

    // 5. Ensure lead status constraint includes 'Converted' and 'Lost'
    // My previous check showed [ 'pending', 'approved', 'rejected', 'converted', 'assigned' ]
    // I should add 'Lost' and ensure 'Converted' is there (user said 'Converted', previous check was 'converted')
    // I'll update it to be very inclusive.
    await pool.query("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check");
    await pool.query(`
      ALTER TABLE leads ADD CONSTRAINT leads_status_check 
      CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'converted', 'assigned', 'Converted', 'Lost', 'lost']))
    `);
    console.log('Leads status constraint updated.');

    process.exit(0);
  } catch (err) {
    console.error('Error setting up sales tables:', err.message);
    process.exit(1);
  }
}

setupSalesTables();
