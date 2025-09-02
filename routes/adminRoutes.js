const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  verifyUser,
  blockUser,
  deleteUser,
  getAllProviders,
  getProviderById,
  approveProvider,
  rejectProvider,
  verifyProvider,
  blockProvider,
  deleteProvider,
  getAllServices,
  getServiceById,
  approveService,
  rejectService,
  featureService,
  deleteService,
  getReports
} = require('../controllers/adminController');

// Admin middleware - check if user is admin
const adminAuth = [protect, authorize('admin')];

// Dashboard
router.get('/dashboard', adminAuth, getDashboardStats);

// Users management
router.get('/users', adminAuth, getAllUsers);
router.get('/users/:id', adminAuth, getUserById);
router.put('/users/:id/verify', adminAuth, verifyUser);
router.put('/users/:id/block', adminAuth, blockUser);
router.delete('/users/:id', adminAuth, deleteUser);

// Providers management
router.get('/providers', adminAuth, getAllProviders);
router.get('/providers/:id', adminAuth, getProviderById);
router.put('/providers/:id/approve', adminAuth, approveProvider);
router.put('/providers/:id/reject', adminAuth, rejectProvider);
router.put('/providers/:id/verify', adminAuth, verifyProvider);
router.put('/providers/:id/block', adminAuth, blockProvider);
router.delete('/providers/:id', adminAuth, deleteProvider);

// Services management
router.get('/services', adminAuth, getAllServices);
router.get('/services/:id', adminAuth, getServiceById);
router.put('/services/:id/approve', adminAuth, approveService);
router.put('/services/:id/reject', adminAuth, rejectService);
router.put('/services/:id/feature', adminAuth, featureService);
router.delete('/services/:id', adminAuth, deleteService);

// Reports
router.get('/reports', adminAuth, getReports);

module.exports = router; 