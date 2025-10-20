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
import { mockAppointments, mockPatients, mockUsers } from '@/utils/mockData';
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
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(mockAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    duration: '30',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const duration = parseInt(formData.duration);
    const hasConflict = checkForConflicts(
      formData.date,
      formData.time,
      duration,
      modalMode === 'edit' ? selectedAppointment?.id : undefined
    );

    if (hasConflict && modalMode === 'add') {
      return;
    }

    const patient = mockPatients.find(p => p.id === formData.patientId);
    const doctor = mockUsers.find(u => u.id === formData.doctorId);

    const newAppointment: Appointment = {
      id: modalMode === 'add' ? `A${(appointments.length + 1).toString().padStart(3, '0')}` : selectedAppointment!.id,
      patientId: formData.patientId,
      patientName: patient?.name || 'Unknown',
      doctorId: formData.doctorId,
      doctorName: doctor?.name || 'Unknown',
      department: doctor?.department || 'General',
      date: formData.date,
      time: formData.time,
      duration: duration,
      status: 'Scheduled',
      reason: formData.reason,
      notes: formData.notes,
    };

    if (modalMode === 'add') {
      setAppointments([...appointments, newAppointment]);
      showToast('Appointment scheduled successfully', 'success');
    } else {
      setAppointments(appointments.map(a => a.id === newAppointment.id ? newAppointment : a));
      showToast('Appointment updated successfully', 'success');
    }

    setIsModalOpen(false);
  };

  const handleStatusChange = (appointment: Appointment, newStatus: string) => {
    setAppointments(
      appointments.map((a) =>
        a.id === appointment.id ? { ...a, status: newStatus as any } : a
      )
    );
    showToast(`Appointment marked as ${newStatus}`, 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
        <span className="text-sm text-gray-600">{value.length > 30 ? value.slice(0, 30) + '...' : value}</span>
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

  const doctors = mockUsers.filter(u => u.role === 'doctor');

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6 animate-fade-in">
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
            <Button onClick={handleAddAppointment} icon={
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
              onChange={(e) => setFilterStatus(e.target.value)}
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
              columns={columns}
              data={filteredAppointments.sort((a, b) => {
                const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateCompare !== 0) return dateCompare;
                return b.time.localeCompare(a.time);
              })}
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
              <Button onClick={handleSubmit}>
                {modalMode === 'add' ? 'Schedule' : 'Update'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Patient"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                options={[
                  { value: '', label: 'Select Patient' },
                  ...mockPatients.filter(p => p.status === 'Active').map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))
                ]}
                required
              />
              <Select
                label="Doctor"
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                options={[
                  { value: '', label: 'Select Doctor' },
                  ...doctors.map(d => ({ value: d.id, label: `${d.name} - ${d.department}` }))
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
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
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
              placeholder="e.g., Routine checkup, Follow-up"
              required
            />

            <Textarea
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or special requirements"
            />
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
