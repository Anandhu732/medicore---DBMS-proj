import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 */

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (All roles)
router.get('/stats', authenticate, getDashboardStats);

// @route   GET /api/dashboard/recent
// @desc    Get recent activity
// @access  Private (All roles)
router.get('/recent', authenticate, getRecentActivity);

export default router;
