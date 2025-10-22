import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// Middleware Configuration
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for admin dashboard
}));

// CORS configuration
app.use(cors(config.cors));

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more lenient for authenticated API calls
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased from 100 to 300 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check
  skip: (req) => req.path === '/api/health',
});
app.use('/api/', limiter);

// Serve static files (for uploads, admin dashboard)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ============================================
// API Routes
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediCore API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API Routes
app.use(`${config.apiBaseUrl}/auth`, authRoutes);
app.use(`${config.apiBaseUrl}/patients`, patientRoutes);
app.use(`${config.apiBaseUrl}/appointments`, appointmentRoutes);
app.use(`${config.apiBaseUrl}/invoices`, billingRoutes);
app.use(`${config.apiBaseUrl}/medical-records`, medicalRecordRoutes);
app.use(`${config.apiBaseUrl}/dashboard`, dashboardRoutes);
app.use(`${config.apiBaseUrl}/reports`, reportsRoutes);
app.use(`${config.apiBaseUrl}/admin`, adminRoutes);

// ============================================
// Admin Dashboard Routes
// ============================================

// Serve admin dashboard at /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================
// Server Initialization
// ============================================

const PORT = config.port || 5000;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log('\n╔══════════════════════════════════════════════════════╗');
      console.log('║                                                      ║');
      console.log('║   🏥  MediCore Hospital Management System API  🏥   ║');
      console.log('║                                                      ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
      console.log(`🚀 Server running in ${config.env} mode`);
      console.log(`🌐 API URL: http://localhost:${PORT}${config.apiBaseUrl}`);
      console.log(`⚙️ Admin Dashboard: http://localhost:${PORT}/admin`);
      console.log(`💻 Client URL: ${config.cors.origin}`);
      console.log(`🕐 Timezone: ${config.timezone.default}`);
      console.log('\n📚 API Endpoints:');
      console.log(`   - POST   ${config.apiBaseUrl}/auth/login`);
      console.log(`   - POST   ${config.apiBaseUrl}/auth/register`);
      console.log(`   - GET    ${config.apiBaseUrl}/patients`);
      console.log(`   - GET    ${config.apiBaseUrl}/appointments`);
      console.log(`   - GET    ${config.apiBaseUrl}/invoices`);
      console.log(`   - GET    ${config.apiBaseUrl}/medical-records`);
      console.log(`   - GET    ${config.apiBaseUrl}/dashboard/stats`);
      console.log('\n✨ Server ready to accept requests!\n');
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
