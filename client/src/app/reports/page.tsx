'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/utils/constants';
import api from '@/utils/api';

interface ReportStats {
  overview: {
    totalPatients: number;
    activePatients: number;
    totalDoctors: number;
    totalRevenue: number;
    systemUptime: string;
  };
  monthlyData: Array<{
    month: string;
    patients: number;
    appointments: number;
    revenue: number;
    expenses: number;
  }>;
  departmentData: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
  }>;
  patientTrend: Array<{
    month: string;
    patients: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
  }>;
}

interface SystemLog {
  time: string;
  event: string;
  status: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch reports stats
        const statsData = await api.reports.getStats();
        setStats(statsData);

        // Try to fetch logs (admin only)
        try {
          const logsData = await api.reports.getLogs();
          setLogs(logsData);
        } catch (logError) {
          // Logs might not be accessible for non-admin users
          console.log('Could not load system logs:', logError);
        }
      } catch (err: any) {
        console.error('Failed to load reports:', err);
        setError(err?.message || 'Failed to load reports data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadReportsData();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
        <Layout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REPORTS]}>
        <Layout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-destructive text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
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
            value={stats?.overview.totalPatients.toLocaleString() || '0'}
            trend={{
              value: stats?.overview.activePatients || 0,
              isPositive: true
            }}
            variant="accent"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats?.overview.totalRevenue.toLocaleString() || '0'}`}
            trend={{
              value: stats?.monthlyData?.[0]?.revenue || 0,
              isPositive: true
            }}
            variant="success"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          <StatCard
            title="Active Doctors"
            value={stats?.overview.totalDoctors.toString() || '0'}
            trend={{ value: 0, isPositive: true }}
            variant="primary"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="System Uptime"
            value={stats?.overview.systemUptime || '0%'}
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
                  {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                    stats.monthlyData.slice(0, 6).map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 text-muted-foreground">{item.month}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{item.patients}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{item.appointments}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        No data available
                      </td>
                    </tr>
                  )}
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
                  {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                    stats.monthlyData.slice(0, 6).map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 text-muted-foreground">{item.month}</td>
                        <td className="py-3 px-4 text-success font-medium">${item.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-destructive font-medium">${item.expenses.toLocaleString()}</td>
                        <td className="py-3 px-4 text-foreground font-medium">${(item.revenue - item.expenses).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No data available
                      </td>
                    </tr>
                  )}
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
              {stats?.departmentData && stats.departmentData.length > 0 ? (
                stats.departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full dept-color"
                        style={{ ['--dept-color' as any]: dept.color }}
                      />
                      <span className="font-medium text-foreground">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{dept.value}%</div>
                      <div className="text-sm text-muted-foreground">{dept.count} doctors</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No department data available
                </div>
              )}
            </div>
          </Card>

          {/* System Logs */}
          <Card title="System Logs" variant="elevated">
            <div className="space-y-4">
              {logs && logs.length > 0 ? (
                logs.slice(0, 6).map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-success' :
                        log.status === 'warning' ? 'bg-warning' :
                        log.status === 'error' ? 'bg-destructive' :
                        'bg-primary'
                      }`} />
                      <span className="text-sm font-medium text-foreground">{log.event}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No system logs available
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
