import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { formatDate } from '../utils/datetime.js';

/**
 * Reports Controller
 * Provides comprehensive analytics and reporting data
 */

export const getReportsStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    // Patient statistics over time
    const patientStats = await query(
      `SELECT
        DATE_FORMAT(registration_date, '%Y-%m') as month,
        COUNT(*) as patients,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_patients
       FROM patients
       GROUP BY DATE_FORMAT(registration_date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );

    // Appointment statistics
    const appointmentStats = await query(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM appointments
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );

    // Revenue and expenses analysis
    const revenueStats = await query(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(total_amount) as total_revenue,
        SUM(paid_amount) as collected_revenue,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as completed_revenue
       FROM invoices
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );

    // Department distribution (based on doctors)
    const departmentDist = await query(
      `SELECT
        department,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'doctor' AND department IS NOT NULL), 2) as percentage
       FROM users
       WHERE role = 'doctor' AND department IS NOT NULL
       GROUP BY department
       ORDER BY count DESC`
    );

    // Overall statistics
    const totalPatients = await query('SELECT COUNT(*) as count FROM patients');
    const totalActivePatients = await query('SELECT COUNT(*) as count FROM patients WHERE status = "Active"');
    const totalDoctors = await query('SELECT COUNT(*) as count FROM users WHERE role = "doctor" AND is_active = TRUE');
    const totalRevenue = await query('SELECT SUM(total_amount) as total FROM invoices');
    const totalPaid = await query('SELECT SUM(paid_amount) as total FROM invoices');

    const monthlyData = [];
    const months = new Set([
      ...patientStats.map(s => s.month),
      ...appointmentStats.map(s => s.month),
      ...revenueStats.map(s => s.month)
    ]);

    for (const month of Array.from(months).sort().reverse().slice(0, 6)) {
      const patStat = patientStats.find(s => s.month === month) || { patients: 0, active_patients: 0 };
      const apptStat = appointmentStats.find(s => s.month === month) || { total_appointments: 0, completed: 0 };
      const revStat = revenueStats.find(s => s.month === month) || { total_revenue: 0, collected_revenue: 0 };

      // Format month name
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(monthNum) - 1];

      monthlyData.push({
        month: monthName,
        patients: parseInt(patStat.patients) || 0,
        appointments: parseInt(apptStat.total_appointments) || 0,
        revenue: parseFloat(revStat.collected_revenue) || 0,
        expenses: Math.round(parseFloat(revStat.collected_revenue) * 0.65) || 0 // Mock: 65% of revenue
      });
    }

    const stats = {
      overview: {
        totalPatients: totalPatients[0].count,
        activePatients: totalActivePatients[0].count,
        totalDoctors: totalDoctors[0].count,
        totalRevenue: parseFloat(totalRevenue[0].total) || 0,
        totalPaid: parseFloat(totalPaid[0].total) || 0,
        systemUptime: 99.9
      },
      monthlyData: monthlyData.reverse(), // Chronological order
      departmentData: departmentDist.map(dept => ({
        name: dept.department || 'General',
        value: parseFloat(dept.percentage) || 0,
        count: dept.count,
        color: getDepartmentColor(dept.department)
      })),
      patientTrend: monthlyData.map(m => ({
        month: m.month,
        patients: m.patients,
        appointments: m.appointments
      })),
      revenueTrend: monthlyData.map(m => ({
        month: m.month,
        revenue: m.revenue,
        expenses: m.expenses
      }))
    };

    return successResponse(res, stats, 'Reports statistics retrieved successfully');

  } catch (error) {
    console.error('Get reports stats error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve reports statistics', 500);
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const logs = await query(
      `SELECT * FROM logs
       ORDER BY created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

      // If logs table is missing or returns undefined, gracefully return empty array
      const logsSafe = Array.isArray(logs) ? logs : [];

      const formattedLogs = logsSafe.map(log => ({
      time: new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      event: log.action,
      user: log.user_id,
      table: log.table_name,
      recordId: log.record_id,
      status: getLogStatus(log.action),
      timestamp: log.created_at
    }));

    return successResponse(res, formattedLogs, 'System logs retrieved successfully');

  } catch (error) {
    console.error('Get system logs error:', error);
    return errorResponse(res, 'Failed to retrieve system logs', 500);
  }
};

// Helper function to assign colors to departments
function getDepartmentColor(department) {
  const colors = {
    'Cardiology': '#3b82f6',
    'Neurology': '#10b981',
    'Orthopedics': '#f59e0b',
    'Pediatrics': '#ef4444',
    'Emergency': '#8b5cf6',
    'General Medicine': '#6366f1',
    'Surgery': '#ec4899',
    'Radiology': '#14b8a6',
    'Oncology': '#f97316'
  };
  return colors[department] || '#9ca3af';
}

// Helper function to determine log status
function getLogStatus(action) {
  const successActions = ['INSERT', 'UPDATE', 'SELECT', 'LOGIN'];
  const warningActions = ['DELETE', 'FAILED_LOGIN'];
  const errorActions = ['ERROR', 'EXCEPTION'];

  if (successActions.some(a => action.includes(a))) return 'success';
  if (warningActions.some(a => action.includes(a))) return 'warning';
  if (errorActions.some(a => action.includes(a))) return 'error';
  return 'info';
}

export default {
  getReportsStats,
  getSystemLogs,
};
