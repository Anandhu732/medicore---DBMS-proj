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
import { mockPatients } from '@/utils/mockData';
import { BLOOD_GROUPS, PATIENT_STATUS } from '@/utils/constants';
import { Patient } from '@/utils/types';
import { getStatusColor, formatDate } from '@/utils/helpers';

export default function PatientsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
    }
  }, [router]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Replace with actual API call
    const newPatient: Patient = {
      id: modalMode === 'add' ? `P${(patients.length + 1).toString().padStart(3, '0')}` : selectedPatient!.id,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      bloodGroup: formData.bloodGroup,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(h => h.trim()) : [],
      status: 'Active',
      registrationDate: modalMode === 'add' ? new Date().toISOString().split('T')[0] : selectedPatient!.registrationDate,
    };

    if (modalMode === 'add') {
      setPatients([...patients, newPatient]);
      showToast('Patient added successfully', 'success');
    } else {
      setPatients(patients.map(p => p.id === newPatient.id ? newPatient : p));
      showToast('Patient updated successfully', 'success');
    }

    setIsModalOpen(false);
  };

  const handleArchive = (patient: Patient) => {
    // TODO: Replace with actual API call
    setPatients(
      patients.map((p) =>
        p.id === patient.id ? { ...p, status: 'Archived' as const } : p
      )
    );
    showToast(`Patient ${patient.name} archived successfully`, 'success');
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
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1">Manage patient records and information</p>
          </div>
          <Button onClick={handleAddPatient} icon={
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
            columns={columns}
            data={filteredPatients}
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
              <Button onClick={handleSubmit}>
                {modalMode === 'add' ? 'Add Patient' : 'Update Patient'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <Input
              label="Emergency Contact"
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="+1-555-0000 (Name)"
              required
            />

            <Textarea
              label="Medical History (comma separated)"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="e.g., Hypertension, Diabetes"
            />
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
