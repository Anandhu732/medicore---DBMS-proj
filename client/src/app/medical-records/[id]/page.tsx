'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { PERMISSIONS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import { can } from '@/utils/permissions';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MedicalRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      loadRecordDetails();
    }
  }, [params.id, user]);

  const loadRecordDetails = async () => {
    try {
      setIsLoading(true);
      const recordData: any = await api.medicalRecords.getById(params.id as string);
      setRecord(recordData);
    } catch (error: any) {
      console.error('Failed to load medical record:', error);
      showToast(error.message || 'Failed to load medical record details', 'error');
      router.push('/medical-records');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    showToast('Edit functionality will be available soon', 'info');
    // TODO: Implement edit functionality
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
            <p className="mt-4 text-muted-foreground">Loading medical record...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!record) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Medical record not found</p>
          <Button onClick={() => router.push('/medical-records')} className="mt-4">
            Back to Medical Records
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_MEDICAL_RECORDS]}>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Medical Record Details</h1>
              <p className="text-muted-foreground">Record #{record.id}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/medical-records')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                }
              >
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                }
              >
                Print
              </Button>
              {can.editMedicalRecords(user?.role) && (
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Edit Record
                </Button>
              )}
            </div>
          </div>

          {/* Patient & Doctor Information */}
          <Card title="Patient & Doctor Information" variant="elevated">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Patient Name</label>
                <p className="text-lg font-semibold text-foreground">{record.patientName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Doctor Name</label>
                <p className="text-lg font-semibold text-foreground">{record.doctorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Visit Date</label>
                <p className="text-lg font-semibold text-foreground">{formatDate(record.visitDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Record Type</label>
                <p className="text-lg font-semibold text-foreground capitalize">{record.type || 'General'}</p>
              </div>
            </div>
          </Card>

          {/* Diagnosis & Symptoms */}
          <Card title="Diagnosis & Symptoms" variant="elevated" className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</label>
                <p className="text-foreground mt-1 text-lg">{record.diagnosis}</p>
              </div>

              {record.symptoms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Symptoms</label>
                  <p className="text-foreground mt-1">{record.symptoms}</p>
                </div>
              )}

              {record.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Doctor's Notes</label>
                  <div className="bg-muted p-4 rounded-lg mt-1">
                    <p className="text-foreground whitespace-pre-wrap">{record.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Vital Signs */}
          {record.vitalSigns && (
            <Card title="Vital Signs" variant="elevated" className="mt-6">
              <div className="grid grid-cols-3 gap-4">
                {record.vitalSigns.bloodPressure && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Blood Pressure</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.bloodPressure}</p>
                  </div>
                )}
                {record.vitalSigns.heartRate && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Heart Rate</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                {record.vitalSigns.temperature && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.temperature}°F</p>
                  </div>
                )}
                {record.vitalSigns.weight && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.weight} kg</p>
                  </div>
                )}
                {record.vitalSigns.height && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Height</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.height} cm</p>
                  </div>
                )}
                {record.vitalSigns.oxygenSaturation && (
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">O2 Saturation</label>
                    <p className="text-xl font-bold text-foreground mt-1">{record.vitalSigns.oxygenSaturation}%</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Prescriptions */}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <Card title="Prescriptions" variant="elevated" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Medication</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Dosage</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Frequency</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.prescriptions.map((prescription: any, index: number) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium text-foreground">{prescription.medication}</td>
                        <td className="py-3 px-4 text-foreground">{prescription.dosage}</td>
                        <td className="py-3 px-4 text-foreground">{prescription.frequency}</td>
                        <td className="py-3 px-4 text-foreground">{prescription.duration}</td>
                        <td className="py-3 px-4 text-muted-foreground">{prescription.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Lab Results */}
          {record.labResults && record.labResults.length > 0 && (
            <Card title="Laboratory Results" variant="elevated" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Test Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Result</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Reference Range</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.labResults.map((result: any, index: number) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium text-foreground">{result.testName}</td>
                        <td className="py-3 px-4 text-foreground">{result.result}</td>
                        <td className="py-3 px-4 text-muted-foreground">{result.referenceRange || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === 'normal' ? 'bg-success/10 text-success' :
                            result.status === 'abnormal' ? 'bg-destructive/10 text-destructive' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {result.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{result.date ? formatDate(result.date) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <Card title="Attachments" variant="elevated" className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                {record.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{attachment.name}</p>
                      <p className="text-sm text-muted-foreground">{attachment.type} • {attachment.size}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      }
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Follow-up Information */}
          {record.followUp && (
            <Card title="Follow-up Information" variant="elevated" className="mt-6">
              <div className="space-y-3">
                {record.followUp.required && (
                  <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-warning mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Follow-up Required</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Date: {record.followUp.date ? formatDate(record.followUp.date) : 'To be scheduled'}
                        </p>
                        {record.followUp.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{record.followUp.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
