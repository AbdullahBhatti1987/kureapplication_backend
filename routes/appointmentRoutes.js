const express = require('express');
const router = express.Router();
// const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { testAppointments, createAppointment, getUserAppointments, getProviderAppointments, getAppointmentById, updateAppointmentStatus, cancelAppointment } = require("../controllers/appointmentController");

// All routes require authentication
router.use(protect);

// Test route for debugging
router.get('/test', testAppointments);

// Create new appointment (users only)
router.post('/', createAppointment);

// Get user appointments (users can see their own appointments)
router.get('/user', getUserAppointments);

// Get provider appointments (providers can see appointments assigned to them)
router.get('/provider', getProviderAppointments);

// Get single appointment (users and providers can see their respective appointments)
router.get('/:id', getAppointmentById);

// Update appointment status (providers only)
router.patch('/:id/status', updateAppointmentStatus);

// Cancel appointment (users can cancel their own appointments)
router.patch('/:id/cancel', cancelAppointment);

module.exports = router; 