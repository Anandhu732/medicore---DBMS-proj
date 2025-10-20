import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicore_db',
};

const API_URL = 'http://localhost:5000';

async function checkPrerequisites() {
  console.log('\n[PRE-CHECK] Pre-Flight Check for E2E Verification\n');
  console.log('='.repeat(50) + '\n');

  let allGood = true;
  const issues = [];

  // Check 1: MySQL Connection
  console.log('1. Checking MySQL connection...');
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    console.log('   ✅ MySQL is accessible\n');
  } catch (error) {
    console.log('   ❌ MySQL connection failed');
    console.log(`      Error: ${error.message}\n`);
    allGood = false;
    issues.push('MySQL server not accessible. Start MySQL service.');
  }

  // Check 2: Database Exists
  console.log('2. Checking database existence...');
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);

    if (dbExists) {
      console.log(`   ✅ Database '${dbConfig.database}' exists\n`);
    } else {
      console.log(`   ❌ Database '${dbConfig.database}' not found\n`);
      allGood = false;
      issues.push(`Run: node src/scripts/initDatabase.js`);
    }

    await connection.end();
  } catch (error) {
    console.log(`   ❌ Cannot check databases: ${error.message}\n`);
    allGood = false;
  }

  // Check 3: Required Tables
  console.log('3. Checking required tables...');
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [tables] = await connection.query('SHOW TABLES');

    const requiredTables = ['users', 'patients', 'appointments', 'invoices', 'medical_records'];
    const existingTables = tables.map(t => Object.values(t)[0]);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log(`   ✅ All required tables exist (${existingTables.length} total)\n`);
    } else {
      console.log(`   ❌ Missing tables: ${missingTables.join(', ')}\n`);
      allGood = false;
      issues.push('Run: node src/scripts/initDatabase.js');
    }

    await connection.end();
  } catch (error) {
    console.log(`   ⚠️  Cannot check tables: ${error.message}\n`);
  }

  // Check 4: Backend Server
  console.log('4. Checking backend server...');
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      timeout: 3000
    }).catch(() => null);

    if (response && response.ok) {
      console.log(`   ✅ Backend server is running on ${API_URL}\n`);
    } else {
      console.log(`   ❌ Backend server not responding on ${API_URL}\n`);
      allGood = false;
      issues.push('Start server: cd server && npm run dev');
    }
  } catch (error) {
    console.log(`   ❌ Backend server not accessible\n`);
    allGood = false;
    issues.push('Start server: cd server && npm run dev');
  }

  // Check 5: Sample Data
  console.log('5. Checking for sample data...');
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [patients] = await connection.query('SELECT COUNT(*) as count FROM patients');

    if (users[0].count > 0 && patients[0].count > 0) {
      console.log(`   ✅ Sample data present (${users[0].count} users, ${patients[0].count} patients)\n`);
    } else {
      console.log(`   ⚠️  No sample data found\n`);
      console.log(`      Recommendation: Run 'node src/scripts/seedDatabase.js'\n`);
    }

    await connection.end();
  } catch (error) {
    console.log(`   ⚠️  Cannot check sample data: ${error.message}\n`);
  }

  // Final Summary
  console.log('='.repeat(50) + '\n');

  if (allGood) {
    console.log('🎉 ALL PREREQUISITES MET!\n');
    console.log('You can now run the E2E verification:');
    console.log('   node e2eVerification.js\n');
    return true;
  } else {
    console.log('❌ PREREQUISITES NOT MET\n');
    console.log('Please fix the following issues:\n');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('\nAfter fixing, run this pre-check again:');
    console.log('   node preCheck.js\n');
    return false;
  }
}

checkPrerequisites();
