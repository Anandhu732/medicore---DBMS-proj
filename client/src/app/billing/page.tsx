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
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { mockPatients, mockUsers } from '@/utils/mockData';
import { Invoice } from '@/utils/types';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/helpers';

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    items: [
      {
        description: '',
        category: 'Consultation',
        quantity: 1,
        price: 0,
      },
    ],
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      loadInvoices();
      loadPatients();
    }
  }, [router]);

  // Load invoices from backend
  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const invoicesData: any = await api.invoices.getAll();
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
    } catch (error: any) {
      console.error('Failed to load invoices:', error);
      showToast(error.message || 'Failed to load invoices', 'error');
      // Fallback to empty array on error
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load patients for invoice form
  const loadPatients = async () => {
    try {
      const patientsData: any = await api.patients.getAll();
      setAvailablePatients(patientsData.filter((p: any) => p.status === 'Active'));
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      showToast('Failed to load patients for invoice', 'error');
    }
  };

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

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    try {
      const balance = selectedInvoice.totalAmount - selectedInvoice.paidAmount;
      
      await api.invoices.pay(selectedInvoice.id, {
        amount: balance,
        paymentMethod: 'Cash',
      });

      showToast('Payment recorded successfully', 'success');
      setIsPaymentModalOpen(false);
      loadInvoices(); // Reload invoices from database
    } catch (error: any) {
      console.error('Payment error:', error);
      showToast(error.message || 'Failed to record payment', 'error');
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    showToast('PDF generation feature coming soon!', 'info');
    // TODO: Implement PDF generation
  };

  const handleCreateInvoice = () => {
    router.push('/create-invoice');
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: '',
          category: 'Consultation',
          quantity: 1,
          price: 0,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.patientId) {
        showToast('Please select a patient', 'error');
        return;
      }
      if (!formData.dueDate) {
        showToast('Please select a due date', 'error');
        return;
      }
      if (formData.items.some(item => !item.description.trim() || item.price <= 0)) {
        showToast('Please fill in all item details with valid prices', 'error');
        return;
      }

      const patient = availablePatients.find(p => p.id === formData.patientId);
      if (!patient) {
        showToast('Please select a valid patient', 'error');
        return;
      }

      // Calculate totals and prepare items
      const items = formData.items.map((item, index) => ({
        description: item.description.trim(),
        category: item.category,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
      }));

      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      const invoiceData = {
        patientId: formData.patientId,
        date: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate,
        items: items,
        notes: formData.notes.trim(),
      };

      await api.invoices.create(invoiceData);
      showToast('Invoice created successfully', 'success');
      setIsCreateModalOpen(false);
      loadInvoices(); // Reload invoices from database
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      showToast(error.message || 'Failed to create invoice', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Layout handles loading state
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
        <span className="font-semibold text-foreground">{formatCurrency(value)}</span>
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
        return <span className={`badge ${color}`}>{value}</span>;
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
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="text-gray-600 mt-1">Manage payments and financial records</p>
            </div>
            <Button
              onClick={handleCreateInvoice}
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
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
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
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
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
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
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
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
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
              <div className="flex items-start justify-between pb-6 border-b border-border">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">MediCore Hospital</h3>
                  <p className="text-sm text-muted-foreground mt-1">123 Medical Center Drive</p>
                  <p className="text-sm text-muted-foreground">City, State 12345</p>
                  <p className="text-sm text-muted-foreground">Phone: (555) 123-4567</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Invoice Date:</p>
                  <p className="font-semibold text-foreground">{formatDate(selectedInvoice.date)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Due Date:</p>
                  <p className="font-semibold text-foreground">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Bill To:</h4>
                <p className="text-foreground"><strong>{selectedInvoice.patientName}</strong></p>
                <p className="text-sm text-muted-foreground">Patient ID: {selectedInvoice.patientId}</p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Services & Items</h4>
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
                              <p className="font-medium text-foreground">{item.description}</p>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                          </td>
                          <td className="text-center text-foreground">{item.quantity}</td>
                          <td className="text-right text-foreground">{formatCurrency(item.price)}</td>
                          <td className="text-right font-semibold text-foreground">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="text-foreground">{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax (0%):</span>
                      <span className="text-foreground">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-success font-semibold">
                      <span>Paid:</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-destructive font-bold text-lg pt-2 border-t border-border">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                        <div>
                          <p className="font-medium text-foreground">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.method} • {formatDate(payment.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">Transaction ID: {payment.transactionId}</p>
                        </div>
                        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
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
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Invoice ID:</p>
                <p className="font-mono font-semibold text-foreground">{selectedInvoice.id}</p>
                <p className="text-sm text-muted-foreground mt-2">Outstanding Balance:</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                </p>
              </div>

              <div className="text-center py-4">
                <p className="text-muted-foreground">Payment processing UI coming soon!</p>
                <p className="text-sm text-muted-foreground mt-2">This will include payment method selection, partial payment options, and receipt generation.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handlePayment} className="flex-1">
                  Record Full Payment
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Invoice Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Invoice"
          size="xl"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="invoice-form">
                Create Invoice
              </Button>
            </>
          }
        >
          <form id="invoice-form" onSubmit={handleSubmitInvoice} className="space-y-6">
            {/* Patient Selection */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Patient"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                options={[
                  { value: '', label: 'Select Patient' },
                  ...availablePatients.map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.id})`
                  }))
                ]}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Invoice Items</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive/80"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Description"
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="e.g., General Consultation"
                        required
                      />
                      <Select
                        label="Category"
                        value={item.category}
                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                        options={[
                          { value: 'Consultation', label: 'Consultation' },
                          { value: 'Procedure', label: 'Procedure' },
                          { value: 'Medication', label: 'Medication' },
                          { value: 'Lab Test', label: 'Lab Test' },
                          { value: 'Imaging', label: 'Imaging' },
                          { value: 'Room Charge', label: 'Room Charge' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <Input
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        required
                      />
                      <Input
                        label="Unit Price ($)"
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Total</label>
                        <div className="h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg flex items-center">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(item.quantity * parseFloat(item.price.toString() || '0'))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      formData.items.reduce(
                        (sum, item) => sum + item.quantity * parseFloat(item.price.toString() || '0'),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or payment instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-1">Invoice Tips:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>• Add multiple items by clicking the Add Item button</li>
                    <li>• Invoice will be created with status Pending</li>
                    <li>• Patient will receive invoice notification via email</li>
                    <li>• You can record payments from the invoice details view</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
          </Modal>
        </div>
      </div>
    </Layout>
  );
}
