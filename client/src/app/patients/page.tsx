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
import { BLOOD_GROUPS, PATIENT_STATUS } from '@/utils/constants';
import { Patient } from '@/utils/types';
import { getStatusColor, formatDate } from '@/utils/helpers';

export default function PatientsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
    medicalHistory: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      loadPatients();
    }
  }, [router]);

  // Load patients from backend
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const patientsData: any = await api.patients.getAll();
      setPatients(patientsData);
      setFilteredPatients(patientsData);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      showToast(error.message || 'Failed to load patients', 'error');
      // Fallback to empty array on error
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = patients;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((patient) => patient.status === filterStatus);
    }

    setFilteredPatients(filtered);
  }, [searchTerm, filterStatus, patients]);

  const handleAddPatient = () => {
    setModalMode('add');
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      medicalHistory: '',
    });
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setModalMode('edit');
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      medicalHistory: patient.medicalHistory.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        showToast('Name is required', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showToast('Email is required', 'error');
        return;
      }
      if (!formData.phone.trim()) {
        showToast('Phone is required', 'error');
        return;
      }

      const patientData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(h => h.trim()).filter(h => h.length > 0) : [],
      };

      if (modalMode === 'add') {
        await api.patients.create(patientData);
        showToast('Patient added successfully', 'success');
      } else {
        await api.patients.update(selectedPatient!.id, patientData);
        showToast('Patient updated successfully', 'success');
      }

      setIsModalOpen(false);
      loadPatients(); // Reload patients from database
    } catch (error: any) {
      console.error('Submit error:', error);
      showToast(error.message || 'Failed to save patient', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (patient: Patient) => {
    try {
      await api.patients.archive(patient.id);
      showToast(`Patient ${patient.name} archived successfully`, 'success');
      loadPatients(); // Reload patients from database
    } catch (error: any) {
      console.error('Archive error:', error);
      showToast(error.message || 'Failed to archive patient', 'error');
    }
  };

  if (!user) {
    return null; // Layout handles loading state
  }

  const columns = [
    {
      key: 'id',
      header: 'Patient ID',
      render: (value: string) => <span className="font-medium text-blue-600">{value}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'age',
      header: 'Age',
    },
    {
      key: 'gender',
      header: 'Gender',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Patient) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditPatient(row);
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            aria-label={`Edit ${row.name}`}
          >
            Edit
          </button>
          {row.status === 'Active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleArchive(row);
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
              aria-label={`Archive ${row.name}`}
            >
              Archive
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 mt-1">Manage patient records and information</p>
            </div>
            <Button onClick={() => router.push('/add-patient')} icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }>
              Add Patient
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search by name, ID, or email..."
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
                  { value: 'Active', label: 'Active' },
                  { value: 'Archived', label: 'Archived' },
                ]}
              />
            </div>
          </Card>

          {/* Patients Table */}
          <Card
            title="Patient Records"
            subtitle={`${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''} found`}
          >
            <Table
              columns={columns as any}
              data={filteredPatients as any}
              onRowClick={(row) => router.push(`/patients/${row.id}`)}
              emptyMessage="No patients found"
            />
          </Card>

          {/* Add/Edit Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'add' ? 'Add New Patient' : 'Edit Patient'}
            size="lg"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="patient-form">
                  {modalMode === 'add' ? 'Add Patient' : 'Update Patient'}
                </Button>
              </>
            }
          >
          <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter patient's full name"
                required
              />
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter age"
                min="0"
                max="150"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <Select
                label="Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0000"
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                required
              />
            </div>

            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
              rows={2}
              required
            />

            <Input
              label="Emergency Contact"
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="+1-555-0000 (Relation: Name)"
              required
            />

            <Textarea
              label="Medical History (comma separated)"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="e.g., Hypertension, Diabetes Type 2, Asthma"
              rows={2}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong className="text-gray-900">Tip:</strong> All fields marked with * are required. Medical history is optional but recommended for better patient care.
              </p>
            </div>
          </form>
          </Modal>
        </div>
      </div>
    </Layout>
  );
}
