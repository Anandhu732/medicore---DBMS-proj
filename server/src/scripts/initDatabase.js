import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize database - Create database and tables
 */
async function initializeDatabase() {
  let connection;

  try {
    console.log('🚀 Starting database initialization...\n');

    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database}`);
    console.log(`✅ Database '${config.database.database}' created or already exists`);

    // Use the database
    await connection.query(`USE ${config.database.database}`);
    console.log(`✅ Using database '${config.database.database}'`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf-8');

    // Split SQL statements and execute them
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n[INIT] Executing ${statements.length} SQL statements...\n`);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        // Ignore table doesn't exist errors for DROP statements
        if (!error.message.includes("doesn't exist")) {
          throw error;
        }
      }
    }

    console.log('✅ Database schema created successfully\n');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('[TABLES] Created tables:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    console.log('\n✨ Database initialization completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run "npm run seed" to populate with sample data');
    console.log('   2. Run "npm run dev" to start the server\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();
