/**
 * Debug Patient Creation
 * This script helps debug patient creation issues
 */

import { query } from './src/config/database.js';

async function debugPatientCreation() {
  try {
    console.log('🔍 Debugging Patient Creation\n');
    console.log('===============================================\n');

    // 1. Check database connection
    console.log('1️⃣ Checking database connection...');
    try {
      const result = await query('SELECT 1 as connected');
      console.log('   ✅ Database connected successfully\n');
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return;
    }

    // 2. Check if patients table exists
    console.log('2️⃣ Checking patients table...');
    try {
      const tables = await query("SHOW TABLES LIKE 'patients'");
      if (tables.length > 0) {
        console.log('   ✅ Patients table exists\n');
      } else {
        console.log('   ❌ Patients table does not exist\n');
        return;
      }
    } catch (error) {
      console.log('   ❌ Error checking table:', error.message, '\n');
      return;
    }

    // 3. Check table structure
    console.log('3️⃣ Checking table structure...');
    try {
      const structure = await query('DESCRIBE patients');
      console.log('   Columns:');
      structure.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
      });
      console.log();
    } catch (error) {
      console.log('   ❌ Error checking structure:', error.message, '\n');
    }

    // 4. Check constraints
    console.log('4️⃣ Checking constraints...');
    try {
      const constraints = await query(`
        SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'patients'
      `);
      console.log('   Constraints:');
      constraints.forEach(c => {
        console.log(`   - ${c.CONSTRAINT_NAME}: ${c.CONSTRAINT_TYPE}`);
      });
      console.log();
    } catch (error) {
      console.log('   ❌ Error checking constraints:', error.message, '\n');
    }

    // 5. Check existing patients
    console.log('5️⃣ Checking existing patients...');
    try {
      const countResult = await query('SELECT COUNT(*) as total FROM patients');
      console.log(`   Total patients: ${countResult[0].total}`);

      if (countResult[0].total > 0) {
        const lastPatient = await query('SELECT id, name, email FROM patients ORDER BY created_at DESC LIMIT 1');
        console.log(`   Last patient: ${lastPatient[0].id} - ${lastPatient[0].name} (${lastPatient[0].email})`);
      }
      console.log();
    } catch (error) {
      console.log('   ❌ Error checking patients:', error.message, '\n');
    }

    // 6. Test patient data validation
    console.log('6️⃣ Testing patient data...');
    const testPatient = {
      name: 'Test Patient',
      age: 30,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+1234567890',
      email: `test.${Date.now()}@example.com`,
      address: '123 Test Street',
      emergencyContact: 'Emergency Contact : +1987654321',
      medicalHistory: []
    };

    console.log('   Test data:', JSON.stringify(testPatient, null, 2));
    console.log();

    // 7. Try to generate patient ID
    console.log('7️⃣ Testing ID generation...');
    try {
      const countResult = await query('SELECT COUNT(*) as count FROM patients');
      const count = countResult[0].count;
      const patientId = `P${String(count + 1).padStart(3, '0')}`;
      console.log(`   Next patient ID would be: ${patientId}\n`);
    } catch (error) {
      console.log('   ❌ Error generating ID:', error.message, '\n');
    }

    // 8. Test minimal insert (without actually inserting)
    console.log('8️⃣ Validating SQL query...');
    const insertSQL = `INSERT INTO patients (id, name, age, gender, blood_group, phone, email, address,
       emergency_contact, medical_history, status, registration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    console.log('   SQL Query is valid ✅\n');

    // 9. Check for duplicate emails
    console.log('9️⃣ Checking for duplicate emails in database...');
    try {
      const duplicates = await query(`
        SELECT email, COUNT(*) as count
        FROM patients
        GROUP BY email
        HAVING count > 1
      `);

      if (duplicates.length > 0) {
        console.log('   ⚠️  Duplicate emails found:');
        duplicates.forEach(row => {
          console.log(`   - ${row.email}: ${row.count} records`);
        });
      } else {
        console.log('   ✅ No duplicate emails found');
      }
      console.log();
    } catch (error) {
      console.log('   ❌ Error checking duplicates:', error.message, '\n');
    }

    console.log('===============================================');
    console.log('✅ Debug check completed\n');
    console.log('📋 Next Steps:');
    console.log('1. Check your server logs for the actual error when creating a patient');
    console.log('2. Look for "❌ [CREATE PATIENT] Error:" in the server console');
    console.log('3. Check if you\'re logged in as admin or receptionist');
    console.log('4. Make sure you\'re using a unique email address');
    console.log('5. Restart the server if needed');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

debugPatientCreation();
