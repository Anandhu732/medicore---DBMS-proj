import mysql from 'mysql2/promise';
import config from './config.js';

// Create connection pool
const pool = mysql.createPool(config.database);

/**
 * Execute a query with automatic error handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a connection from the pool for transactions
 * @returns {Promise} Database connection
 */
export const getConnection = async () => {
  return await pool.getConnection();
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close all database connections
 */
export const closePool = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};

export default {
  pool,
  query,
  getConnection,
  testConnection,
  closePool,
};
