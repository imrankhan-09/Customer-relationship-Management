const { pool } = require('../config/db');

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  const { doctor_id, patient_id, appointment_date, notes } = req.body;
  try {
    const query = `
      INSERT INTO appointments (doctor_id, patient_id, appointment_date, notes, status)
      VALUES ($1, $2, $3, $4, 'scheduled')
      RETURNING *;
    `;
    const result = await pool.query(query, [doctor_id, patient_id, appointment_date, notes]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Appointment Error:', error.message);
    res.status(500).json({ message: 'Server error creating appointment' });
  }
};

module.exports = { createAppointment };
