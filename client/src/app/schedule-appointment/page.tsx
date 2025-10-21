'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';

export default function ScheduleAppointmentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
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
      loadInitialData();
    }
  }, [router]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch real patients from API
      const patientsData = await api.patients.getAll({ status: 'Active', limit: 100 });
      const patients = Array.isArray(patientsData) ? patientsData : [];

      // Fetch real doctors from API
      const usersData = await api.users.getAll({ limit: 100 });
      const users = Array.isArray(usersData) ? usersData : [];
      const doctors = users.filter((u: any) => u.role === 'doctor');

      setAvailablePatients(patients);
      setAvailableDoctors(doctors);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Failed to load patients and doctors', 'error');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.patientId) {
      showToast('Please select a patient', 'error');
      return false;
    }
    if (!formData.doctorId) {
      showToast('Please select a doctor', 'error');
      return false;
    }
    if (!formData.date) {
      showToast('Please select a date', 'error');
      return false;
    }
    if (!formData.time) {
      showToast('Please select a time', 'error');
      return false;
    }
    if (!formData.reason) {
      showToast('Please enter appointment reason', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        reason: formData.reason,
        notes: formData.notes || '',
      };

      // Call the actual API
      await api.appointments.create(appointmentData);

      showToast('Appointment scheduled successfully!', 'success');
      router.push('/appointments');
    } catch (error: any) {
      console.error('Failed to schedule appointment:', error);
      showToast(error.message || 'Failed to schedule appointment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule Appointment</h1>
            <p className="text-gray-600 mt-1">Create a new appointment for a patient</p>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Cancel
          </Button>
        </div>

        {/* Form */}
        <Card title="Appointment Details" variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Patient <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.patientId}
                  onChange={(value) => handleInputChange('patientId', value)}
                  placeholder="Select a patient"
                  options={availablePatients.map(patient => ({
                    value: patient.id,
                    label: `${patient.name} (${patient.id})`
                  }))}
                />
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.doctorId}
                  onChange={(value) => handleInputChange('doctorId', value)}
                  placeholder="Select a doctor"
                  options={availableDoctors.map(doctor => ({
                    value: doctor.id,
                    label: `${doctor.name} - ${doctor.department || 'General'}`
                  }))}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <Select
                  value={formData.duration}
                  onChange={(value) => handleInputChange('duration', value)}
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

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="e.g., Routine checkup, Follow-up visit"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about the appointment..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                Schedule Appointment
              </Button>
            </div>
          </form>
        </Card>

        {/* Quick Tips */}
        <Card title="Quick Tips" variant="outline">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Select a patient from the active patients list. Only active patients can be scheduled for appointments.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Choose a doctor based on the patient's needs and the doctor's specialization.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Appointments can only be scheduled for future dates. Past dates are not allowed.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Provide a clear reason for the appointment to help the doctor prepare appropriately.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
