/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Table from '@/components/Table';
import AppointmentEditor from '@/components/AppointmentEditor';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
// form helper data moved into AppointmentEditor; appointments page focuses on listing
import { Appointment } from '@/utils/types';
import { getStatusColor, formatDate } from '@/utils/helpers';

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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Patient/doctor lists are handled inside AppointmentEditor when editing/creating

  // Load appointments from backend
  const loadAppointments = async () => {
    try {
      const appointmentsData: any = await api.appointments.getAll();
      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
    } catch (error: any) {
      console.error('Failed to load appointments:', error);
      showToast(error.message || 'Failed to load appointments', 'error');
      // Fallback to empty array on error
      setAppointments([]);
      setFilteredAppointments([]);
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
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setModalMode('edit');
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // Time conflict checking handled by server/editor as needed

  // submission handled by AppointmentEditor

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
      <div className="min-h-screen p-6" style={{ backgroundColor: '#ffffff' }}>
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
              <Button onClick={handleAddAppointment} variant="primary" icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }>
                Quick Add
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

        {/* Appointment editor modal (reusable) */}
        <AppointmentEditor
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }}
          mode={modalMode}
          appointment={selectedAppointment}
          onSaved={() => loadAppointments()}
        />
        </div>
      </div>
    </Layout>
  );
}
