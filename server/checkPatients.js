/**
 * Check current patients in database
 */

import { query } from './src/config/database.js';

async function checkPatients() {
  try {
    console.log('📋 Current Patients in Database:\n');

    const patients = await query(`
      SELECT id, name, email, registration_date, status
      FROM patients
      ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) ASC
    `);

    if (patients.length === 0) {
      console.log('No patients found.');
    } else {
      console.log(`Total: ${patients.length} patients\n`);
      patients.forEach(p => {
        console.log(`${p.id} | ${p.name.padEnd(25)} | ${p.email.padEnd(30)} | ${p.status}`);
      });
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPatients();
