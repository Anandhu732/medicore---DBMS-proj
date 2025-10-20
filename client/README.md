# MediCore - Hospital Management System

A modern, comprehensive hospital management system built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

## 🏥 Features

- **Landing Page**: Professional landing page with feature highlights
- **Authentication**: Role-based login/register with validation
- **Dashboard**: Overview with stats, charts, and quick actions
- **Patient Management**: Add, edit, archive patients with search/filtering
- **Appointments**: Calendar scheduling (more pages to be built)
- **Medical Records**: Doctor notes, prescriptions, attachments
- **Billing**: Invoice management with PDF generation
- **Reports**: Analytics with CSV/PDF export
- **Settings**: Role-based permissions management

## 🚀 Quick Start

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Demo Credentials

**Admin**: admin@medicore.com / password
**Doctor**: doctor@medicore.com / password
**Receptionist**: receptionist@medicore.com / password

## 📁 Project Structure

```
client/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # Reusable UI components
│   └── utils/            # Helpers, types, mock data
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind configuration
```

## 🎨 Key Components

- **Button**, **Input**, **Select**, **Textarea**: Form components
- **Card**, **Table**, **Modal**: Layout components
- **Toast**: Global notification system
- **Sidebar**, **Header**, **Layout**: Navigation components

## 📝 Mock Data

All data is in `src/utils/mockData.ts`. Search for `// TODO: Replace with actual API call` to find integration points.

## 🔄 Next Steps

Additional pages to build:

- Full Appointments page with calendar
- Medical Records detail view
- Billing with PDF generation
- Reports with charts
- Settings page

## 🔐 Security Notes

- Current auth uses localStorage (replace with JWT for production)
- Add CSRF protection, rate limiting, HTTPS
- Follow HIPAA compliance for healthcare data

## 📦 Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Role-based access control

---

**Note**: This is a frontend demo with mock data. Implement backend integration for data persistence.
