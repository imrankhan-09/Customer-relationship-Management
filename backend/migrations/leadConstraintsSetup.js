const { pool } = require('../config/db');

const runLeadConstraintsSetup = async () => {
  const client = await pool.connect();

  try {
    console.log('--- Starting lead constraints setup ---');
    await client.query('BEGIN');

    // 1) Normalize obvious whitespace so duplicate checks are predictable.
    await client.query(`
      UPDATE leads
      SET
        name = TRIM(name),
        phone = NULLIF(TRIM(phone), ''),
        email = NULLIF(TRIM(email), '')
      WHERE
        name <> TRIM(name)
        OR phone IS DISTINCT FROM NULLIF(TRIM(phone), '')
        OR email IS DISTINCT FROM NULLIF(TRIM(email), '');
    `);

    // 2) Handle existing duplicates safely before unique constraints.
    // Keep the oldest row by id and sanitize later duplicates.
    await client.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY phone ORDER BY id) AS rn
        FROM leads
        WHERE phone IS NOT NULL
      )
      UPDATE leads l
      SET phone = NULL
      FROM ranked r
      WHERE l.id = r.id AND r.rn > 1;
    `);

    await client.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY id) AS rn
        FROM leads
        WHERE email IS NOT NULL
      )
      UPDATE leads l
      SET email = NULL
      FROM ranked r
      WHERE l.id = r.id AND r.rn > 1;
    `);

    await client.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY id) AS rn
        FROM leads
      )
      UPDATE leads l
      SET name = CONCAT(l.name, ' (duplicate-', l.id, ')')
      FROM ranked r
      WHERE l.id = r.id AND r.rn > 1;
    `);

    // 3) Handle invalid existing values before format checks.
    await client.query(`
      UPDATE leads
      SET phone = NULL
      WHERE phone IS NOT NULL AND phone !~ '^[0-9]{10}$';
    `);

    await client.query(`
      UPDATE leads
      SET email = NULL
      WHERE email IS NOT NULL
        AND email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    `);

    // 4) Drop old constraints/indexes if they exist, then add strict constraints.
    await client.query(`
      ALTER TABLE leads
      DROP CONSTRAINT IF EXISTS leads_phone_unique,
      DROP CONSTRAINT IF EXISTS leads_email_unique,
      DROP CONSTRAINT IF EXISTS leads_name_unique,
      DROP CONSTRAINT IF EXISTS leads_phone_format_check,
      DROP CONSTRAINT IF EXISTS leads_email_format_check;
    `);

    await client.query(`
      DROP INDEX IF EXISTS leads_phone_unique_idx;
      DROP INDEX IF EXISTS leads_email_unique_idx;
      DROP INDEX IF EXISTS leads_name_unique_idx;
    `);

    await client.query(`
      ALTER TABLE leads
      ADD CONSTRAINT leads_phone_unique UNIQUE (phone),
      ADD CONSTRAINT leads_email_unique UNIQUE (email),
      ADD CONSTRAINT leads_name_unique UNIQUE (name),
      ADD CONSTRAINT leads_phone_format_check CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$'),
      ADD CONSTRAINT leads_email_format_check CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    `);

    await client.query('COMMIT');
    console.log('✅ Lead constraints setup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to apply lead constraints:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

runLeadConstraintsSetup();
