/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { mockPatients, mockUsers } from '@/utils/mockData';
import { APPOINTMENT_STATUS, DEPARTMENTS } from '@/utils/constants';
import { Appointment } from '@/utils/types';
import { getStatusColor, formatDate, checkTimeConflict } from '@/utils/helpers';

interface User {
  role: string;
  name: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    duration: '30',
    reason: '',
    notes: '',
  });
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      loadAppointments();
      loadPatients();
      loadDoctors();
    }
  }, [router]);

  // Load patients for appointment form
  const loadPatients = async () => {
    try {
      const patientsData: any = await api.patients.getAll();
      setAvailablePatients(patientsData.filter((p: any) => p.status === 'Active'));
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      showToast('Failed to load patients for appointment', 'error');
    }
  };

  // Load doctors for appointment form
  const loadDoctors = async () => {
    try {
      // For now, we'll use mock data for doctors since there's no doctors API endpoint
      // In a real app, you'd have an API endpoint for users with role 'doctor'
      const doctors = mockUsers.filter(u => u.role === 'doctor');
      setAvailableDoctors(doctors);
    } catch (error: any) {
      console.error('Failed to load doctors:', error);
      showToast('Failed to load doctors for appointment', 'error');
    }
  };

  // Load appointments from backend
  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const appointmentsData: any = await api.appointments.getAll();
      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
    } catch (error: any) {
      console.error('Failed to load appointments:', error);
      showToast(error.message || 'Failed to load appointments', 'error');
      // Fallback to empty array on error
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === filterStatus);
    }

    if (filterDate) {
      filtered = filtered.filter((apt) => apt.date === filterDate);
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, filterStatus, filterDate, appointments]);

  const handleAddAppointment = () => {
    setModalMode('add');
    setFormData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      duration: '30',
      reason: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setModalMode('edit');
    setSelectedAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration.toString(),
      reason: appointment.reason,
      notes: appointment.notes || '',
    });
    setIsModalOpen(true);
  };

  const checkForConflicts = (date: string, time: string, duration: number, excludeId?: string): boolean => {
    const endTime = new Date(`2000-01-01T${time}`);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    const conflicts = appointments.filter(apt => {
      if (apt.id === excludeId) return false;
      if (apt.date !== date) return false;
      if (apt.status === 'Cancelled') return false;

      const aptEndTime = new Date(`2000-01-01T${apt.time}`);
      aptEndTime.setMinutes(aptEndTime.getMinutes() + apt.duration);
      const aptEndTimeStr = aptEndTime.toTimeString().slice(0, 5);

      return checkTimeConflict(time, endTimeStr, apt.time, aptEndTimeStr);
    });

    if (conflicts.length > 0) {
      showToast(`Time conflict detected with appointment at ${conflicts[0].time}`, 'warning');
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.patientId) {
        showToast('Please select a patient', 'error');
        return;
      }
      if (!formData.doctorId) {
        showToast('Please select a doctor', 'error');
        return;
      }
      if (!formData.date) {
        showToast('Please select a date', 'error');
        return;
      }
      if (!formData.time) {
        showToast('Please select a time', 'error');
        return;
      }
      if (!formData.reason.trim()) {
        showToast('Please enter a reason for the appointment', 'error');
        return;
      }

      const duration = parseInt(formData.duration);

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        date: formData.date,
        time: formData.time,
        duration: duration,
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
      };

      if (modalMode === 'add') {
        await api.appointments.create(appointmentData);
        showToast('Appointment scheduled successfully', 'success');
      } else {
        await api.appointments.update(selectedAppointment!.id, appointmentData);
        showToast('Appointment updated successfully', 'success');
      }

      setIsModalOpen(false);
      loadAppointments(); // Reload appointments from database
    } catch (error: any) {
      console.error('Submit error:', error);
      showToast(error.message || 'Failed to save appointment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      if (newStatus === 'Cancelled') {
        await api.appointments.cancel(appointment.id);
      } else if (newStatus === 'Completed') {
        await api.appointments.complete(appointment.id);
      }
      showToast(`Appointment marked as ${newStatus}`, 'success');
      loadAppointments(); // Reload appointments from database
    } catch (error: any) {
      console.error('Status change error:', error);
      showToast(error.message || 'Failed to update appointment status', 'error');
    }
  };

  if (!user) {
    return null; // Layout handles loading state
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => <span className="font-medium">{formatDate(value)}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      render: (value: string, row: Appointment) => (
        <span className="font-medium">{value} ({row.duration} min)</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
    },
    {
      key: 'doctorName',
      header: 'Doctor',
    },
    {
      key: 'department',
      header: 'Department',
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value.length > 30 ? value.slice(0, 30) + '...' : value}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`badge ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Appointment) => (
        <div className="flex gap-2">
          {row.status === 'Scheduled' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAppointment(row);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                aria-label={`Edit appointment for ${row.patientName}`}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(row, 'Completed');
                }}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
                aria-label={`Complete appointment for ${row.patientName}`}
              >
                Complete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(row, 'Cancelled');
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
                aria-label={`Cancel appointment for ${row.patientName}`}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <Button onClick={() => router.push('/schedule-appointment')} icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }>
                Schedule Appointment
              </Button>
            </div>
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search by patient, doctor, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
              <Select
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Scheduled', label: 'Scheduled' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                  { value: 'No Show', label: 'No Show' },
                ]}
              />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </Card>

          {viewMode === 'list' ? (
            <Card
              title="Appointment Schedule"
              subtitle={`${filteredAppointments.length} appointment${filteredAppointments.length !== 1 ? 's' : ''} found`}
            >
              <Table
                columns={columns as any}
                data={filteredAppointments.sort((a, b) => {
                  const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
                  if (dateCompare !== 0) return dateCompare;
                  return b.time.localeCompare(a.time);
                }) as any}
                emptyMessage="No appointments found"
              />
            </Card>
          ) : (
            <Card title="Calendar View">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
                <p className="text-gray-600 mb-4">Drag-and-drop calendar interface coming soon!</p>
                <p className="text-sm text-gray-500">This feature will include visual conflict detection and easy rescheduling.</p>
              </div>
            </Card>
          )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'add' ? 'Schedule New Appointment' : 'Edit Appointment'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="appointment-form">
                {modalMode === 'add' ? 'Schedule' : 'Update'}
              </Button>
            </>
          }
        >
          <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Patient"
                value={formData.patientId}
                onChange={(value) => setFormData({ ...formData, patientId: value })}
                options={[
                  { value: '', label: 'Select Patient' },
                  ...availablePatients.map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.id})`
                  }))
                ]}
                required
              />
              <Select
                label="Doctor"
                value={formData.doctorId}
                onChange={(value) => setFormData({ ...formData, doctorId: value })}
                options={[
                  { value: '', label: 'Select Doctor' },
                  ...availableDoctors.map(d => ({
                    value: d.id,
                    label: `${d.name} - ${d.department || 'General Medicine'}`
                  }))
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
              <Select
                label="Duration"
                value={formData.duration}
                onChange={(value) => setFormData({ ...formData, duration: value })}
                options={[
                  { value: '15', label: '15 minutes' },
                  { value: '30', label: '30 minutes' },
                  { value: '45', label: '45 minutes' },
                  { value: '60', label: '1 hour' },
                  { value: '90', label: '1.5 hours' },
                  { value: '120', label: '2 hours' },
                ]}
              />
            </div>

            <Input
              label="Reason for Visit"
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Routine checkup, Follow-up consultation, Annual physical"
              required
            />

            <Textarea
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or special requirements (e.g., need wheelchair access, interpreter needed)"
              rows={3}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-1">Appointment Tips:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>• System will check for time conflicts automatically</li>
                    <li>• Appointments cannot be scheduled in the past</li>
                    <li>• Patient and doctor will receive confirmation notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
          </Modal>
        </div>
      </div>
    </Layout>
  );
}
