import express from 'express';
import { body } from 'express-validator';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  archivePatient,
  restorePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * Patient Routes
 * Base path: /api/patients
 */

// @route   GET /api/patients
// @desc    Get all patients with filtering
// @access  Private (All roles)
router.get('/', authenticate, getAllPatients);

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (All roles)
router.get('/:id', authenticate, getPatientById);

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Admin, Receptionist)
router.post('/', [
  authenticate,
  authorize('admin', 'receptionist'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('bloodGroup').notEmpty().withMessage('Blood group is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('emergencyContact').trim().notEmpty().withMessage('Emergency contact is required'),
  validate,
], createPatient);

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Admin, Receptionist)
router.put('/:id', [
  authenticate,
  authorize('admin', 'receptionist'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  validate,
], updatePatient);

// @route   PATCH /api/patients/:id/archive
// @desc    Archive patient
// @access  Private (Admin, Receptionist)
router.patch('/:id/archive', authenticate, authorize('admin', 'receptionist'), archivePatient);

// @route   PATCH /api/patients/:id/restore
// @desc    Restore archived patient
// @access  Private (Admin)
router.patch('/:id/restore', authenticate, authorize('admin'), restorePatient);

// @route   DELETE /api/patients/:id
// @desc    Delete patient permanently
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deletePatient);

export default router;
