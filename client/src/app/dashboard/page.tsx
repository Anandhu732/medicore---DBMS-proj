'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Table from '@/components/Table';
import { mockDashboardStats, mockAppointments, mockPatients } from '@/utils/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // TODO: Replace with actual authentication check
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

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

  const stats = mockDashboardStats;
  const todayAppointments = mockAppointments.filter(
    (apt) => apt.date === new Date().toISOString().split('T')[0]
  ).slice(0, 5);
  const recentPatients = mockPatients.filter(p => p.status === 'Active').slice(0, 5);

  const appointmentColumns = [
    {
      key: 'time',
      header: 'Time',
      render: (value: string) => <span className="font-medium">{value}</span>,
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
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
  ];

  const patientColumns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'age',
      header: 'Age',
    },
    {
      key: 'phone',
      header: 'Phone',
    },
  ];

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-8 border border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display-sm font-bold text-black mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-lg text-neutral-600">
                Here's what's happening with your hospital today.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            trend={{ value: stats.patientGrowth, isPositive: true }}
            variant="accent"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            trend={{ value: stats.appointmentGrowth, isPositive: true }}
            variant="success"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            variant="warning"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
              </svg>
            }
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            trend={{ value: stats.revenueGrowth, isPositive: true }}
            variant="success"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts and Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card
            title="Today's Appointments"
            subtitle={`${todayAppointments.length} appointments scheduled`}
            action={
              <button
                onClick={() => router.push('/appointments')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            }
          >
            {todayAppointments.length > 0 ? (
              <Table
                columns={appointmentColumns}
                data={todayAppointments}
                onRowClick={(row) => router.push(`/appointments/${row.id}`)}
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No appointments scheduled for today</p>
            )}
          </Card>

          {/* Recent Patients */}
          <Card
            title="Recent Patients"
            subtitle={`${stats.activePatients} active patients`}
            action={
              <button
                onClick={() => router.push('/patients')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            }
          >
            <Table
              columns={patientColumns}
              data={recentPatients}
              onRowClick={(row) => router.push(`/patients/${row.id}`)}
            />
          </Card>
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions" variant="elevated">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <button
              onClick={() => router.push('/patients?action=add')}
              className="group flex flex-col items-center justify-center p-8 bg-accent-50 hover:bg-accent-100 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-accent-200"
            >
              <div className="w-16 h-16 bg-accent-100 group-hover:bg-accent-200 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-black group-hover:text-accent-700">Add Patient</span>
            </button>

            <button
              onClick={() => router.push('/appointments?action=schedule')}
              className="group flex flex-col items-center justify-center p-8 bg-success-50 hover:bg-success-100 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-success-200"
            >
              <div className="w-16 h-16 bg-success-100 group-hover:bg-success-200 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-black group-hover:text-success-700">Schedule Appointment</span>
            </button>

            <button
              onClick={() => router.push('/medical-records?action=add')}
              className="group flex flex-col items-center justify-center p-8 bg-warning-50 hover:bg-warning-100 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-warning-200"
            >
              <div className="w-16 h-16 bg-warning-100 group-hover:bg-warning-200 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-8 h-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-black group-hover:text-warning-700">Add Medical Record</span>
            </button>

            <button
              onClick={() => router.push('/billing?action=create')}
              className="group flex flex-col items-center justify-center p-8 bg-primary-50 hover:bg-primary-100 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-primary-200"
            >
              <div className="w-16 h-16 bg-primary-100 group-hover:bg-primary-200 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-black group-hover:text-primary-700">Create Invoice</span>
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
