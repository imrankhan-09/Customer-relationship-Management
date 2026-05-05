const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const setupNotifications = async () => {
  const client = await pool.connect();

  try {
    console.log('--- Starting Notification System Migration ---');
    
    // 1. Create Notifications Table
    const createNotificationsTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        sender_id INT REFERENCES users(id) ON DELETE SET NULL,
        receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        reference_id INT,
        redirect_url TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createNotificationsTableQuery);
    console.log('✅ Notifications table created successfully');

    // 2. Create index on receiver_id and is_read for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_receiver_read ON notifications(receiver_id, is_read)');
    console.log('✅ Index created successfully');

    console.log('--- Notification System Migration Completed ---');
  } catch (error) {
    console.error('❌ Error during notification migration:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

setupNotifications();
