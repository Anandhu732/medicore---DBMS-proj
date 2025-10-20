import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export default {
  // Server Configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiBaseUrl: process.env.API_BASE_URL || '/api',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medicore_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00', // Store everything in UTC
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'medicore_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Timezone Configuration (synchronized with frontend)
  timezone: {
    default: process.env.DEFAULT_TIMEZONE || 'America/New_York',
    serverTZ: process.env.TZ || 'America/New_York',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
  },

  // Admin Configuration
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
};
