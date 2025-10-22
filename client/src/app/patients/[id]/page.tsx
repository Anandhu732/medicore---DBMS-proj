'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { BLOOD_GROUPS, PERMISSIONS } from '@/utils/constants';
import { Patient } from '@/utils/types';
import { formatDate, getStatusColor } from '@/utils/helpers';
import { can } from '@/utils/permissions';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    medicalHistory: [] as any[],
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (params.id && user) {
      loadPatientDetails();
    }
  }, [params.id, user]);

  const loadPatientDetails = async () => {
    try {
      setIsLoading(true);
      const patientData: any = await api.patients.getById(params.id as string);
      setPatient(patientData);

      // Set form data for editing
      setFormData({
        name: patientData.name,
        age: patientData.age.toString(),
        gender: patientData.gender,
        bloodGroup: patientData.bloodGroup,
        phone: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        emergencyContact: patientData.emergencyContact,
        medicalHistory: patientData.medicalHistory || [],
      });
    } catch (error: any) {
      console.error('Failed to load patient:', error);
      showToast(error.message || 'Failed to load patient details', 'error');
      router.push('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await api.patients.update(params.id as string, {
        ...formData,
        age: parseInt(formData.age),
      });

      showToast('Patient updated successfully!', 'success');
      setIsEditModalOpen(false);
      loadPatientDetails();
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      showToast(error.message || 'Failed to update patient', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await api.patients.archive(params.id as string);
      showToast('Patient archived successfully!', 'success');
      setIsArchiveModalOpen(false);
      router.push('/patients');
    } catch (error: any) {
      console.error('Failed to archive patient:', error);
      showToast(error.message || 'Failed to archive patient', 'error');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading patient details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button onClick={() => router.push('/patients')} className="mt-4">
            Back to Patients
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PATIENTS]}>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Patient Details</h1>
              <p className="text-muted-foreground">View and manage patient information</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/patients')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                }
              >
                Back
              </Button>
              {can.editPatients(user?.role) && (
                <>
                  <Button
                    variant="primary"
                    onClick={handleEdit}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                  {patient.status === 'Active' && (
                    <Button
                      variant="outline"
                      onClick={() => setIsArchiveModalOpen(true)}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      }
                    >
                      Archive
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <Card title="Personal Information" variant="elevated" className="lg:col-span-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Patient ID</label>
                    <p className="text-lg font-semibold text-foreground">{patient.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg font-semibold text-foreground">{patient.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Age</label>
                    <p className="text-lg font-semibold text-foreground">{patient.age} years</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-lg font-semibold text-foreground">{patient.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                    <p className="text-lg font-semibold text-foreground">{patient.bloodGroup}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p className="text-lg font-semibold text-foreground">{formatDate(patient.registrationDate)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Card */}
            <Card title="Contact Information" variant="elevated">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg font-semibold text-foreground">{patient.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg font-semibold text-foreground break-all">{patient.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-foreground">{patient.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                  <p className="text-foreground">{patient.emergencyContact}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Medical History */}
          <Card title="Medical History" variant="elevated" className="mt-6">
            {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <div className="space-y-3">
                {patient.medicalHistory.map((record: any, index: number) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.type === 'condition' ? 'bg-destructive/20 text-destructive' :
                            record.type === 'allergy' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {record.type}
                          </span>
                          <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
                        </div>
                        <p className="text-foreground">{record.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No medical history recorded</p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" variant="elevated" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/schedule-appointment?patient=${patient.id}`)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/add-medical-record?patient=${patient.id}`)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Add Medical Record
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/create-invoice?patient=${patient.id}`)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                }
              >
                Create Invoice
              </Button>
            </div>
          </Card>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Patient Information"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(value) => handleInputChange('gender', value)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <Select
                label="Blood Group"
                value={formData.bloodGroup}
                onChange={(value) => handleInputChange('bloodGroup', value)}
                options={BLOOD_GROUPS.map(group => ({ value: group, label: group }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />

            <Input
              label="Emergency Contact"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Archive Confirmation Modal */}
        <Modal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          title="Archive Patient"
        >
          <div className="space-y-4">
            <p className="text-foreground">
              Are you sure you want to archive <strong>{patient?.name}</strong>? This will mark the patient as inactive.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsArchiveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleArchive}>
                Archive Patient
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}
