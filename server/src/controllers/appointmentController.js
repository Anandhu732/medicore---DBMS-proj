import { query } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { toCamelCase, formatDate } from '../utils/datetime.js';

/**
 * Appointment Controller
 *
 * TODO: Frontend Integration Points:
 * - GET /api/appointments - Called from client/src/app/appointments/page.tsx
 * - POST /api/appointments - Called from Schedule Appointment modal
 * - PUT /api/appointments/:id - Called from Edit Appointment modal
 * - PATCH /api/appointments/:id/status - Called when changing status (Complete/Cancel)
 * - GET /api/appointments/today - Called from Dashboard for today's appointments
 */

export const getAllAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      date = '',
      doctorId = '',
      patientId = '',
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(a.id LIKE ? OR p.name LIKE ? OR u.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    if (date) {
      whereConditions.push('a.date = ?');
      params.push(date);
    }

    if (doctorId) {
      whereConditions.push('a.doctor_id = ?');
      params.push(doctorId);
    }

    if (patientId) {
      whereConditions.push('a.patient_id = ?');
      params.push(patientId);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM appointments a ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const appointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       ${whereClause}
       ORDER BY a.date DESC, a.time DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const transformed = appointments.map(apt => {
      const data = toCamelCase(apt);
      data.patientName = apt.patient_name;
      data.doctorName = apt.doctor_name;
      return data;
    });

    return paginatedResponse(res, transformed, pageNum, limitNum, total);

  } catch (error) {
    console.error('Get appointments error:', error);
    return errorResponse(res, 'Failed to retrieve appointments', 500);
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    const apt = appointments[0];
    const transformed = toCamelCase(apt);
    transformed.patientName = apt.patient_name;
    transformed.doctorName = apt.doctor_name;

    return successResponse(res, transformed, 'Appointment retrieved successfully');

  } catch (error) {
    console.error('Get appointment error:', error);
    return errorResponse(res, 'Failed to retrieve appointment', 500);
  }
};

export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      date,
      time,
      duration = 30,
      reason,
      notes = '',
    } = req.body;

    // Check for conflicts
    const conflicts = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND date = ? AND status != 'Cancelled'
       AND (
         (time <= ? AND DATE_ADD(time, INTERVAL duration MINUTE) > ?) OR
         (time < DATE_ADD(?, INTERVAL ? MINUTE) AND time >= ?)
       )`,
      [doctorId, date, time, time, time, duration, time]
    );

    if (conflicts.length > 0) {
      return errorResponse(res, 'Time slot conflict detected', 409);
    }

    // Get department from doctor
    const doctors = await query('SELECT department FROM users WHERE id = ?', [doctorId]);
    const department = doctors[0]?.department || 'General';

    const countResult = await query('SELECT COUNT(*) as count FROM appointments');
    const count = countResult[0].count;
    const appointmentId = `A${String(count + 1).padStart(3, '0')}`;

    await query(
      `INSERT INTO appointments (id, patient_id, doctor_id, department, date, time, duration, status, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [appointmentId, patientId, doctorId, department, date, time, duration, 'Scheduled', reason, notes]
    );

    const appointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    const apt = appointments[0];
    const transformed = toCamelCase(apt);
    transformed.patientName = apt.patient_name;
    transformed.doctorName = apt.doctor_name;

    return successResponse(res, transformed, 'Appointment created successfully', 201);

  } catch (error) {
    console.error('Create appointment error:', error);
    return errorResponse(res, 'Failed to create appointment', 500);
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, doctorId, date, time, duration, reason, notes } = req.body;

    const existing = await query('SELECT id FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    await query(
      `UPDATE appointments
       SET patient_id = ?, doctor_id = ?, date = ?, time = ?, duration = ?, reason = ?, notes = ?
       WHERE id = ?`,
      [patientId, doctorId, date, time, duration, reason, notes || '', id]
    );

    const appointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    const apt = appointments[0];
    const transformed = toCamelCase(apt);
    transformed.patientName = apt.patient_name;
    transformed.doctorName = apt.doctor_name;

    return successResponse(res, transformed, 'Appointment updated successfully');

  } catch (error) {
    console.error('Update appointment error:', error);
    return errorResponse(res, 'Failed to update appointment', 500);
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    return successResponse(res, { id, status }, 'Appointment status updated successfully');

  } catch (error) {
    console.error('Update appointment status error:', error);
    return errorResponse(res, 'Failed to update appointment status', 500);
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    await query('DELETE FROM appointments WHERE id = ?', [id]);

    return successResponse(res, null, 'Appointment deleted successfully');

  } catch (error) {
    console.error('Delete appointment error:', error);
    return errorResponse(res, 'Failed to delete appointment', 500);
  }
};

export const getTodayAppointments = async (req, res) => {
  try {
    const today = formatDate(new Date());

    const appointments = await query(
      `SELECT a.*, p.name as patient_name, u.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       WHERE a.date = ?
       ORDER BY a.time ASC`,
      [today]
    );

    const transformed = appointments.map(apt => {
      const data = toCamelCase(apt);
      data.patientName = apt.patient_name;
      data.doctorName = apt.doctor_name;
      return data;
    });

    return successResponse(res, transformed, 'Today\'s appointments retrieved successfully');

  } catch (error) {
    console.error('Get today appointments error:', error);
    return errorResponse(res, 'Failed to retrieve today\'s appointments', 500);
  }
};

export default {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getTodayAppointments,
};
