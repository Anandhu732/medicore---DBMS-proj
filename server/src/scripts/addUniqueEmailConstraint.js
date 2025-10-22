/**
 * Migration Script: Add UNIQUE constraint to patients.email
 * Run this script to add UNIQUE constraint to the email field in patients table
 */

import { query } from '../config/database.js';

async function addUniqueConstraint() {
  try {
    console.log('🔧 Adding UNIQUE constraint to patients.email...');

    // Check if constraint already exists
    const constraints = await query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'patients'
        AND CONSTRAINT_TYPE = 'UNIQUE'
        AND CONSTRAINT_NAME LIKE '%email%'
    `);

    if (constraints.length > 0) {
      console.log('✅ UNIQUE constraint on email already exists');
      return;
    }

    // Add UNIQUE constraint
    await query('ALTER TABLE patients ADD UNIQUE INDEX `idx_unique_email` (`email`)');

    console.log('✅ Successfully added UNIQUE constraint to patients.email');

  } catch (error) {
    console.error('❌ Failed to add UNIQUE constraint:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      console.error('⚠️  There are duplicate email addresses in the database.');
      console.error('   Please clean up duplicate emails before adding the constraint.');

      // Show duplicate emails
      const duplicates = await query(`
        SELECT email, COUNT(*) as count
        FROM patients
        GROUP BY email
        HAVING count > 1
      `);

      if (duplicates.length > 0) {
        console.log('\n📋 Duplicate emails found:');
        duplicates.forEach(row => {
          console.log(`   ${row.email}: ${row.count} records`);
        });
      }
    }

    throw error;
  }
}

// Run migration
addUniqueConstraint()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });
