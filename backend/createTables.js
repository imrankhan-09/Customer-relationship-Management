const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('--- Starting Database Initialization ---');
    
    // Begin transaction
    await client.query('BEGIN');

    // 1. Create Update Timestamp Function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    await client.query(createFunctionQuery);
    console.log('✅ Update function created successfully');

    // 2. Create Users Table
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersQuery);

    // Create Trigger for Users
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Users table and trigger created successfully');

    // 3. Create Leads Table
    const createLeadsQuery = `
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(150),
        type VARCHAR(50),
        
        status VARCHAR(50) DEFAULT 'pending' 
          CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
          
        pipeline_stage VARCHAR(50) DEFAULT 'new' 
          CHECK (pipeline_stage IN ('new', 'contacted', 'demo', 'negotiation', 'won', 'lost')),
          
        outcome VARCHAR(50),
        extra_data JSONB,
        
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createLeadsQuery);

    // Create Trigger for Leads
    await client.query(`
      DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
      CREATE TRIGGER update_leads_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Leads table and trigger created successfully');


    // Commit transaction
    await client.query('COMMIT');
    console.log('--- Database Initialization Completed ---');

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.log('❌ Error during database initialization:');
    console.error(error.message);
  } finally {
    // Release client back to pool and end pool connection
    client.release();
    await pool.end();
    process.exit(0);
  }
};

createTables();
