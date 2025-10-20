import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

/**
 * Seed database with initial data (matching frontend mock data)
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('[CLEAR] Clearing existing data...');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('TRUNCATE TABLE invoice_items');
    await query('TRUNCATE TABLE invoices');
    await query('TRUNCATE TABLE medical_record_attachments');
    await query('TRUNCATE TABLE medical_record_lab_results');
    await query('TRUNCATE TABLE medical_record_prescriptions');
    await query('TRUNCATE TABLE medical_records');
    await query('TRUNCATE TABLE appointments');
    await query('TRUNCATE TABLE patients');
    await query('TRUNCATE TABLE users');
    await query('TRUNCATE TABLE reports');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared\n');

    // Seed Users (matching frontend mockUsers)
    console.log('[USERS] Seeding users...');
    const hashedPassword = await bcrypt.hash('password', 10);

    const users = [
      ['1', 'Dr. Sarah Johnson', 'sarah.johnson@medicore.com', hashedPassword, 'doctor', 'Cardiology'],
      ['2', 'Dr. Michael Chen', 'michael.chen@medicore.com', hashedPassword, 'doctor', 'Neurology'],
      ['3', 'Emily Davis', 'emily.davis@medicore.com', hashedPassword, 'receptionist', null],
      ['4', 'Admin User', 'admin@medicore.com', hashedPassword, 'admin', null],
    ];

    for (const user of users) {
      await query(
        'INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
        user
      );
    }
    console.log(`✅ ${users.length} users created\n`);

    // Seed Patients (matching frontend mockPatients)
    console.log('🏥 Seeding patients...');
    const patients = [
      ['P001', 'John Smith', 45, 'Male', 'O+', '+1-555-0101', 'john.smith@email.com',
       '123 Main St, New York, NY 10001', '+1-555-0102 (Jane Smith)',
       JSON.stringify(['Hypertension', 'Type 2 Diabetes']), 'Active', '2024-01-15'],
      ['P002', 'Maria Garcia', 32, 'Female', 'A+', '+1-555-0201', 'maria.garcia@email.com',
       '456 Oak Ave, Los Angeles, CA 90001', '+1-555-0202 (Carlos Garcia)',
       JSON.stringify(['Asthma']), 'Active', '2024-02-20'],
      ['P003', 'Robert Johnson', 58, 'Male', 'B+', '+1-555-0301', 'robert.j@email.com',
       '789 Pine Rd, Chicago, IL 60601', '+1-555-0302 (Lisa Johnson)',
       JSON.stringify(['Heart Disease', 'High Cholesterol']), 'Active', '2023-11-10'],
      ['P004', 'Emily Williams', 28, 'Female', 'AB+', '+1-555-0401', 'emily.w@email.com',
       '321 Elm St, Houston, TX 77001', '+1-555-0402 (David Williams)',
       JSON.stringify([]), 'Active', '2024-03-05'],
      ['P005', 'James Brown', 65, 'Male', 'O-', '+1-555-0501', 'james.brown@email.com',
       '654 Maple Dr, Phoenix, AZ 85001', '+1-555-0502 (Mary Brown)',
       JSON.stringify(['Arthritis', 'Hypertension']), 'Archived', '2023-08-22'],
    ];

    for (const patient of patients) {
      await query(
        `INSERT INTO patients (id, name, age, gender, blood_group, phone, email, address,
         emergency_contact, medical_history, status, registration_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        patient
      );
    }
    console.log(`✅ ${patients.length} patients created\n`);

    // Seed Appointments (matching frontend mockAppointments)
    console.log('[APPOINTMENTS] Seeding appointments...');
    const appointments = [
      ['A001', 'P001', '1', 'Cardiology', '2025-10-20', '09:00:00', 30, 'Scheduled', 'Routine checkup', null],
      ['A002', 'P002', '2', 'Neurology', '2025-10-20', '10:30:00', 45, 'Scheduled', 'Headache consultation', null],
      ['A003', 'P003', '1', 'Cardiology', '2025-10-19', '14:00:00', 30, 'Completed', 'Follow-up appointment', 'Patient condition improving'],
      ['A004', 'P004', '2', 'Neurology', '2025-10-21', '11:00:00', 30, 'Scheduled', 'Initial consultation', null],
      ['A005', 'P001', '1', 'Cardiology', '2025-10-18', '15:30:00', 30, 'Cancelled', 'Routine checkup', 'Patient requested rescheduling'],
    ];

    for (const appointment of appointments) {
      await query(
        `INSERT INTO appointments (id, patient_id, doctor_id, department, date, time, duration, status, reason, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        appointment
      );
    }
    console.log(`✅ ${appointments.length} appointments created\n`);

    // Seed Medical Records
    console.log('[RECORDS] Seeding medical records...');
    await query(
      `INSERT INTO medical_records (id, patient_id, doctor_id, date, diagnosis, symptoms, notes, version, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['MR001', 'P001', '1', '2025-10-19', 'Hypertension - Well Controlled',
       JSON.stringify(['High blood pressure', 'Occasional headaches']),
       'Patient responding well to current medication. Continue monitoring blood sugar levels.',
       1, '1'] // <-- Use user ID, not name
    );
    
    await query(
      `INSERT INTO medical_records (id, patient_id, doctor_id, date, diagnosis, symptoms, notes, version, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['MR002', 'P002', '2', '2025-10-15', 'Migraine',
       JSON.stringify(['Severe headache', 'Sensitivity to light', 'Nausea']),
       'Prescribed medication for migraine management. Follow-up in 2 weeks.',
       1, '2'] // <-- Use user ID, not name
    );
    
    console.log('✅ Medical records created\n');

    // Seed Prescriptions
    console.log('💊 Seeding prescriptions...');
    const prescriptions = [
      ['RX001', 'MR001', 'Lisinopril', '10mg', 'Once daily', '30 days', 'Take in the morning with water'],
      ['RX002', 'MR001', 'Aspirin', '81mg', 'Once daily', '30 days', 'Take with food'],
      ['RX003', 'MR002', 'Sumatriptan', '50mg', 'As needed', '30 days', 'Take at onset of migraine'],
    ];

    for (const prescription of prescriptions) {
      await query(
        `INSERT INTO medical_record_prescriptions (id, medical_record_id, medication, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        prescription
      );
    }
    console.log(`✅ ${prescriptions.length} prescriptions created\n`);

    // Seed Lab Results
    console.log('🧪 Seeding lab results...');
    const labResults = [
      ['LAB001', 'MR001', 'Blood Pressure', '130/85', 'mmHg', '120/80', 'Normal'],
      ['LAB002', 'MR001', 'Blood Sugar', '110', 'mg/dL', '70-100', 'Abnormal'],
    ];

    for (const labResult of labResults) {
      await query(
        `INSERT INTO medical_record_lab_results (id, medical_record_id, test_name, value, unit, normal_range, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        labResult
      );
    }
    console.log(`✅ ${labResults.length} lab results created\n`);

    // Seed Attachments
    console.log('[ATTACHMENTS] Seeding attachments...');
    await query(
      `INSERT INTO medical_record_attachments (id, medical_record_id, name, type, size, url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['ATT001', 'MR001', 'ECG_Report.pdf', 'application/pdf', 245000, '/attachments/ecg_report.pdf']
    );
    console.log('✅ Attachments created\n');

    // Seed Invoices
    console.log('💰 Seeding invoices...');
    const invoices = [
      ['INV001', 'P001', '2025-10-19', '2025-11-03', 330.00, 330.00, 'paid', 'Credit Card', '2025-10-19'],
      ['INV002', 'P002', '2025-10-15', '2025-10-30', 165.00, 0.00, 'pending', null, null],
      ['INV003', 'P003', '2025-09-20', '2025-10-05', 440.00, 0.00, 'overdue', null, null],
    ];

    for (const invoice of invoices) {
      await query(
        `INSERT INTO invoices (id, patient_id, date, due_date, total_amount, paid_amount, status, payment_method, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        invoice
      );
    }
    console.log(`✅ ${invoices.length} invoices created\n`);

    // Seed Invoice Items
    console.log('[ITEMS] Seeding invoice items...');
    const invoiceItems = [
      ['ITEM001', 'INV001', 'Consultation - Cardiology', 'Consultation', 1, 150.00, 150.00],
      ['ITEM002', 'INV001', 'ECG Test', 'Diagnostic', 1, 100.00, 100.00],
      ['ITEM003', 'INV001', 'Blood Test', 'Laboratory', 1, 50.00, 50.00],
      ['ITEM004', 'INV002', 'Consultation - Neurology', 'Consultation', 1, 150.00, 150.00],
      ['ITEM005', 'INV003', 'Consultation - Cardiology', 'Consultation', 1, 150.00, 150.00],
      ['ITEM006', 'INV003', 'Stress Test', 'Diagnostic', 1, 250.00, 250.00],
    ];

    for (const item of invoiceItems) {
      await query(
        `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, price, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        item
      );
    }
    console.log(`✅ ${invoiceItems.length} invoice items created\n`);

    console.log('✨ Database seeding completed successfully!\n');
    console.log('[SUMMARY] Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Appointments: ${appointments.length}`);
    console.log(`   - Medical Records: 2`);
    console.log(`   - Prescriptions: ${prescriptions.length}`);
    console.log(`   - Lab Results: ${labResults.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    console.log(`   - Invoice Items: ${invoiceItems.length}\n`);

    console.log('💡 Demo Credentials:');
    console.log('   - Admin: admin@medicore.com / password');
    console.log('   - Doctor: sarah.johnson@medicore.com / password');
    console.log('   - Receptionist: emily.davis@medicore.com / password\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run seeding
seedDatabase();
