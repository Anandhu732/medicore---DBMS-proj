'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/utils/constants';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  // Sample data for charts
  const patientData = [
    { month: 'Jan', patients: 120, appointments: 95 },
    { month: 'Feb', patients: 150, appointments: 110 },
    { month: 'Mar', patients: 180, appointments: 140 },
    { month: 'Apr', patients: 200, appointments: 160 },
    { month: 'May', patients: 220, appointments: 180 },
    { month: 'Jun', patients: 250, appointments: 200 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 30000 },
    { month: 'Feb', revenue: 52000, expenses: 32000 },
    { month: 'Mar', revenue: 48000, expenses: 35000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 40000 },
    { month: 'Jun', revenue: 67000, expenses: 42000 }
  ];

  const departmentData = [
    { name: 'Cardiology', value: 35, color: '#3b82f6' },
    { name: 'Neurology', value: 25, color: '#10b981' },
    { name: 'Orthopedics', value: 20, color: '#f59e0b' },
    { name: 'Pediatrics', value: 15, color: '#ef4444' },
    { name: 'Emergency', value: 5, color: '#8b5cf6' }
  ];

  const systemLogs = [
    { time: '09:00', event: 'System backup completed', status: 'success' },
    { time: '10:30', event: 'New patient registered', status: 'info' },
    { time: '11:15', event: 'Database optimization', status: 'success' },
    { time: '12:00', event: 'Security scan completed', status: 'success' },
    { time: '14:30', event: 'System update available', status: 'warning' },
    { time: '15:45', event: 'New appointment scheduled', status: 'info' }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into your hospital operations</p>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value="2,847"
            trend={{ value: 12, isPositive: true }}
            variant="accent"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Monthly Revenue"
            value="$67,000"
            trend={{ value: 8, isPositive: true }}
            variant="success"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          <StatCard
            title="Active Doctors"
            value="45"
            trend={{ value: 3, isPositive: true }}
            variant="primary"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="System Uptime"
            value="99.9%"
            trend={{ value: 0.1, isPositive: true }}
            variant="warning"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Summary Table */}
          <Card title="Patient Summary" variant="elevated">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Patients</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {patientData.map((item, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-4 text-muted-foreground">{item.month}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{item.patients}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{item.appointments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Revenue Analysis Table */}
          <Card title="Revenue Analysis" variant="elevated">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Revenue</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Expenses</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((item, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-4 text-muted-foreground">{item.month}</td>
                      <td className="py-3 px-4 text-success font-medium">${item.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-destructive font-medium">${item.expenses.toLocaleString()}</td>
                      <td className="py-3 px-4 text-foreground font-medium">${(item.revenue - item.expenses).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Department Distribution & System Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Distribution */}
          <Card title="Department Distribution" variant="elevated">
            <div className="space-y-4">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-medium text-foreground">{dept.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{dept.value}%</div>
                    <div className="text-sm text-muted-foreground">of total</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System Logs */}
          <Card title="System Logs" variant="elevated">
            <div className="space-y-4">
              {systemLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-success' :
                      log.status === 'warning' ? 'bg-warning' :
                      'bg-primary'
                    }`} />
                    <span className="text-sm font-medium text-foreground">{log.event}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
