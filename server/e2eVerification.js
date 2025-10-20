import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_URL = 'http://localhost:5000/admin';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicore_db',
};

// Test data
const testData = {
  patient: {
    id: 'P999',
    name: 'Test User AutoVerify',
    age: 30,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+1-555-9999',
    email: 'testuser@verify.com',
    address: '123 Test Street, Test City, TS 12345',
    emergencyContact: '+1-555-8888 (Emergency Contact)',
    medicalHistory: ['Routine Checkup'],
    status: 'Active',
    registrationDate: new Date().toISOString().split('T')[0],
  },
  appointment: {
    id: 'A999',
    patientId: 'P999',
    doctorId: 'D001',
    department: 'General Medicine',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 30,
    status: 'Scheduled',
    reason: 'Auto-verification test appointment',
    notes: 'This is a test appointment for E2E verification',
  },
  invoice: {
    id: 'INV999',
    patientId: 'P999',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: 250.00,
    paidAmount: 0.00,
    status: 'pending',
    items: [
      {
        id: 'ITEM999-1',
        description: 'Test Consultation',
        category: 'Consultation',
        quantity: 1,
        price: 150.00,
        total: 150.00,
      },
      {
        id: 'ITEM999-2',
        description: 'Test Lab Work',
        category: 'Lab Test',
        quantity: 2,
        price: 50.00,
        total: 100.00,
      },
    ],
  },
  medicalRecord: {
    id: 'MR999',
    patientId: 'P999',
    doctorId: 'D001',
    date: new Date().toISOString().split('T')[0],
    diagnosis: 'Auto-verification test diagnosis',
    symptoms: ['Test symptom 1', 'Test symptom 2'],
    notes: 'This is a test medical record for E2E verification',
    prescriptions: [
      {
        id: 'RX999-1',
        medication: 'Test Medication',
        dosage: '10mg',
        frequency: 'Twice daily',
        duration: '7 days',
        instructions: 'Take with food',
      },
    ],
    version: 1,
    updatedBy: 'D001',
  },
};

const results = {
  patient: { api: false, database: false, admin: false, errors: [] },
  appointment: { api: false, database: false, admin: false, errors: [] },
  invoice: { api: false, database: false, admin: false, errors: [] },
  medicalRecord: { api: false, database: false, admin: false, errors: [] },
};

let dbConnection;
let authToken;

// Utility functions
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function logStep(step, status, message = '') {
  const statusIcon = status ? '✅' : '❌';
  console.log(`${statusIcon} ${step}${message ? ': ' + message : ''}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Authentication
async function authenticate() {
  try {
    logSection('AUTHENTICATION');

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@medicore.com',
        password: 'admin123',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      logStep('Login', true, 'Authentication successful');
      return true;
    } else {
      logStep('Login', false, `Status ${response.status}`);
      return false;
    }
  } catch (error) {
    logStep('Login', false, error.message);
    return false;
  }
}

// Database connection
async function connectDatabase() {
  try {
    logSection('DATABASE CONNECTION');
    dbConnection = await mysql.createConnection(dbConfig);
    logStep('Database Connection', true, `Connected to ${dbConfig.database}`);
    return true;
  } catch (error) {
    logStep('Database Connection', false, error.message);
    return false;
  }
}

// Test Patient Flow
async function testPatientFlow() {
  logSection('PATIENT VERIFICATION');

  try {
    // Step 1: API Call
    console.log('Step 1: Creating patient via API...');
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(testData.patient),
    });

    if (response.ok) {
      results.patient.api = true;
      logStep('API POST /patients', true, `Status ${response.status}`);
    } else {
      const error = await response.text();
      results.patient.errors.push(`API Error: ${response.status} - ${error}`);
      logStep('API POST /patients', false, `Status ${response.status}`);
    }

    await delay(500);

    // Step 2: Database Verification
    console.log('\nStep 2: Verifying in database...');
    const [rows] = await dbConnection.query(
      'SELECT * FROM patients WHERE id = ?',
      [testData.patient.id]
    );

    if (rows.length > 0) {
      results.patient.database = true;
      logStep('Database Record', true, `Found patient: ${rows[0].name}`);
      console.log('   Data:', JSON.stringify(rows[0], null, 2).substring(0, 200) + '...');
    } else {
      results.patient.errors.push('Patient not found in database');
      logStep('Database Record', false, 'Patient not found');
    }

    await delay(500);

    // Step 3: Admin API Verification
    console.log('\nStep 3: Verifying in Admin API response...');
    const adminResponse = await fetch(`${API_BASE_URL}/patients/${testData.patient.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (adminResponse.ok) {
      const patientData = await adminResponse.json();
      if (patientData.id === testData.patient.id) {
        results.patient.admin = true;
        logStep('Admin API GET', true, `Patient found: ${patientData.name}`);
      } else {
        results.patient.errors.push('Patient ID mismatch in admin response');
        logStep('Admin API GET', false, 'ID mismatch');
      }
    } else {
      results.patient.errors.push(`Admin API Error: ${adminResponse.status}`);
      logStep('Admin API GET', false, `Status ${adminResponse.status}`);
    }

  } catch (error) {
    results.patient.errors.push(`Exception: ${error.message}`);
    logStep('Patient Flow', false, error.message);
  }
}

// Test Appointment Flow
async function testAppointmentFlow() {
  logSection('APPOINTMENT VERIFICATION');

  try {
    // Step 1: API Call
    console.log('Step 1: Creating appointment via API...');
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(testData.appointment),
    });

    if (response.ok) {
      results.appointment.api = true;
      logStep('API POST /appointments', true, `Status ${response.status}`);
    } else {
      const error = await response.text();
      results.appointment.errors.push(`API Error: ${response.status} - ${error}`);
      logStep('API POST /appointments', false, `Status ${response.status}`);
    }

    await delay(500);

    // Step 2: Database Verification
    console.log('\nStep 2: Verifying in database...');
    const [rows] = await dbConnection.query(
      'SELECT * FROM appointments WHERE id = ?',
      [testData.appointment.id]
    );

    if (rows.length > 0) {
      results.appointment.database = true;
      logStep('Database Record', true, `Found appointment on ${rows[0].date}`);
      console.log('   Data:', JSON.stringify(rows[0], null, 2).substring(0, 200) + '...');
    } else {
      results.appointment.errors.push('Appointment not found in database');
      logStep('Database Record', false, 'Appointment not found');
    }

    await delay(500);

    // Step 3: Admin API Verification
    console.log('\nStep 3: Verifying in Admin API response...');
    const adminResponse = await fetch(`${API_BASE_URL}/appointments?patientId=${testData.appointment.patientId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (adminResponse.ok) {
      const appointments = await adminResponse.json();
      const found = appointments.find(a => a.id === testData.appointment.id);
      if (found) {
        results.appointment.admin = true;
        logStep('Admin API GET', true, `Appointment found in list`);
      } else {
        results.appointment.errors.push('Appointment not in admin response');
        logStep('Admin API GET', false, 'Not in response list');
      }
    } else {
      results.appointment.errors.push(`Admin API Error: ${adminResponse.status}`);
      logStep('Admin API GET', false, `Status ${adminResponse.status}`);
    }

  } catch (error) {
    results.appointment.errors.push(`Exception: ${error.message}`);
    logStep('Appointment Flow', false, error.message);
  }
}

// Test Invoice Flow
async function testInvoiceFlow() {
  logSection('INVOICE VERIFICATION');

  try {
    // Step 1: API Call - Create Invoice
    console.log('Step 1: Creating invoice via API...');
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(testData.invoice),
    });

    if (response.ok) {
      results.invoice.api = true;
      logStep('API POST /invoices', true, `Status ${response.status}`);
    } else {
      const error = await response.text();
      results.invoice.errors.push(`API Error: ${response.status} - ${error}`);
      logStep('API POST /invoices', false, `Status ${response.status}`);
    }

    await delay(500);

    // Step 2: Database Verification
    console.log('\nStep 2: Verifying in database...');
    const [invoiceRows] = await dbConnection.query(
      'SELECT * FROM invoices WHERE id = ?',
      [testData.invoice.id]
    );

    if (invoiceRows.length > 0) {
      // Check invoice items
      const [itemRows] = await dbConnection.query(
        'SELECT * FROM invoice_items WHERE invoice_id = ?',
        [testData.invoice.id]
      );

      if (itemRows.length === testData.invoice.items.length) {
        results.invoice.database = true;
        logStep('Database Record', true, `Invoice + ${itemRows.length} items found`);
        console.log('   Invoice:', JSON.stringify(invoiceRows[0], null, 2).substring(0, 200) + '...');
      } else {
        results.invoice.errors.push(`Item count mismatch: expected ${testData.invoice.items.length}, got ${itemRows.length}`);
        logStep('Database Record', false, 'Item count mismatch');
      }
    } else {
      results.invoice.errors.push('Invoice not found in database');
      logStep('Database Record', false, 'Invoice not found');
    }

    await delay(500);

    // Step 3: Admin API Verification
    console.log('\nStep 3: Verifying in Admin API response...');
    const adminResponse = await fetch(`${API_BASE_URL}/invoices/${testData.invoice.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (adminResponse.ok) {
      const invoiceData = await adminResponse.json();
      if (invoiceData.id === testData.invoice.id && invoiceData.items && invoiceData.items.length > 0) {
        results.invoice.admin = true;
        logStep('Admin API GET', true, `Invoice with ${invoiceData.items.length} items`);
      } else {
        results.invoice.errors.push('Invoice structure incomplete in admin response');
        logStep('Admin API GET', false, 'Incomplete structure');
      }
    } else {
      results.invoice.errors.push(`Admin API Error: ${adminResponse.status}`);
      logStep('Admin API GET', false, `Status ${adminResponse.status}`);
    }

  } catch (error) {
    results.invoice.errors.push(`Exception: ${error.message}`);
    logStep('Invoice Flow', false, error.message);
  }
}

// Test Medical Record Flow
async function testMedicalRecordFlow() {
  logSection('MEDICAL RECORD VERIFICATION');

  try {
    // Step 1: API Call
    console.log('Step 1: Creating medical record via API...');
    const response = await fetch(`${API_BASE_URL}/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(testData.medicalRecord),
    });

    if (response.ok) {
      results.medicalRecord.api = true;
      logStep('API POST /medical-records', true, `Status ${response.status}`);
    } else {
      const error = await response.text();
      results.medicalRecord.errors.push(`API Error: ${response.status} - ${error}`);
      logStep('API POST /medical-records', false, `Status ${response.status}`);
    }

    await delay(500);

    // Step 2: Database Verification
    console.log('\nStep 2: Verifying in database...');
    const [recordRows] = await dbConnection.query(
      'SELECT * FROM medical_records WHERE id = ?',
      [testData.medicalRecord.id]
    );

    if (recordRows.length > 0) {
      // Check prescriptions
      const [prescriptionRows] = await dbConnection.query(
        'SELECT * FROM medical_record_prescriptions WHERE medical_record_id = ?',
        [testData.medicalRecord.id]
      );

      if (prescriptionRows.length > 0) {
        results.medicalRecord.database = true;
        logStep('Database Record', true, `Record + ${prescriptionRows.length} prescriptions found`);
        console.log('   Record:', JSON.stringify(recordRows[0], null, 2).substring(0, 200) + '...');
      } else {
        results.medicalRecord.errors.push('Prescriptions not found');
        logStep('Database Record', false, 'Missing prescriptions');
      }
    } else {
      results.medicalRecord.errors.push('Medical record not found in database');
      logStep('Database Record', false, 'Record not found');
    }

    await delay(500);

    // Step 3: Admin API Verification
    console.log('\nStep 3: Verifying in Admin API response...');
    const adminResponse = await fetch(`${API_BASE_URL}/medical-records?patientId=${testData.medicalRecord.patientId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (adminResponse.ok) {
      const records = await adminResponse.json();
      const found = records.find(r => r.id === testData.medicalRecord.id);
      if (found && found.prescriptions) {
        results.medicalRecord.admin = true;
        logStep('Admin API GET', true, `Record found with prescriptions`);
      } else {
        results.medicalRecord.errors.push('Record not in admin response or missing data');
        logStep('Admin API GET', false, 'Not in response or incomplete');
      }
    } else {
      results.medicalRecord.errors.push(`Admin API Error: ${adminResponse.status}`);
      logStep('Admin API GET', false, `Status ${adminResponse.status}`);
    }

  } catch (error) {
    results.medicalRecord.errors.push(`Exception: ${error.message}`);
    logStep('Medical Record Flow', false, error.message);
  }
}

// Cleanup test data
async function cleanupTestData() {
  logSection('CLEANUP');

  try {
    console.log('Removing test data from database...\n');

    await dbConnection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [testData.invoice.id]);
    await dbConnection.query('DELETE FROM invoices WHERE id = ?', [testData.invoice.id]);
    logStep('Invoices cleaned', true);

    await dbConnection.query('DELETE FROM medical_record_prescriptions WHERE medical_record_id = ?', [testData.medicalRecord.id]);
    await dbConnection.query('DELETE FROM medical_records WHERE id = ?', [testData.medicalRecord.id]);
    logStep('Medical records cleaned', true);

    await dbConnection.query('DELETE FROM appointments WHERE id = ?', [testData.appointment.id]);
    logStep('Appointments cleaned', true);

    await dbConnection.query('DELETE FROM patients WHERE id = ?', [testData.patient.id]);
    logStep('Patients cleaned', true);

    console.log('\n✅ Test data cleanup completed');
  } catch (error) {
    console.log('\n⚠️  Cleanup error:', error.message);
  }
}

// Generate final report
function generateReport() {
  logSection('VERIFICATION REPORT');

  const reportData = [];

  Object.keys(results).forEach(entity => {
    const r = results[entity];
    const status = r.api && r.database && r.admin ? '✅ PASS' : '❌ FAIL';

    reportData.push({
      Entity: entity.toUpperCase(),
      'API Success': r.api ? '✅' : '❌',
      'In Database': r.database ? '✅' : '❌',
      'In Admin API': r.admin ? '✅' : '❌',
      'Status': status,
      'Errors': r.errors.length > 0 ? r.errors.join('; ') : 'None',
    });
  });

  console.table(reportData);

  // Summary
  const totalTests = Object.keys(results).length * 3; // 3 checks per entity
  const passedTests = Object.values(results).reduce((sum, r) => {
    return sum + (r.api ? 1 : 0) + (r.database ? 1 : 0) + (r.admin ? 1 : 0);
  }, 0);

  console.log('\n[SUMMARY] SUMMARY:');
  console.log(`   Total Checks: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Detailed JSON output
  console.log('\n[REPORT] DETAILED JSON REPORT:\n');
  console.log(JSON.stringify(results, null, 2));

  return passedTests === totalTests;
}

// Main execution
async function main() {
  console.log('\n' + '╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  END-TO-END VERIFICATION TEST'.padEnd(58) + '║');
  console.log('║' + '  MediCore Hospital Management System'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝\n');

  console.log('[OBJECTIVES] Test Objectives:');
  console.log('   1. Create test data via API endpoints');
  console.log('   2. Verify data exists in MySQL database');
  console.log('   3. Verify data appears in Admin API responses');
  console.log('   4. Generate comprehensive verification report\n');

  try {
    // Prerequisites
    const authenticated = await authenticate();
    if (!authenticated) {
      console.log('\n❌ Authentication failed. Make sure the backend server is running.');
      console.log('   Start server: cd server && npm run dev\n');
      return;
    }

    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.log('\n❌ Database connection failed. Check your MySQL configuration.\n');
      return;
    }

    // Run tests
    await testPatientFlow();
    await testAppointmentFlow();
    await testInvoiceFlow();
    await testMedicalRecordFlow();

    // Cleanup
    await cleanupTestData();

    // Generate report
    const allPassed = generateReport();

    if (allPassed) {
      console.log('\n🎉 ALL VERIFICATIONS PASSED!');
      console.log('   The complete data flow is working correctly:\n');
      console.log('   Frontend → Backend API → Database → Admin Dashboard ✅\n');
    } else {
      console.log('\n⚠️  SOME VERIFICATIONS FAILED');
      console.log('   Please review the errors above and check:\n');
      console.log('   - Backend server is running (npm run dev)');
      console.log('   - Database schema is initialized');
      console.log('   - API endpoints are correctly implemented\n');
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (dbConnection) {
      await dbConnection.end();
      console.log('[CLOSE] Database connection closed\n');
    }
  }
}

// Run the verification
main();
