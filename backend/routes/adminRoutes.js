const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignRole,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions,
  getDashboardStats,
  getAdminLeads,
  getPerformanceReport,
  getAdminReports,
  getUsersWithLastLogin,
  getUserLoginHistory,
  getLoginStats,
  getRecentLogins
} = require('../controllers/adminController');

// All admin routes require authentication
router.use(protect);

// ==================== DASHBOARD ====================
router.get('/dashboard-stats', checkRole('admin'), getDashboardStats);
router.get('/leads', checkRole('admin'), getAdminLeads);
router.get('/performance-report', checkRole('admin'), getPerformanceReport);
router.get('/reports', checkRole('admin'), getAdminReports);

// ==================== USER MANAGEMENT ====================
router.get('/users', checkRole('admin', 'hr'), getAllUsers);
router.post('/create-user', checkRole('admin'), createUser);
router.put('/update-user/:id', checkRole('admin'), updateUser);
router.delete('/delete-user/:id', checkRole('admin'), deleteUser);
router.put('/toggle-user/:id', checkRole('admin'), toggleUserStatus);
router.put('/deactivate-user/:id', checkRole('admin'), toggleUserStatus);

// ==================== ROLE MANAGEMENT ====================
router.get('/roles', checkRole('admin'), getAllRoles);
router.post('/create-role', checkRole('admin'), createRole);
router.put('/update-role/:id', checkRole('admin'), updateRole);
router.delete('/delete-role/:id', checkRole('admin'), deleteRole);

// ==================== ASSIGN ROLE ====================
router.post('/assign-role', checkRole('admin'), assignRole);

// ==================== PERMISSION MANAGEMENT ====================
router.get('/permissions/:roleId', checkRole('admin'), getRolePermissions);
router.put('/permissions/:roleId', checkRole('admin'), updateRolePermissions);
router.get('/user-permissions/:userId', checkRole('admin'), getUserPermissions);
router.put('/user-permissions/:userId', checkRole('admin'), updateUserPermissions);

// ==================== LOGIN TRACKING ====================
router.get('/users-with-last-login', checkRole('admin'), getUsersWithLastLogin);
router.get('/login-history/:user_id', checkRole('admin'), getUserLoginHistory);
router.get('/login-stats', checkRole('admin'), getLoginStats);
router.get('/recent-logins', checkRole('admin'), getRecentLogins);

module.exports = router;
