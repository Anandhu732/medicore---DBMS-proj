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
import { mockPatients, mockUsers } from '@/utils/mockData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/utils/constants';

export default function AddMedicalRecordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescriptions: [] as any[],
    labResults: [] as any[],
    notes: '',
    followUpDate: '',
    followUpNotes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'receptionist') {
        showToast('Access denied: Receptionists cannot add medical records', 'error');
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
      loadInitialData();
    }
  }, [router, showToast]);

  const loadInitialData = async () => {
    try {
      const patients = mockPatients.filter(p => p.status === 'Active');
      const doctors = mockUsers.filter(u => u.role === 'doctor');

      setAvailablePatients(patients);
      setAvailableDoctors(doctors);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const removePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((prescription, i) =>
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const addLabResult = () => {
    setFormData(prev => ({
      ...prev,
      labResults: [...prev.labResults, { test: '', result: '', normalRange: '', status: 'Normal' }]
    }));
  };

  const removeLabResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      labResults: prev.labResults.filter((_, i) => i !== index)
    }));
  };

  const updateLabResult = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      labResults: prev.labResults.map((result, i) =>
        i === index ? { ...result, [field]: value } : result
      )
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
    if (!formData.diagnosis.trim()) {
      showToast('Please enter diagnosis', 'error');
      return false;
    }
    if (!formData.symptoms.trim()) {
      showToast('Please enter symptoms', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Transform symptoms from string to array
      const symptomsArray = formData.symptoms.split('\n').filter(s => s.trim());

      // Transform prescriptions to match backend schema
      const prescriptionsPayload = formData.prescriptions.map(p => ({
        medication: p.medication,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        instructions: '' // Optional field
      }));

      // Transform lab results to match backend schema
      const labResultsPayload = formData.labResults.map(l => ({
        testName: l.test,
        value: l.result,
        unit: '', // Optional field
        normalRange: l.normalRange,
        status: l.status
      }));

      const recordData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        diagnosis: formData.diagnosis,
        symptoms: symptomsArray,
        notes: formData.notes,
        prescriptions: prescriptionsPayload,
        labResults: labResultsPayload,
      };

      // Call the actual API
      await api.medicalRecords.create(recordData);

      showToast('Medical record added successfully!', 'success');
      router.push('/medical-records');
    } catch (error: any) {
      console.error('Failed to add medical record:', error);
      showToast(error.message || 'Failed to add medical record', 'error');
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
    <ProtectedRoute requiredPermissions={[PERMISSIONS.EDIT_MEDICAL_RECORDS]}>
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Medical Record</h1>
              <p className="text-gray-600 mt-1">Create a new medical record for a patient</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient and Doctor Selection */}
          <Card title="Patient & Doctor Information" variant="elevated">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </Card>

          {/* Diagnosis and Symptoms */}
          <Card title="Diagnosis & Symptoms" variant="elevated">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  placeholder="Enter primary diagnosis"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Symptoms <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  placeholder="Describe the symptoms observed..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Treatment Plan
                </label>
                <Textarea
                  value={formData.treatment}
                  onChange={(e) => handleInputChange('treatment', e.target.value)}
                  placeholder="Describe the treatment plan..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Prescriptions */}
          <Card title="Prescriptions" variant="elevated">
            <div className="space-y-4">
              {formData.prescriptions.map((prescription, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Prescription {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removePrescription(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={prescription.medication}
                      onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                      placeholder="Medication name"
                    />
                    <Input
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                      placeholder="Dosage"
                    />
                    <Input
                      value={prescription.frequency}
                      onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                      placeholder="Frequency (e.g., twice daily)"
                    />
                    <Input
                      value={prescription.duration}
                      onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                      placeholder="Duration (e.g., 7 days)"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addPrescription}
                variant="outline"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Prescription
              </Button>
            </div>
          </Card>

          {/* Lab Results */}
          <Card title="Lab Results" variant="elevated">
            <div className="space-y-4">
              {formData.labResults.map((result, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Lab Test {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removeLabResult(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={result.test}
                      onChange={(e) => updateLabResult(index, 'test', e.target.value)}
                      placeholder="Test name"
                    />
                    <Input
                      value={result.result}
                      onChange={(e) => updateLabResult(index, 'result', e.target.value)}
                      placeholder="Test result"
                    />
                    <Input
                      value={result.normalRange}
                      onChange={(e) => updateLabResult(index, 'normalRange', e.target.value)}
                      placeholder="Normal range"
                    />
                    <Select
                      value={result.status}
                      onChange={(value) => updateLabResult(index, 'status', value)}
                      options={[
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Abnormal', label: 'Abnormal' },
                        { value: 'Critical', label: 'Critical' },
                      ]}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addLabResult}
                variant="outline"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Lab Result
              </Button>
            </div>
          </Card>

          {/* Follow-up Information */}
          <Card title="Follow-up Information" variant="elevated">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Follow-up Date
                </label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Follow-up Notes
                </label>
                <Textarea
                  value={formData.followUpNotes}
                  onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                  placeholder="Instructions for follow-up visit..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or observations..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card variant="outline">
            <div className="flex justify-end space-x-4">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Add Medical Record
              </Button>
            </div>
          </Card>
        </form>

        {/* Quick Tips */}
        <Card title="Quick Tips" variant="outline">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Ensure accurate diagnosis and symptom documentation for proper patient care.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Include all prescribed medications with proper dosages and instructions.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Document lab results with reference ranges for better interpretation.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Schedule follow-up appointments when necessary for continued care.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
