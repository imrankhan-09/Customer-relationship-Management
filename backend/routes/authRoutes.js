const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;
