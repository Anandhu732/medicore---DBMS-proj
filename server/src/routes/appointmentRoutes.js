import express from 'express';
import { body } from 'express-validator';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getTodayAppointments,
} from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * Appointment Routes
 * Base path: /api/appointments
 */

// @route   GET /api/appointments
// @desc    Get all appointments with filtering
// @access  Private (All roles)
router.get('/', authenticate, getAllAppointments);

// @route   GET /api/appointments/today
// @desc    Get today's appointments
// @access  Private (All roles)
router.get('/today', authenticate, getTodayAppointments);

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private (All roles)
router.get('/:id', authenticate, getAppointmentById);

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (All roles)
router.post('/', [
  authenticate,
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  validate,
], createAppointment);

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (All roles)
router.put('/:id', [
  authenticate,
  body('date').isDate().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  validate,
], updateAppointment);

// @route   PATCH /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (All roles)
router.patch('/:id/status', [
  authenticate,
  body('status').isIn(['Scheduled', 'Completed', 'Cancelled', 'No Show']).withMessage('Invalid status'),
  validate,
], updateAppointmentStatus);

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteAppointment);

export default router;
