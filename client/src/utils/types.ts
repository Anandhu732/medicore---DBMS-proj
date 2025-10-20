export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  department?: string;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string[];
  status: 'Active' | 'Archived';
  registrationDate: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  reason: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  prescriptions: Prescription[];
  labResults?: LabResult[];
  notes: string;
  attachments: Attachment[];
  version: number;
  updatedBy: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  transactionId: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  patientGrowth: number;
  appointmentGrowth: number;
  revenueGrowth: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}
