import express from 'express';
import { body } from 'express-validator';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  updateInvoiceStatus,
  deleteInvoice,
} from '../controllers/billingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * Billing/Invoice Routes
 * Base path: /api/invoices
 */

// @route   GET /api/invoices
// @desc    Get all invoices with filtering
// @access  Private (Admin, Receptionist)
router.get('/', authenticate, authorize('admin', 'receptionist'), getAllInvoices);

// @route   GET /api/invoices/:id
// @desc    Get invoice by ID
// @access  Private (Admin, Receptionist)
router.get('/:id', authenticate, authorize('admin', 'receptionist'), getInvoiceById);

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private (Admin, Receptionist)
router.post('/', [
  authenticate,
  authorize('admin', 'receptionist'),
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('dueDate').isDate().withMessage('Valid due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  validate,
], createInvoice);

// @route   PATCH /api/invoices/:id/payment
// @desc    Record payment for invoice
// @access  Private (Admin, Receptionist)
router.patch('/:id/payment', [
  authenticate,
  authorize('admin', 'receptionist'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('paymentMethod').optional().trim().notEmpty(),
  validate,
], recordPayment);

// @route   PATCH /api/invoices/:id/status
// @desc    Update invoice status
// @access  Private (Admin, Receptionist)
router.patch('/:id/status', [
  authenticate,
  authorize('admin', 'receptionist'),
  body('status').isIn(['paid', 'pending', 'overdue']).withMessage('Invalid status'),
  validate,
], updateInvoiceStatus);

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteInvoice);

export default router;
