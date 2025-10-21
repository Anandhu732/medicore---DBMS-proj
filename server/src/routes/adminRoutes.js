import express from 'express';
import {
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Admin Routes - Direct database management
 * These routes provide CRUD access to all tables for the admin dashboard
 *
 * ⚠️ SECURITY: All routes require admin authentication
 */

// Get all records from a table
router.get('/:table', authenticate, authorize('admin'), getAllRecords);

// Get single record by ID
router.get('/:table/:id', authenticate, authorize('admin'), getRecordById);

// Update record
router.put('/:table/:id', authenticate, authorize('admin'), updateRecord);

// Delete record
router.delete('/:table/:id', authenticate, authorize('admin'), deleteRecord);

export default router;
