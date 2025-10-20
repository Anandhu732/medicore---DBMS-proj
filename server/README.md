# 🏥 MediCore Hospital Management System - Backend Server

## Overview

Complete Node.js + MySQL backend for the MediCore Hospital Management System with full API support and admin dashboard.

## 🚀 Features

- ✅ **RESTful API** - Complete CRUD operations for all entities
- ✅ **MySQL Database** - Structured schema with relationships
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access Control** - Admin, Doctor, Receptionist roles
- ✅ **Timestamp Synchronization** - UTC storage with timezone conversion
- ✅ **Admin Dashboard** - Web-based database management UI
- ✅ **Input Validation** - Express-validator integration
- ✅ **Error Handling** - Centralized error management
- ✅ **Security** - Helmet, CORS, rate limiting
- ✅ **API Documentation** - Inline comments for frontend integration

## 📋 Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Git

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medicore_db

# Set JWT secret
JWT_SECRET=your_super_secret_key_here
```

### 3. Initialize Database

```bash
# Create database and tables
npm run init-db

# Seed with sample data (matches frontend mock data)
npm run seed
```

### 4. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on: **http://localhost:5000**

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Patients

- `GET /api/patients` - Get all patients (with filtering)
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `PATCH /api/patients/:id/archive` - Archive patient
- `DELETE /api/patients/:id` - Delete patient (admin only)

### Appointments

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/today` - Get today's appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/status` - Update status
- `DELETE /api/appointments/:id` - Delete appointment

### Medical Records

- `GET /api/medical-records` - Get all medical records
- `GET /api/medical-records/:id` - Get medical record by ID
- `POST /api/medical-records` - Create medical record
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record

### Billing/Invoices

- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create invoice
- `PATCH /api/invoices/:id/payment` - Record payment
- `PATCH /api/invoices/:id/status` - Update status
- `DELETE /api/invoices/:id` - Delete invoice

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent` - Get recent activity

## 🔧 Admin Dashboard

Access the admin dashboard at: **http://localhost:5000/admin**

Features:

- ✅ View all database tables
- ✅ Search and filter records
- ✅ Edit records with form validation
- ✅ Delete records
- ✅ Real-time database status
- ✅ Pagination support
- ✅ Responsive Tailwind CSS UI

## 🔐 Frontend Integration

### 1. Update Frontend API Base URL

In `client/src/config/api.ts` (create if doesn't exist):

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
```

### 2. Replace Mock Data with API Calls

Example for patients page (`client/src/app/patients/page.tsx`):

```typescript
// Replace this:
const [patients, setPatients] = useState<Patient[]>(mockPatients);

// With this:
const [patients, setPatients] = useState<Patient[]>([]);

useEffect(() => {
  fetchPatients();
}, []);

const fetchPatients = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    setPatients(result.data);
  } catch (error) {
    console.error("Failed to fetch patients:", error);
  }
};
```

### 3. Update Login Flow

In `client/src/app/login/page.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
      router.push("/dashboard");
    } else {
      setError(result.message);
    }
  } catch (error) {
    setError("Login failed");
  }
};
```

## 🕐 Timestamp Synchronization

All timestamps are stored in UTC in the database and converted to the configured timezone for API responses.

**Database Storage**: UTC timestamps
**API Response**: ISO 8601 format (compatible with frontend `new Date()`)
**Timezone**: Configurable via `DEFAULT_TIMEZONE` in `.env`

Example response:

```json
{
  "id": "P001",
  "name": "John Smith",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## 📊 Database Schema

### Users

- id, name, email, password, role, department, is_active
- Roles: admin, doctor, receptionist

### Patients

- id, name, age, gender, blood_group, phone, email, address
- emergency_contact, medical_history (JSON), status

### Appointments

- id, patient_id, doctor_id, date, time, duration, status, reason

### Medical Records

- id, patient_id, doctor_id, date, diagnosis, symptoms (JSON), notes
- Related: prescriptions, lab_results, attachments

### Invoices

- id, patient_id, date, due_date, total_amount, paid_amount, status
- Related: invoice_items

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- SQL injection protection (parameterized queries)
- CORS configuration
- Helmet security headers
- Rate limiting

## 🧪 Testing

```bash
# Test database connection
node src/scripts/initDatabase.js

# Test API health
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicore.com","password":"password"}'
```

## 📝 Demo Credentials

```
Admin:        admin@medicore.com / password
Doctor:       sarah.johnson@medicore.com / password
Receptionist: emily.davis@medicore.com / password
```

## 🛠️ Project Structure

```
server/
├── src/
│   ├── admin/              # Admin dashboard UI
│   │   ├── index.html
│   │   └── dashboard.js
│   ├── config/             # Configuration
│   │   ├── config.js
│   │   └── database.js
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── billingController.js
│   │   ├── medicalRecordController.js
│   │   └── dashboardController.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── billingRoutes.js
│   │   ├── medicalRecordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── scripts/            # Database scripts
│   │   ├── initDatabase.js
│   │   └── seedDatabase.js
│   ├── utils/              # Utilities
│   │   ├── datetime.js
│   │   └── response.js
│   ├── database/           # Database schema
│   │   └── schema.sql
│   └── server.js           # Main server file
├── uploads/                # File uploads
├── .env.example            # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🚨 Troubleshooting

### Database Connection Failed

```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
# Ensure database exists
CREATE DATABASE medicore_db;
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=5001
```

### CORS Errors

```bash
# Update CLIENT_URL in .env to match frontend URL
CLIENT_URL=http://localhost:3000
```

## 📈 Next Steps

1. ✅ Test all API endpoints
2. ✅ Integrate with frontend
3. ⏳ Add file upload for medical records attachments
4. ⏳ Implement PDF generation for invoices
5. ⏳ Add email notifications
6. ⏳ Implement audit logging
7. ⏳ Add API documentation (Swagger/OpenAPI)
8. ⏳ Set up production deployment

## 📞 Support

For issues or questions:

- Check inline code comments (marked with TODO for frontend integration)
- Review API endpoint responses
- Check server logs for errors

## 📄 License

MIT License - Copyright (c) 2025 MediCore Team

---

**Built with ❤️ for MediCore Hospital Management System**
