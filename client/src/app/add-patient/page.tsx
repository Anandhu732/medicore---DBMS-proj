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
import { BLOOD_GROUPS, PATIENT_STATUS, PERMISSIONS } from '@/utils/constants';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AddPatientPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Please enter patient name', 'error');
      return false;
    }
    if (!formData.age || parseInt(formData.age) < 0 || parseInt(formData.age) > 150) {
      showToast('Please enter a valid age', 'error');
      return false;
    }
    if (!formData.phone.trim()) {
      showToast('Please enter phone number', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      showToast('Please enter email address', 'error');
      return false;
    }
    if (!formData.address.trim()) {
      showToast('Please enter address', 'error');
      return false;
    }
    if (!formData.emergencyContact.trim()) {
      showToast('Please enter emergency contact name', 'error');
      return false;
    }
    if (!formData.emergencyContactPhone.trim()) {
      showToast('Please enter emergency contact phone', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Build medical history array
      const medicalHistory: any[] = [];

      if (formData.medicalHistory.trim()) {
        medicalHistory.push({
          type: 'condition',
          description: formData.medicalHistory,
          date: new Date().toISOString().split('T')[0]
        });
      }

      if (formData.allergies.trim()) {
        medicalHistory.push({
          type: 'allergy',
          description: formData.allergies,
          date: new Date().toISOString().split('T')[0]
        });
      }

      if (formData.medications.trim()) {
        medicalHistory.push({
          type: 'medication',
          description: formData.medications,
          date: new Date().toISOString().split('T')[0]
        });
      }

      const patientData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        emergencyContact: `${formData.emergencyContact.trim()} : ${formData.emergencyContactPhone.trim()}`,
        medicalHistory: medicalHistory,
      };

      // Call the actual API
      const response = await api.patients.create(patientData);

      showToast('Patient added successfully!', 'success');
      router.push('/patients');
    } catch (error: any) {
      console.error('Failed to add patient:', error);
      showToast(error.message || 'Failed to add patient', 'error');
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
    <ProtectedRoute requiredPermissions={[PERMISSIONS.EDIT_PATIENTS]}>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Patient</h1>
              <p className="text-gray-600 mt-1">Register a new patient in the system</p>
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

        {/* Personal Information */}
        <Card title="Personal Information" variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter patient's full name"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Age <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter age"
                  min="0"
                  max="150"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onChange={(value) => handleInputChange('gender', value)}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>

              {/* Blood Group */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Blood Group
                </label>
                <Select
                  value={formData.bloodGroup}
                  onChange={(value) => handleInputChange('bloodGroup', value)}
                  options={BLOOD_GROUPS.map(group => ({
                    value: group,
                    label: group
                  }))}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete address"
                rows={3}
              />
            </div>
          </form>
        </Card>

        {/* Emergency Contact */}
        <Card title="Emergency Contact" variant="elevated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Emergency Contact Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Enter emergency contact name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Emergency Contact Phone <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="Enter emergency contact phone"
              />
            </div>
          </div>
        </Card>

        {/* Medical Information */}
        <Card title="Medical Information" variant="elevated">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Medical History
              </label>
              <Textarea
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                placeholder="Enter any relevant medical history..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Known Allergies
              </label>
              <Textarea
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="Enter any known allergies..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Medications
              </label>
              <Textarea
                value={formData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="Enter current medications..."
                rows={3}
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
              onClick={handleSubmit}
              loading={isLoading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            >
              Add Patient
            </Button>
          </div>
        </Card>

        {/* Quick Tips */}
        <Card title="Quick Tips" variant="outline">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Ensure all required fields are filled before submitting the form.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Double-check phone numbers and email addresses for accuracy.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Include comprehensive medical history to help with future treatments.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Emergency contact information is crucial for patient safety.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
