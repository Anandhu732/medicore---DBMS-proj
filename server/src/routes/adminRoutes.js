import express from 'express';
import {
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * Admin Routes - Direct database management
 * These routes provide CRUD access to all tables for the admin dashboard
 * 
 * Note: In production, these should be protected with admin-only authentication
 * For MVP, authentication is optional but recommended
 */

// Get all records from a table
router.get('/:table', getAllRecords);

// Get single record by ID
router.get('/:table/:id', getRecordById);

// Update record
router.put('/:table/:id', updateRecord);

// Delete record
router.delete('/:table/:id', deleteRecord);

export default router;
