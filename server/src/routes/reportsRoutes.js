import express from 'express';
import {
  getReportsStats,
  getSystemLogs,
} from '../controllers/reportsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Reports Routes
 * Base path: /api/reports
 */

// @route   GET /api/reports/stats
// @desc    Get comprehensive reports statistics
// @access  Private (Admin, Doctor)
router.get('/stats', authenticate, authorize('admin', 'doctor'), getReportsStats);

// @route   GET /api/reports/logs
// @desc    Get system logs
// @access  Private (Admin only)
router.get('/logs', authenticate, authorize('admin'), getSystemLogs);

export default router;
