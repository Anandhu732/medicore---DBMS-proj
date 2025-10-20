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
import { mockMedicalRecords, mockPatients, mockUsers } from '@/utils/mockData';
import { MedicalRecord } from '@/utils/types';
import { formatDate, formatDateTime } from '@/utils/helpers';

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<MedicalRecord[]>(mockMedicalRecords);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>(mockMedicalRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    symptoms: '',
    notes: '',
    prescriptions: [] as any[],
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'receptionist') {
        showToast('Access denied: Receptionists cannot view medical records', 'error');
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
    }
  }, [router, showToast]);

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  }, [searchTerm, records]);

  const viewRecordDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleAddRecord = () => {
    setFormData({
      patientId: '',
      diagnosis: '',
      symptoms: '',
      notes: '',
      prescriptions: [],
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Replace with actual API call
    const patient = mockPatients.find(p => p.id === formData.patientId);
    const doctorUser = user; // Current logged-in user

    const newRecord: MedicalRecord = {
      id: `MR${(records.length + 1).toString().padStart(3, '0')}`,
      patientId: formData.patientId,
      patientName: patient?.name || 'Unknown',
      doctorId: doctorUser?.id || 'D001',
      doctorName: doctorUser?.name || 'Dr. Unknown',
      date: new Date().toISOString().split('T')[0],
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
      prescriptions: formData.prescriptions,
      notes: formData.notes,
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: doctorUser?.id || 'D001',
      attachments: [], // Initialize empty attachments array
    };

    setRecords([newRecord, ...records]);
    showToast('Medical record created successfully', 'success');
    setIsAddModalOpen(false);
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
      key: 'patientName',
      header: 'Patient',
    },
    {
      key: 'doctorName',
      header: 'Doctor',
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (value: string) => (
        <span className="text-sm">{value.length > 40 ? value.slice(0, 40) + '...' : value}</span>
      ),
    },
    {
      key: 'prescriptions',
      header: 'Prescriptions',
      render: (value: any[]) => (
        <span className="text-sm text-gray-600">{value.length} items</span>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (value: number) => (
        <span className="badge bg-gray-100 text-gray-800">v{value}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: MedicalRecord) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            viewRecordDetails(row);
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          aria-label={`View record for ${row.patientName}`}
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-600 mt-1">Manage patient medical history and records</p>
          </div>
          <Button
            onClick={() => router.push('/add-medical-record')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Record
          </Button>
        </div>

        <Card>
          <Input
            type="text"
            placeholder="Search by patient, doctor, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        <Card
          title="Medical Records"
          subtitle={`${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''} found`}
        >
          <Table
            columns={columns}
            data={filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onRowClick={viewRecordDetails}
            emptyMessage="No medical records found"
          />
        </Card>

        {/* Detail Modal */}
        {selectedRecord && (
          <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title="Medical Record Details"
            size="xl"
          >
            <div className="space-y-6">
              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient Information
                  </h4>
                  <p className="text-gray-700"><strong>Name:</strong> {selectedRecord.patientName}</p>
                  <p className="text-gray-700"><strong>ID:</strong> {selectedRecord.patientId}</p>
                  <p className="text-gray-700"><strong>Date:</strong> {formatDate(selectedRecord.date)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Doctor Information
                  </h4>
                  <p className="text-gray-700"><strong>Name:</strong> {selectedRecord.doctorName}</p>
                  <p className="text-gray-700"><strong>Last Updated:</strong> {formatDateTime(selectedRecord.updatedAt)}</p>
                  <p className="text-gray-700"><strong>Version:</strong> {selectedRecord.version}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Diagnosis</h4>
                <p className="text-gray-800">{selectedRecord.diagnosis}</p>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Symptoms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.symptoms.map((symptom, index) => (
                    <span key={index} className="badge bg-orange-100 text-orange-800">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prescriptions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Prescriptions
                </h4>
                <div className="space-y-3">
                  {selectedRecord.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{prescription.medication}</p>
                          <p className="text-sm text-gray-600">Dosage: {prescription.dosage}</p>
                          <p className="text-sm text-gray-600">Frequency: {prescription.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration: {prescription.duration}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Instructions:</strong> {prescription.instructions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Results */}
              {selectedRecord.labResults && selectedRecord.labResults.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Lab Results
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Value</th>
                          <th>Unit</th>
                          <th>Normal Range</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.labResults.map((result) => (
                          <tr key={result.id}>
                            <td className="font-medium">{result.testName}</td>
                            <td>{result.value}</td>
                            <td>{result.unit}</td>
                            <td>{result.normalRange}</td>
                            <td>
                              <span className={`badge ${
                                result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'Abnormal' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Doctor&apos;s Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-800">{selectedRecord.notes}</p>
                </div>
              </div>

              {/* Attachments */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachments
                  </h4>
                  <div className="space-y-2">
                    {selectedRecord.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-sm text-gray-600">{(attachment.size / 1024).toFixed(2)} KB • {formatDateTime(attachment.uploadedAt)}</p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Add Record Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Medical Record"
          size="xl"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Create Record
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              options={[
                { value: '', label: 'Select Patient' },
                ...mockPatients.filter(p => p.status === 'Active').map(p => ({
                  value: p.id,
                  label: `${p.name} (${p.id}) - Age: ${p.age}`
                }))
              ]}
              required
            />

            <Textarea
              label="Diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Enter the diagnosis..."
              required
              rows={3}
            />

            <Textarea
              label="Symptoms (comma separated)"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="e.g., Fever, Headache, Nausea, Fatigue"
              rows={2}
            />

            <Textarea
              label="Doctor's Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional observations, treatment plan, follow-up instructions..."
              rows={4}
            />

            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note:</strong> Prescription and lab result details can be added after creating the record.
              </p>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
