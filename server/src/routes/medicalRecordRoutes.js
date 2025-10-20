import express from 'express';
import { body } from 'express-validator';
import {
  getAllMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * Medical Record Routes
 * Base path: /api/medical-records
 */

// @route   GET /api/medical-records
// @desc    Get all medical records with filtering
// @access  Private (Admin, Doctor)
router.get('/', authenticate, authorize('admin', 'doctor'), getAllMedicalRecords);

// @route   GET /api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private (Admin, Doctor)
router.get('/:id', authenticate, authorize('admin', 'doctor'), getMedicalRecordById);

// @route   POST /api/medical-records
// @desc    Create new medical record
// @access  Private (Admin, Doctor)
router.post('/', [
  authenticate,
  authorize('admin', 'doctor'),
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('symptoms').optional().isArray(),
  validate,
], createMedicalRecord);

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private (Admin, Doctor)
router.put('/:id', [
  authenticate,
  authorize('admin', 'doctor'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('updatedBy').trim().notEmpty().withMessage('Updated by is required'),
  validate,
], updateMedicalRecord);

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteMedicalRecord);

export default router;
