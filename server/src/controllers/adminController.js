import { query } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { toCamelCase } from '../utils/datetime.js';

/**
 * Admin Controller
 * Handles all admin dashboard CRUD operations for direct database management
 * Bypasses some business logic validations for administrative purposes
 */

/**
 * Get all records from any table
 * @route GET /api/admin/:table
 */
export const getAllRecords = async (req, res) => {
  try {
    const { table } = req.params;
    const { page = 1, limit = 50, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    // Whitelist allowed tables for security
    const allowedTables = [
      'users',
      'patients',
      'appointments',
      'medical_records',
      'invoices',
      'invoice_items',
      'reports',
    ];

    if (!allowedTables.includes(table)) {
      return errorResponse(res, 'Invalid table name', 400);
    }

    const offset = (page - 1) * limit;

    // Build search condition based on table
    let whereClause = '';
    let params = [];

    if (search) {
      const searchColumns = getSearchColumns(table);
      const searchConditions = searchColumns.map(col => `${col} LIKE ?`).join(' OR ');
      whereClause = `WHERE ${searchConditions}`;
      
      searchColumns.forEach(col => {
        params.push(`%${search}%`);
      });
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // Get records
    const dataQuery = `SELECT * FROM ${table} ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    const records = await query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Transform to camelCase
    const transformedRecords = records.map(record => transformRecord(record, table));

    return paginatedResponse(res, transformedRecords, parseInt(page), parseInt(limit), total);

  } catch (error) {
    console.error('Admin get all records error:', error);
    return errorResponse(res, 'Failed to retrieve records', 500);
  }
};

/**
 * Get single record by ID
 * @route GET /api/admin/:table/:id
 */
export const getRecordById = async (req, res) => {
  try {
    const { table, id } = req.params;

    const allowedTables = [
      'users',
      'patients',
      'appointments',
      'medical_records',
      'invoices',
      'invoice_items',
      'reports',
    ];

    if (!allowedTables.includes(table)) {
      return errorResponse(res, 'Invalid table name', 400);
    }

    const records = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);

    if (records.length === 0) {
      return errorResponse(res, 'Record not found', 404);
    }

    const transformed = transformRecord(records[0], table);
    return successResponse(res, transformed, 'Record retrieved successfully');

  } catch (error) {
    console.error('Admin get record error:', error);
    return errorResponse(res, 'Failed to retrieve record', 500);
  }
};

/**
 * Update record
 * @route PUT /api/admin/:table/:id
 */
export const updateRecord = async (req, res) => {
  try {
    const { table, id } = req.params;
    const updates = req.body;

    const allowedTables = [
      'users',
      'patients',
      'appointments',
      'medical_records',
      'invoices',
      'invoice_items',
      'reports',
    ];

    if (!allowedTables.includes(table)) {
      return errorResponse(res, 'Invalid table name', 400);
    }

    // Check if record exists
    const existing = await query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Record not found', 404);
    }

    // Build update query
    const updateFields = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at') // Don't update these fields
      .map(key => `${toSnakeCase(key)} = ?`)
      .join(', ');

    const updateValues = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => {
        const value = updates[key];
        // Handle JSON fields
        if (table === 'patients' && key === 'medicalHistory') {
          return JSON.stringify(value);
        }
        if (table === 'medical_records' && key === 'symptoms') {
          return JSON.stringify(value);
        }
        return value;
      });

    await query(
      `UPDATE ${table} SET ${updateFields} WHERE id = ?`,
      [...updateValues, id]
    );

    // Fetch updated record
    const updated = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    const transformed = transformRecord(updated[0], table);

    return successResponse(res, transformed, 'Record updated successfully');

  } catch (error) {
    console.error('Admin update record error:', error);
    return errorResponse(res, 'Failed to update record', 500);
  }
};

/**
 * Delete record
 * @route DELETE /api/admin/:table/:id
 */
export const deleteRecord = async (req, res) => {
  try {
    const { table, id } = req.params;

    const allowedTables = [
      'users',
      'patients',
      'appointments',
      'medical_records',
      'invoices',
      'invoice_items',
      'reports',
    ];

    if (!allowedTables.includes(table)) {
      return errorResponse(res, 'Invalid table name', 400);
    }

    // Check if record exists
    const existing = await query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Record not found', 404);
    }

    await query(`DELETE FROM ${table} WHERE id = ?`, [id]);

    return successResponse(res, null, 'Record deleted successfully');

  } catch (error) {
    console.error('Admin delete record error:', error);
    return errorResponse(res, 'Failed to delete record', 500);
  }
};

/**
 * Helper: Get searchable columns for a table
 */
function getSearchColumns(table) {
  const searchMap = {
    users: ['name', 'email', 'role'],
    patients: ['name', 'email', 'phone', 'id'],
    appointments: ['patient_id', 'doctor_id', 'reason'],
    medical_records: ['patient_id', 'doctor_id', 'diagnosis'],
    invoices: ['patient_id', 'id', 'status'],
    invoice_items: ['description', 'category'],
    reports: ['report_type', 'generated_by'],
  };

  return searchMap[table] || ['id'];
}

/**
 * Helper: Transform database record to frontend format
 */
function transformRecord(record, table) {
  const transformed = toCamelCase(record);

  // Handle JSON fields
  if (table === 'patients' && record.medical_history) {
    transformed.medicalHistory = JSON.parse(record.medical_history);
    delete transformed.medical_history;
  }

  if (table === 'medical_records' && record.symptoms) {
    transformed.symptoms = JSON.parse(record.symptoms);
    delete transformed.symptoms;
  }

  return transformed;
}

/**
 * Helper: Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default {
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
