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
import { useToast } from '@/components/Toast';
import { mockInvoices, mockPatients, mockUsers } from '@/utils/mockData';
import { Invoice } from '@/utils/types';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/helpers';

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, invoices]);

  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv
      )
    );
    showToast(`Invoice status updated to ${newStatus}`, 'success');
  };

  const handlePayment = () => {
    if (!selectedInvoice) return;

    const balance = selectedInvoice.totalAmount - selectedInvoice.paidAmount;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedInvoice.id
          ? {
              ...inv,
              paidAmount: inv.totalAmount,
              status: 'paid' as const,
              payments: [
                ...inv.payments,
                {
                  id: `PAY${inv.payments.length + 1}`,
                  amount: balance,
                  method: 'Cash',
                  date: new Date().toISOString(),
                  transactionId: `TXN${Date.now()}`,
                },
              ],
            }
          : inv
      )
    );

    showToast('Payment recorded successfully', 'success');
    setIsPaymentModalOpen(false);
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    showToast('PDF generation feature coming soon!', 'info');
    // TODO: Implement PDF generation
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'id',
      header: 'Invoice ID',
      render: (value: string) => <span className="font-mono font-semibold">{value}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'patientName',
      header: 'Patient',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (value: number) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (value: number) => (
        <span className="text-green-600 font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (_: any, row: Invoice) => {
        const balance = row.totalAmount - row.paidAmount;
        return (
          <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        const color = getStatusColor(value);
        return <span className={`badge bg-${color}-100 text-${color}-800`}>{value}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Invoice) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              viewInvoiceDetails(row);
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            aria-label={`View invoice ${row.id}`}
          >
            View
          </button>
          {row.status !== 'paid' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPaymentModal(row);
              }}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
              aria-label={`Record payment for invoice ${row.id}`}
            >
              Pay
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = totalRevenue - totalPaid;
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
            <p className="text-gray-600 mt-1">Manage payments and financial records</p>
          </div>
          <Button
            onClick={() => showToast('Create invoice feature coming soon!', 'info')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Create Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid ({paidCount})</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending ({pendingCount})</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overdue ({overdueCount})</p>
                <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Search by patient name or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </Card>

        <Card
          title="Invoices"
          subtitle={`${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? 's' : ''} found`}
        >
          <Table
            columns={columns}
            data={filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onRowClick={viewInvoiceDetails}
            emptyMessage="No invoices found"
          />
        </Card>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title={`Invoice ${selectedInvoice.id}`}
            size="xl"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">MediCore Hospital</h3>
                  <p className="text-sm text-gray-600 mt-1">123 Medical Center Drive</p>
                  <p className="text-sm text-gray-600">City, State 12345</p>
                  <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Date:</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.date)}</p>
                  <p className="text-sm text-gray-600 mt-2">Due Date:</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                <p className="text-gray-800"><strong>{selectedInvoice.patientName}</strong></p>
                <p className="text-sm text-gray-600">Patient ID: {selectedInvoice.patientId}</p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Services & Items</h4>
                <div className="overflow-x-auto">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th className="text-left">Description</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{formatCurrency(item.price)}</td>
                          <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (0%):</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Paid:</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold text-lg pt-2 border-t">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {payment.method} • {formatDate(payment.date)}
                          </p>
                          <p className="text-xs text-gray-500">Transaction ID: {payment.transactionId}</p>
                        </div>
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  Download PDF
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openPaymentModal(selectedInvoice);
                    }}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  >
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Payment Modal */}
        {selectedInvoice && (
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title="Record Payment"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Invoice ID:</p>
                <p className="font-mono font-semibold text-gray-900">{selectedInvoice.id}</p>
                <p className="text-sm text-gray-600 mt-2">Outstanding Balance:</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                </p>
              </div>

              <div className="text-center py-4">
                <p className="text-gray-600">Payment processing UI coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">This will include payment method selection, partial payment options, and receipt generation.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handlePayment} className="flex-1">
                  Record Full Payment
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
