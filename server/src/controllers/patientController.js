import { query } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { toCamelCase, getCurrentDateUTC } from '../utils/datetime.js';

/**
 * Patient Controller
 * Handles all patient-related operations
 *
 * TODO: Frontend Integration Points:
 * - GET /api/patients - Called from client/src/app/patients/page.tsx on mount
 * - GET /api/patients/:id - Called when viewing patient details
 * - POST /api/patients - Called from Add Patient modal (handleSubmit)
 * - PUT /api/patients/:id - Called from Edit Patient modal (handleSubmit)
 * - PATCH /api/patients/:id/archive - Called from Archive button (handleArchive)
 * - GET /api/patients/search?q= - Called from search input with debounce
 */

/**
 * Get all patients with filtering and pagination
 * @route GET /api/patients
 * @access Private (All roles)
 */
export const getAllPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      bloodGroup = '',
      sortBy = 'registration_date',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(name LIKE ? OR id LIKE ? OR email LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (bloodGroup) {
      whereConditions.push('blood_group = ?');
      params.push(bloodGroup);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM patients ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get patients
    const limitValue = parseInt(limit);
    const offsetValue = parseInt(offset);
    const patients = await query(
      `SELECT * FROM patients ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ${limitValue} OFFSET ${offsetValue}`,
      params
    );

    // Parse JSON fields and transform to camelCase
    const transformedPatients = patients.map(patient => {
      const transformed = toCamelCase(patient);
      // Handle medical_history - it might be already parsed or a string
      if (patient.medical_history) {
        if (typeof patient.medical_history === 'string') {
          try {
            transformed.medicalHistory = JSON.parse(patient.medical_history);
          } catch (e) {
            transformed.medicalHistory = [];
          }
        } else {
          transformed.medicalHistory = patient.medical_history;
        }
      } else {
        transformed.medicalHistory = [];
      }
      delete transformed.medical_history;
      return transformed;
    });

    return paginatedResponse(res, transformedPatients, parseInt(page), parseInt(limit), total);

  } catch (error) {
    console.error('Get patients error:', error);
    return errorResponse(res, 'Failed to retrieve patients', 500);
  }
};

/**
 * Get patient by ID
 * @route GET /api/patients/:id
 * @access Private (All roles)
 */
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patients = await query(
      'SELECT * FROM patients WHERE id = ?',
      [id]
    );

    if (patients.length === 0) {
      return errorResponse(res, 'Patient not found', 404);
    }

    const patient = patients[0];
    const transformed = toCamelCase(patient);
    transformed.medicalHistory = patient.medical_history
      ? JSON.parse(patient.medical_history)
      : [];
    delete transformed.medical_history;

    return successResponse(res, transformed, 'Patient retrieved successfully');

  } catch (error) {
    console.error('Get patient error:', error);
    return errorResponse(res, 'Failed to retrieve patient', 500);
  }
};

/**
 * Create new patient
 * @route POST /api/patients
 * @access Private (Admin, Receptionist)
 */
export const createPatient = async (req, res) => {
  try {
    // DEBUG: Log incoming request
    console.log('📝 [CREATE PATIENT] Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user?.email, 'Role:', req.user?.role);

    const {
      name,
      age,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      medicalHistory = [],
    } = req.body;

    // DEBUG: Log extracted fields
    console.log('Extracted fields:', {
      name,
      age,
      gender,
      bloodGroup,
      phone,
      email,
      address: address?.substring(0, 50),
      emergencyContact,
      medicalHistoryLength: medicalHistory?.length
    });

    // Check if patient with email already exists
    const existingPatients = await query(
      'SELECT id FROM patients WHERE email = ?',
      [email]
    );

    if (existingPatients.length > 0) {
      console.log('❌ Patient with email already exists:', email);
      return errorResponse(res, 'Patient with this email already exists', 409);
    }

    // Generate patient ID - Get the highest ID number to avoid duplicates
    const maxIdResult = await query(
      `SELECT id FROM patients
       WHERE id REGEXP '^P[0-9]+$'
       ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC
       LIMIT 1`
    );

    let nextNumber = 1;
    if (maxIdResult.length > 0) {
      const lastId = maxIdResult[0].id;
      const lastNumber = parseInt(lastId.substring(1));
      nextNumber = lastNumber + 1;
    }

    const patientId = `P${String(nextNumber).padStart(3, '0')}`;
    console.log('Generated patient ID:', patientId);

    const registrationDate = getCurrentDateUTC();

    // Insert patient
    await query(
      `INSERT INTO patients (id, name, age, gender, blood_group, phone, email, address,
       emergency_contact, medical_history, status, registration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        name,
        age,
        gender,
        bloodGroup,
        phone,
        email,
        address,
        emergencyContact,
        JSON.stringify(medicalHistory),
        'Active',
        registrationDate,
      ]
    );

    console.log('✅ Patient created successfully:', patientId);

    // Fetch created patient
    const patients = await query('SELECT * FROM patients WHERE id = ?', [patientId]);
    const patient = patients[0];
    const transformed = toCamelCase(patient);
    transformed.medicalHistory = medicalHistory;
    delete transformed.medical_history;

    return successResponse(res, transformed, 'Patient created successfully', 201);

  } catch (error) {
    console.error('❌ [CREATE PATIENT] Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    return errorResponse(res, error.sqlMessage || error.message || 'Failed to create patient', 500);
  }
};

/**
 * Update patient
 * @route PUT /api/patients/:id
 * @access Private (Admin, Receptionist)
 */
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      medicalHistory = [],
    } = req.body;

    // Check if patient exists
    const existingPatients = await query(
      'SELECT id FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatients.length === 0) {
      return errorResponse(res, 'Patient not found', 404);
    }

    // Check if email is being changed to an existing email
    const emailCheck = await query(
      'SELECT id FROM patients WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailCheck.length > 0) {
      return errorResponse(res, 'Email already in use by another patient', 409);
    }

    // Update patient
    await query(
      `UPDATE patients
       SET name = ?, age = ?, gender = ?, blood_group = ?, phone = ?,
           email = ?, address = ?, emergency_contact = ?, medical_history = ?
       WHERE id = ?`,
      [
        name,
        age,
        gender,
        bloodGroup,
        phone,
        email,
        address,
        emergencyContact,
        JSON.stringify(medicalHistory),
        id,
      ]
    );

    // Fetch updated patient
    const patients = await query('SELECT * FROM patients WHERE id = ?', [id]);
    const patient = patients[0];
    const transformed = toCamelCase(patient);
    transformed.medicalHistory = medicalHistory;
    delete transformed.medical_history;

    return successResponse(res, transformed, 'Patient updated successfully');

  } catch (error) {
    console.error('Update patient error:', error);
    return errorResponse(res, 'Failed to update patient', 500);
  }
};

/**
 * Archive patient (soft delete)
 * @route PATCH /api/patients/:id/archive
 * @access Private (Admin, Receptionist)
 */
export const archivePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const existingPatients = await query(
      'SELECT id FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatients.length === 0) {
      return errorResponse(res, 'Patient not found', 404);
    }

    // Archive patient
    await query(
      'UPDATE patients SET status = ? WHERE id = ?',
      ['Archived', id]
    );

    return successResponse(res, { id, status: 'Archived' }, 'Patient archived successfully');

  } catch (error) {
    console.error('Archive patient error:', error);
    return errorResponse(res, 'Failed to archive patient', 500);
  }
};

/**
 * Restore archived patient
 * @route PATCH /api/patients/:id/restore
 * @access Private (Admin)
 */
export const restorePatient = async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'UPDATE patients SET status = ? WHERE id = ?',
      ['Active', id]
    );

    return successResponse(res, { id, status: 'Active' }, 'Patient restored successfully');

  } catch (error) {
    console.error('Restore patient error:', error);
    return errorResponse(res, 'Failed to restore patient', 500);
  }
};

/**
 * Delete patient permanently
 * @route DELETE /api/patients/:id
 * @access Private (Admin only)
 */
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const existingPatients = await query(
      'SELECT id FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatients.length === 0) {
      return errorResponse(res, 'Patient not found', 404);
    }

    // Delete patient (CASCADE will delete related records)
    await query('DELETE FROM patients WHERE id = ?', [id]);

    return successResponse(res, null, 'Patient deleted permanently');

  } catch (error) {
    console.error('Delete patient error:', error);
    return errorResponse(res, 'Failed to delete patient', 500);
  }
};

export default {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  archivePatient,
  restorePatient,
  deletePatient,
};
