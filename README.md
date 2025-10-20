# 🏥 MediCore - Complete Hospital Management System

## Full-Stack Application: Next.js Frontend + Node.js Backend + MySQL Database

---

## 📋 Project Overview

**MediCore** is a comprehensive hospital management system featuring:

- ✅ **Modern Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- ✅ **Robust Backend**: Node.js + Express + MySQL
- ✅ **Admin Dashboard**: Web-based database management UI
- ✅ **Role-Based Access**: Admin, Doctor, Receptionist
- ✅ **Complete CRUD**: All healthcare management modules
- ✅ **Synchronized Timestamps**: UTC storage with timezone handling
- ✅ **RESTful API**: Full documentation and integration

---

## 🚀 Quick Start (Complete Setup)

### Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd medicore
```

### 2. Backend Setup

```bash
cd server
npm install

# Configure database credentials
# Edit .env file with your MySQL credentials
# DB_USER=root
# DB_PASSWORD=your_password

# Initialize database and seed data
npm run init-db
npm run seed

# Start backend server (port 5000)
npm run dev
```

✅ Backend running at: **http://localhost:5000**
✅ Admin Dashboard: **http://localhost:5000/admin**

### 3. Frontend Setup

```bash
cd ../client
npm install

# Start frontend (port 3000)
npm run dev
```

✅ Frontend running at: **http://localhost:3000**

### 4. Access the Application

**Frontend Application:**

- URL: http://localhost:3000
- Demo Login:
  - Admin: `admin@medicore.com` / `password`
  - Doctor: `sarah.johnson@medicore.com` / `password`
  - Receptionist: `emily.davis@medicore.com` / `password`

**Admin Dashboard:**

- URL: http://localhost:5000/admin
- Direct database management
- CRUD operations on all tables

**API Health Check:**

- URL: http://localhost:5000/api/health

---

## 📁 Project Structure

```
medicore/
├── client/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # Reusable UI components
│   │   └── utils/           # Utilities, types, helpers
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── server/                   # Node.js Backend
│   ├── src/
│   │   ├── admin/           # Admin dashboard UI
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Auth, validation, errors
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Database init/seed
│   │   ├── utils/           # Utilities
│   │   ├── database/        # SQL schema
│   │   └── server.js        # Main server
│   ├── uploads/             # File storage
│   ├── .env                 # Environment config
│   ├── package.json
│   └── README.md
│
├── INTEGRATION_GUIDE.md     # Frontend-Backend integration
└── README.md                # This file
```

---

## 🎯 Core Features

### Frontend Modules

1. **Landing Page** - Professional marketing page
2. **Authentication** - Login/Register with role-based access
3. **Dashboard** - Statistics, charts, quick actions
4. **Patient Management** - Full CRUD, search, filtering
5. **Appointments** - Scheduling with conflict detection
6. **Medical Records** - Diagnosis, prescriptions, lab results
7. **Billing** - Invoice management, payment tracking
8. **Reports** - Analytics and data export
9. **Profile & Settings** - User management

### Backend Features

1. **RESTful API** - Complete CRUD for all entities
2. **JWT Authentication** - Secure token-based auth
3. **Role-Based Access Control** - Permission management
4. **Input Validation** - Express-validator
5. **Error Handling** - Centralized error management
6. **Timestamp Sync** - UTC storage + timezone conversion
7. **Security** - Helmet, CORS, rate limiting
8. **Admin Dashboard** - Database management UI

### Database Schema

- **Users**: Authentication and role management
- **Patients**: Complete patient information
- **Appointments**: Scheduling and status tracking
- **Medical Records**: Diagnosis, prescriptions, lab results
- **Invoices**: Billing and payment management
- **Reports**: Analytics and exports

---

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Patients

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `PATCH /api/patients/:id/archive` - Archive patient

### Appointments

- `GET /api/appointments` - List appointments
- `GET /api/appointments/today` - Today's appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id/status` - Update status

### Medical Records

- `GET /api/medical-records` - List records
- `POST /api/medical-records` - Create record
- `PUT /api/medical-records/:id` - Update record

### Billing/Invoices

- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PATCH /api/invoices/:id/payment` - Record payment

### Dashboard

- `GET /api/dashboard/stats` - Dashboard statistics

**Full API documentation**: See `/server/README.md`

---

## 🔐 Frontend-Backend Integration

### Step 1: Create API Client

**File**: `client/src/utils/api.ts`

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class APIClient {
  static async get<T>(endpoint: string) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  }

  static async post<T>(endpoint: string, body: any) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return response.json();
  }

  // ... PUT, PATCH, DELETE methods
}
```

### Step 2: Replace Mock Data

**Example**: `client/src/app/patients/page.tsx`

```typescript
// Before:
import { mockPatients } from "@/utils/mockData";
const [patients, setPatients] = useState(mockPatients);

// After:
import { APIClient } from "@/utils/api";
const [patients, setPatients] = useState([]);

useEffect(() => {
  const fetchPatients = async () => {
    const response = await APIClient.get("/patients");
    setPatients(response.data);
  };
  fetchPatients();
}, []);
```

**Complete integration guide**: See `/INTEGRATION_GUIDE.md`

---

## 🕐 Timestamp Synchronization

### How It Works

1. **Database**: Stores all timestamps in UTC
2. **Backend API**: Returns ISO 8601 format
3. **Frontend**: Automatically converts to user's timezone

```typescript
// Backend Response:
{
  "createdAt": "2024-01-15T10:30:00.000Z" // UTC
}

// Frontend Display:
const date = new Date(record.createdAt); // Converts to local timezone
formatDate(date); // "Jan 15, 2024"
```

**No code changes needed!** Existing frontend helpers already handle this correctly.

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Input validation & sanitization
- ✅ SQL injection protection
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Environment variable protection

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicore.com","password":"password"}'

# Get patients (with token)
curl -X GET http://localhost:5000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Frontend Integration

1. Start both servers
2. Open http://localhost:3000
3. Login with demo credentials
4. Open DevTools → Network tab
5. Verify API calls to http://localhost:5000/api

---

## 📊 Admin Dashboard

Access at: **http://localhost:5000/admin**

Features:

- ✅ View all database tables
- ✅ Search and filter records
- ✅ Edit records inline
- ✅ Delete records
- ✅ Real-time server status
- ✅ Pagination
- ✅ Responsive Tailwind CSS UI

Tables:

- Users
- Patients
- Appointments
- Medical Records
- Invoices
- Invoice Items
- Reports

---

## 🛠️ Development

### Backend Development

```bash
cd server
npm run dev  # Auto-reload with nodemon
```

### Frontend Development

```bash
cd client
npm run dev  # Hot reload with Next.js
```

### Database Management

```bash
cd server

# Reinitialize database
npm run init-db

# Reseed data
npm run seed
```

---

## 📝 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medicore_db

# Security
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000

# Timezone
TZ=America/New_York
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚨 Troubleshooting

### Database Connection Failed

```bash
# Verify MySQL is running
mysql -u root -p

# Check credentials in server/.env
# Ensure database exists
CREATE DATABASE medicore_db;
```

### CORS Errors

```bash
# Update CLIENT_URL in server/.env
CLIENT_URL=http://localhost:3000
```

### Port Already in Use

```bash
# Backend - Change PORT in server/.env
PORT=5001

# Frontend - Change port
PORT=3001 npm run dev
```

---

## 📚 Documentation

- **Backend API**: `/server/README.md`
- **Integration Guide**: `/INTEGRATION_GUIDE.md`
- **Frontend**: `/client/README.md`
- **Database Schema**: `/server/src/database/schema.sql`

---

## 📈 Roadmap

### Completed ✅

- [x] Frontend UI with all modules
- [x] Backend API with CRUD operations
- [x] Database schema and seeding
- [x] Authentication and authorization
- [x] Admin dashboard
- [x] Timestamp synchronization
- [x] Integration documentation

### Next Steps 🔄

- [ ] File upload for medical records
- [ ] PDF generation for invoices
- [ ] Email notifications
- [ ] Audit logging
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Production deployment guide

---

## 👥 Demo Credentials

| Role         | Email                      | Password |
| ------------ | -------------------------- | -------- |
| Admin        | admin@medicore.com         | password |
| Doctor       | sarah.johnson@medicore.com | password |
| Receptionist | emily.davis@medicore.com   | password |

---

## 📞 Support

For questions or issues:

1. Check documentation in respective README files
2. Review inline TODO comments in code
3. Check server logs for errors
4. Verify database connection
5. Test API endpoints with curl

---

## 📄 License

MIT License - Copyright (c) 2025 MediCore Team

---

## 🎉 Quick Start Summary

```bash
# 1. Backend
cd server && npm install && npm run init-db && npm run seed && npm run dev

# 2. Frontend (new terminal)
cd client && npm install && npm run dev

# 3. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Admin Dashboard: http://localhost:5000/admin
```

---

**Built with ❤️ for healthcare professionals**

**MediCore** - Modern Hospital Management System
