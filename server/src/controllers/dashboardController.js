import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { formatDate } from '../utils/datetime.js';

/**
 * Dashboard Controller
 * Provides statistics and summary data for the dashboard
 *
 * TODO: Frontend Integration Point:
 * - GET /api/dashboard/stats - Called from client/src/app/dashboard/page.tsx on mount
 */

export const getDashboardStats = async (req, res) => {
  try {
    // Get total patients
    const totalPatientsResult = await query(
      'SELECT COUNT(*) as count FROM patients'
    );
    const totalPatients = totalPatientsResult[0].count;

    // Get active patients
    const activePatientsResult = await query(
      `SELECT COUNT(*) as count FROM patients WHERE status = 'Active'`
    );
    const activePatients = activePatientsResult[0].count;

    // Get today's appointments
    const today = formatDate(new Date());
    const todayAppointmentsResult = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE date = ?`,
      [today]
    );
    const todayAppointments = todayAppointmentsResult[0].count;

    // Get pending invoices
    const pendingInvoicesResult = await query(
      `SELECT COUNT(*) as count FROM invoices WHERE status IN ('pending', 'overdue')`
    );
    const pendingInvoices = pendingInvoicesResult[0].count;

    // Get monthly revenue (current month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const monthlyRevenueResult = await query(
      `SELECT SUM(paid_amount) as revenue FROM invoices
       WHERE date >= ? AND status = 'paid'`,
      [formatDate(firstDayOfMonth)]
    );
    const monthlyRevenue = monthlyRevenueResult[0].revenue || 0;

    // Calculate growth percentages (mock for now - would need historical data)
    const patientGrowth = 12.5;
    const appointmentGrowth = 8.3;
    const revenueGrowth = 15.2;

    const stats = {
      totalPatients,
      activePatients,
      todayAppointments,
      pendingInvoices,
      monthlyRevenue: parseFloat(monthlyRevenue),
      patientGrowth,
      appointmentGrowth,
      revenueGrowth,
    };

    return successResponse(res, stats, 'Dashboard statistics retrieved successfully');

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard statistics', 500);
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const recentAppointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    const recentPatients = await query(
      `SELECT * FROM patients
       WHERE status = 'Active'
       ORDER BY created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    return successResponse(res, {
      recentAppointments,
      recentPatients,
    }, 'Recent activity retrieved successfully');

  } catch (error) {
    console.error('Get recent activity error:', error);
    return errorResponse(res, 'Failed to retrieve recent activity', 500);
  }
};

export default {
  getDashboardStats,
  getRecentActivity,
};
