import { query, getConnection } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { toCamelCase } from '../utils/datetime.js';

/**
 * Medical Records Controller
 *
 * TODO: Frontend Integration Points:
 * - GET /api/medical-records - Called from client/src/app/medical-records/page.tsx
 * - GET /api/medical-records/:id - Called when viewing record details
 * - POST /api/medical-records - Called when creating new medical record
 * - PUT /api/medical-records/:id - Called when updating medical record
 */

export const getAllMedicalRecords = async (req, res) => {
  try {
    console.log('=== GET /api/medical-records called ===');
    console.log('User:', req.user);
    console.log('Query params:', req.query);

    const {
      page = 1,
      limit = 50,
      search = '',
      patientId = '',
      doctorId = '',
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(mr.id LIKE ? OR p.name LIKE ? OR u.name LIKE ? OR mr.diagnosis LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (patientId) {
      whereConditions.push('mr.patient_id = ?');
      params.push(patientId);
    }

    if (doctorId) {
      whereConditions.push('mr.doctor_id = ?');
      params.push(doctorId);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM medical_records mr ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const records = await query(
      `SELECT mr.*, p.name as patient_name, u.name as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       ${whereClause}
       ORDER BY mr.date DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const transformedRecords = [];

    for (const record of records) {
      const prescriptions = await query(
        'SELECT * FROM medical_record_prescriptions WHERE medical_record_id = ?',
        [record.id]
      );

      const labResults = await query(
        'SELECT * FROM medical_record_lab_results WHERE medical_record_id = ?',
        [record.id]
      );

      const attachments = await query(
        'SELECT * FROM medical_record_attachments WHERE medical_record_id = ?',
        [record.id]
      );

      const transformed = toCamelCase(record);
      transformed.patientName = record.patient_name;
      transformed.doctorName = record.doctor_name;

      // Safe JSON parsing for symptoms
      try {
        transformed.symptoms = record.symptoms ? JSON.parse(record.symptoms) : [];
      } catch (e) {
        console.warn(`Invalid JSON in symptoms for record ${record.id}:`, record.symptoms);
        // If it's not valid JSON, try to use it as a single string or split by newlines
        if (typeof record.symptoms === 'string') {
          transformed.symptoms = record.symptoms.split('\n').filter(s => s.trim());
        } else {
          transformed.symptoms = [];
        }
      }

      transformed.prescriptions = prescriptions.map(p => toCamelCase(p));
      transformed.labResults = labResults.map(l => toCamelCase(l));
      transformed.attachments = attachments.map(a => toCamelCase(a));

      transformedRecords.push(transformed);
    }

    console.log(`Returning ${transformedRecords.length} medical records`);
    return paginatedResponse(res, transformedRecords, pageNum, limitNum, total);

  } catch (error) {
    console.error('Get medical records error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
    return errorResponse(res, error.message || 'Failed to retrieve medical records', 500);
  }
};

export const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const records = await query(
      `SELECT mr.*, p.name as patient_name, u.name as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return errorResponse(res, 'Medical record not found', 404);
    }

    const record = records[0];

    const prescriptions = await query(
      'SELECT * FROM medical_record_prescriptions WHERE medical_record_id = ?',
      [id]
    );

    const labResults = await query(
      'SELECT * FROM medical_record_lab_results WHERE medical_record_id = ?',
      [id]
    );

    const attachments = await query(
      'SELECT * FROM medical_record_attachments WHERE medical_record_id = ?',
      [id]
    );

    const transformed = toCamelCase(record);
    transformed.patientName = record.patient_name;
    transformed.doctorName = record.doctor_name;

    // Safe JSON parsing for symptoms
    try {
      transformed.symptoms = record.symptoms ? JSON.parse(record.symptoms) : [];
    } catch (e) {
      console.warn(`Invalid JSON in symptoms for record ${record.id}:`, record.symptoms);
      if (typeof record.symptoms === 'string') {
        transformed.symptoms = record.symptoms.split('\n').filter(s => s.trim());
      } else {
        transformed.symptoms = [];
      }
    }

    transformed.prescriptions = prescriptions.map(p => toCamelCase(p));
    transformed.labResults = labResults.map(l => toCamelCase(l));
    transformed.attachments = attachments.map(a => toCamelCase(a));

    return successResponse(res, transformed, 'Medical record retrieved successfully');

  } catch (error) {
    console.error('Get medical record error:', error);
    return errorResponse(res, 'Failed to retrieve medical record', 500);
  }
};

export const createMedicalRecord = async (req, res) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const {
      patientId,
      doctorId,
      date,
      diagnosis,
      symptoms = [],
      notes = '',
      prescriptions = [],
      labResults = [],
    } = req.body;

    // Debug logging
    console.log('=== Creating medical record ===');
    console.log('Received data:', {
      patientId,
      doctorId,
      date,
      diagnosis,
      symptoms,
      notes,
      prescriptions,
      labResults
    });

    const countResult = await connection.query('SELECT COUNT(*) as count FROM medical_records');
    console.log('Count result:', countResult);
    const count = countResult[0][0].count;
    const recordId = `MR${String(count + 1).padStart(3, '0')}`;
    console.log('Generated recordId:', recordId);

    console.log('Inserting medical record with values:', [
      recordId, patientId, doctorId, date, diagnosis,
      JSON.stringify(symptoms), notes, 1, doctorId
    ]);

    await connection.query(
      `INSERT INTO medical_records (id, patient_id, doctor_id, date, diagnosis, symptoms, notes, version, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recordId, patientId, doctorId, date, diagnosis, JSON.stringify(symptoms), notes, 1, doctorId]
    );

    console.log('Medical record inserted successfully');

    // Insert prescriptions (only if they have required fields)
    for (const prescription of prescriptions) {
      // Skip if any required field is missing
      if (!prescription.medication || !prescription.dosage ||
          !prescription.frequency || !prescription.duration) {
        console.log('Skipping invalid prescription:', prescription);
        continue;
      }

      const rxCountResult = await connection.query('SELECT COUNT(*) as count FROM medical_record_prescriptions');
      const rxCount = rxCountResult[0][0].count;
      const rxId = `RX${String(rxCount + 1).padStart(3, '0')}`;

      await connection.query(
        `INSERT INTO medical_record_prescriptions
         (id, medical_record_id, medication, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [rxId, recordId, prescription.medication, prescription.dosage,
         prescription.frequency, prescription.duration, prescription.instructions || '']
      );
    }

    // Insert lab results (only if they have required fields)
    for (const labResult of labResults) {
      // Skip if any required field is missing
      if (!labResult.testName || !labResult.value ||
          !labResult.unit || !labResult.normalRange) {
        console.log('Skipping invalid lab result:', labResult);
        continue;
      }

      const labCountResult = await connection.query('SELECT COUNT(*) as count FROM medical_record_lab_results');
      const labCount = labCountResult[0][0].count;
      const labId = `LAB${String(labCount + 1).padStart(3, '0')}`;

      await connection.query(
        `INSERT INTO medical_record_lab_results
         (id, medical_record_id, test_name, value, unit, normal_range, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [labId, recordId, labResult.testName, labResult.value,
         labResult.unit, labResult.normalRange, labResult.status || 'Normal']
      );
    }

    await connection.commit();

    // Fetch created record
    const records = await query(
      `SELECT mr.*, p.name as patient_name, u.name as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [recordId]
    );

    const record = records[0];
    const createdPrescriptions = await query(
      'SELECT * FROM medical_record_prescriptions WHERE medical_record_id = ?',
      [recordId]
    );
    const createdLabResults = await query(
      'SELECT * FROM medical_record_lab_results WHERE medical_record_id = ?',
      [recordId]
    );

    const transformed = toCamelCase(record);
    transformed.patientName = record.patient_name;
    transformed.doctorName = record.doctor_name;
    transformed.symptoms = symptoms;
    transformed.prescriptions = createdPrescriptions.map(p => toCamelCase(p));
    transformed.labResults = createdLabResults.map(l => toCamelCase(l));
    transformed.attachments = [];

    return successResponse(res, transformed, 'Medical record created successfully', 201);

  } catch (error) {
    await connection.rollback();
    console.error('Create medical record error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    });
    return errorResponse(res, error.sqlMessage || error.message || 'Failed to create medical record', 500);
  } finally {
    connection.release();
  }
};

export const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, symptoms, notes, updatedBy } = req.body;

    const existing = await query('SELECT version FROM medical_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Medical record not found', 404);
    }

    const newVersion = existing[0].version + 1;

    await query(
      `UPDATE medical_records
       SET diagnosis = ?, symptoms = ?, notes = ?, version = ?, updated_by = ?
       WHERE id = ?`,
      [diagnosis, JSON.stringify(symptoms), notes, newVersion, updatedBy, id]
    );

    const records = await query(
      `SELECT mr.*, p.name as patient_name, u.name as doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.id = ?`,
      [id]
    );

    const record = records[0];
    const prescriptions = await query(
      'SELECT * FROM medical_record_prescriptions WHERE medical_record_id = ?',
      [id]
    );
    const labResults = await query(
      'SELECT * FROM medical_record_lab_results WHERE medical_record_id = ?',
      [id]
    );
    const attachments = await query(
      'SELECT * FROM medical_record_attachments WHERE medical_record_id = ?',
      [id]
    );

    const transformed = toCamelCase(record);
    transformed.patientName = record.patient_name;
    transformed.doctorName = record.doctor_name;
    transformed.symptoms = symptoms;
    transformed.prescriptions = prescriptions.map(p => toCamelCase(p));
    transformed.labResults = labResults.map(l => toCamelCase(l));
    transformed.attachments = attachments.map(a => toCamelCase(a));

    return successResponse(res, transformed, 'Medical record updated successfully');

  } catch (error) {
    console.error('Update medical record error:', error);
    return errorResponse(res, 'Failed to update medical record', 500);
  }
};

export const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM medical_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Medical record not found', 404);
    }

    await query('DELETE FROM medical_records WHERE id = ?', [id]);

    return successResponse(res, null, 'Medical record deleted successfully');

  } catch (error) {
    console.error('Delete medical record error:', error);
    return errorResponse(res, 'Failed to delete medical record', 500);
  }
};

export default {
  getAllMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};
