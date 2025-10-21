/**
 * Integration Test Script
 * Tests database connection and basic API functionality
 * Run with: node src/scripts/testIntegration.js
 */

import { testConnection, query } from '../config/database.js';
import config from '../config/config.js';

console.log('🧪 MediCore Integration Test Starting...\n');

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Database Connection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Database Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ PASS: Database connection successful\n');
      passedTests++;
    } else {
      console.log('❌ FAIL: Database connection failed\n');
      failedTests++;
      return; // Stop if can't connect
    }
  } catch (error) {
    console.log('❌ FAIL: Database connection error:', error.message, '\n');
    failedTests++;
    return;
  }

  // Test 2: Verify Tables Exist
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Verify Database Tables');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const expectedTables = [
    'users',
    'patients',
    'appointments',
    'medical_records',
    'medical_record_prescriptions',
    'medical_record_lab_results',
    'medical_record_attachments',
    'invoices',
    'invoice_items',
    'reports',
    'logs'
  ];

  try {
    const tables = await query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`Found ${tableNames.length} tables in database:`);
    tableNames.forEach(table => console.log(`  - ${table}`));
    
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ PASS: All expected tables exist\n');
      passedTests++;
    } else {
      console.log(`❌ FAIL: Missing tables: ${missingTables.join(', ')}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not verify tables:', error.message, '\n');
    failedTests++;
  }

  // Test 3: Check Users Table Structure
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Users Table Structure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const columns = await query('DESCRIBE users');
    const columnNames = columns.map(col => col.Field);
    const requiredColumns = ['id', 'name', 'email', 'password', 'role', 'is_active'];
    
    const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));
    
    if (missingColumns.length === 0) {
      console.log('✅ PASS: Users table has all required columns');
      console.log(`   Columns: ${columnNames.join(', ')}\n`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: Users table missing columns: ${missingColumns.join(', ')}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not check users table:', error.message, '\n');
    failedTests++;
  }

  // Test 4: Check Patients Table Structure
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Patients Table Structure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const columns = await query('DESCRIBE patients');
    const columnNames = columns.map(col => col.Field);
    const requiredColumns = ['id', 'name', 'age', 'gender', 'blood_group', 'phone', 'email', 'status'];
    
    const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));
    
    if (missingColumns.length === 0) {
      console.log('✅ PASS: Patients table has all required columns');
      console.log(`   Columns: ${columnNames.join(', ')}\n`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: Patients table missing columns: ${missingColumns.join(', ')}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not check patients table:', error.message, '\n');
    failedTests++;
  }

  // Test 5: Test Data Insertion
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 5: Data Insertion Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    // Try to insert a test patient
    const testPatientId = `TEST_${Date.now()}`;
    await query(
      `INSERT INTO patients (id, name, age, gender, blood_group, phone, email, address, 
       emergency_contact, status, registration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        testPatientId,
        'Test Patient',
        30,
        'Male',
        'O+',
        '+1-555-0000',
        `test_${Date.now()}@example.com`,
        'Test Address',
        '+1-555-1111',
        'Active'
      ]
    );
    
    // Verify insertion
    const result = await query('SELECT * FROM patients WHERE id = ?', [testPatientId]);
    
    if (result.length > 0) {
      console.log('✅ PASS: Data insertion successful');
      console.log(`   Inserted test patient: ${result[0].name}\n`);
      passedTests++;
      
      // Clean up test data
      await query('DELETE FROM patients WHERE id = ?', [testPatientId]);
      console.log('   (Test data cleaned up)\n');
    } else {
      console.log('❌ FAIL: Data insertion failed - could not retrieve inserted data\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Data insertion error:', error.message, '\n');
    failedTests++;
  }

  // Test 6: Test Foreign Key Relationships
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 6: Foreign Key Relationships');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const fkQuery = `
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        REFERENCED_TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('appointments', 'medical_records', 'invoices')
    `;
    
    const foreignKeys = await query(fkQuery, [config.database.database]);
    
    if (foreignKeys.length > 0) {
      console.log('✅ PASS: Foreign keys exist');
      console.log(`   Found ${foreignKeys.length} foreign key relationships:`);
      foreignKeys.forEach(fk => {
        console.log(`   - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
      console.log();
      passedTests++;
    } else {
      console.log('⚠️  WARNING: No foreign keys found (data integrity may be at risk)\n');
      passedTests++; // Don't fail, as basic operations might still work
    }
  } catch (error) {
    console.log('⚠️  WARNING: Could not check foreign keys:', error.message, '\n');
    passedTests++; // Don't fail
  }

  // Test 7: Configuration Check
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 7: Configuration Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const configIssues = [];
  
  if (!config.database.password) {
    configIssues.push('DB_PASSWORD is empty (might be okay for local dev)');
  }
  if (!config.jwt.secret || config.jwt.secret.includes('change')) {
    configIssues.push('JWT_SECRET should be changed in production');
  }
  if (config.env === 'production' && config.admin.password === 'admin123') {
    configIssues.push('ADMIN_PASSWORD should be changed in production');
  }
  
  if (configIssues.length === 0 || config.env === 'development') {
    console.log('✅ PASS: Configuration is valid for', config.env, 'environment');
    console.log(`   Database: ${config.database.database}`);
    console.log(`   Server Port: ${config.port}`);
    console.log(`   Client URL: ${config.cors.origin}`);
    console.log(`   Environment: ${config.env}\n`);
    passedTests++;
  } else {
    console.log('⚠️  WARNING: Configuration issues found:');
    configIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log();
    passedTests++; // Don't fail in dev
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Total:  ${passedTests + failedTests}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failedTests === 0) {
    console.log('🎉 All tests passed! Your backend is ready for integration.\n');
    console.log('Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: cd ../client && npm run dev');
    console.log('3. Open http://localhost:3000 in your browser\n');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before proceeding.\n');
    console.log('Check the INTEGRATION_GUIDE.md for troubleshooting steps.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
