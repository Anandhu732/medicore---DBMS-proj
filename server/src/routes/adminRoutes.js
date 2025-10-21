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
 * ⚠️ SECURITY: Authentication temporarily disabled for development
 * TODO: Re-enable authentication for production
 */

// Get all records from a table (temporarily public for development)
router.get('/:table', getAllRecords);

// Get single record by ID (temporarily public for development)
router.get('/:table/:id', getRecordById);

// Update record (temporarily public for development)
router.put('/:table/:id', updateRecord);

// Delete record (temporarily public for development)
router.delete('/:table/:id', deleteRecord);

export default router;
