import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function checkDatabase() {
  let connection;

  try {
    console.log('\n[CHECK] Checking Database Connection...\n');
    console.log('Configuration:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  User: ${dbConfig.user}`);
    console.log(`  Password: ${dbConfig.password ? '****' : '(empty)'}\n`);

    // Connect to MySQL server
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server successfully!\n');

    // Check if database exists
    const dbName = process.env.DB_NAME || 'medicore_db';
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbName);

    if (dbExists) {
      console.log(`✅ Database '${dbName}' exists!\n`);

      // Use the database
      await connection.query(`USE ${dbName}`);

      // Get all tables
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`[TABLES] Tables in '${dbName}':`);

      if (tables.length === 0) {
        console.log('  ⚠️  No tables found. Database is empty.\n');
        console.log('  💡 Run the initialization script:');
        console.log('     cd server && node src/scripts/initDatabase.js\n');
      } else {
        tables.forEach((table, index) => {
          console.log(`  ${index + 1}. ${Object.values(table)[0]}`);
        });
        console.log('');

        // Get row counts for each table
        console.log('[ROWS] Row Counts:');
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
          console.log(`  ${tableName}: ${rows[0].count} rows`);
        }
        console.log('');

        // Show sample data from patients table if exists
        const patientsTable = tables.find(t => Object.values(t)[0] === 'patients');
        if (patientsTable) {
          const [patients] = await connection.query('SELECT id, name, email, status FROM patients LIMIT 5');
          if (patients.length > 0) {
            console.log('👥 Sample Patients:');
            patients.forEach(p => {
              console.log(`  - ${p.id}: ${p.name} (${p.email}) - ${p.status}`);
            });
            console.log('');
          }
        }

        // Show sample data from appointments table if exists
        const appointmentsTable = tables.find(t => Object.values(t)[0] === 'appointments');
        if (appointmentsTable) {
          const [appointments] = await connection.query('SELECT id, date, time, status FROM appointments LIMIT 5');
          if (appointments.length > 0) {
            console.log('[SAMPLE] Sample Appointments:');
            appointments.forEach(a => {
              console.log(`  - ${a.id}: ${a.date} at ${a.time} - ${a.status}`);
            });
            console.log('');
          }
        }
      }
    } else {
      console.log(`❌ Database '${dbName}' does NOT exist!\n`);
      console.log('Available databases:');
      databases.forEach(db => {
        console.log(`  - ${db.Database}`);
      });
      console.log('\n💡 To create the database, run:');
      console.log('   cd server && node src/scripts/initDatabase.js\n');
    }

    console.log('✅ Database check completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Database check failed!\n');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL server is not running or not accessible.');
      console.error('   Please make sure MySQL is installed and running.');
      console.error('   You can start it with:');
      console.error('   - Windows: Open Services and start MySQL');
      console.error('   - macOS: brew services start mysql');
      console.error('   - Linux: sudo service mysql start\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Please check your credentials in .env file:');
      console.error(`   DB_USER=${process.env.DB_USER}`);
      console.error('   DB_PASSWORD=****\n');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkDatabase();
