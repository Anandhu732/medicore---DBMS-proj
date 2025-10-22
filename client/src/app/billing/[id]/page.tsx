'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { PERMISSIONS } from '@/utils/constants';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { can } from '@/utils/permissions';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    notes: '',
  });

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
      loadInvoiceDetails();
    }
  }, [params.id, user]);

  const loadInvoiceDetails = async () => {
    try {
      setIsLoading(true);
      const invoiceData: any = await api.invoices.getById(params.id as string);
      setInvoice(invoiceData);

      // Set default payment amount to remaining balance
      const remainingBalance = invoiceData.totalAmount - invoiceData.paidAmount;
      setPaymentData(prev => ({
        ...prev,
        amount: remainingBalance.toFixed(2),
      }));
    } catch (error: any) {
      console.error('Failed to load invoice:', error);
      showToast(error.message || 'Failed to load invoice details', 'error');
      router.push('/billing');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const amount = parseFloat(paymentData.amount);

      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid payment amount', 'error');
        return;
      }

      const remainingBalance = invoice.totalAmount - invoice.paidAmount;
      if (amount > remainingBalance) {
        showToast('Payment amount cannot exceed remaining balance', 'error');
        return;
      }

      await api.invoices.pay(params.id as string, {
        amount,
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes,
      });

      showToast('Payment processed successfully!', 'success');
      setIsPaymentModalOpen(false);
      loadInvoiceDetails(); // Reload to get updated invoice
    } catch (error: any) {
      console.error('Payment failed:', error);
      showToast(error.message || 'Failed to process payment', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    showToast('PDF download feature coming soon', 'info');
    // TODO: Implement PDF generation
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
            <p className="mt-4 text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button onClick={() => router.push('/billing')} className="mt-4">
            Back to Billing
          </Button>
        </div>
      </Layout>
    );
  }

  const remainingBalance = invoice.totalAmount - invoice.paidAmount;
  const isPaid = invoice.status === 'paid';

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_BILLING]}>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Invoice Details</h1>
              <p className="text-muted-foreground">Invoice #{invoice.id}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/billing')}
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
              {!isPaid && can.manageBilling(user?.role) && (
                <Button
                  variant="primary"
                  onClick={() => setIsPaymentModalOpen(true)}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  Record Payment
                </Button>
              )}
            </div>
          </div>

          {/* Invoice Status Banner */}
          <div className={`p-4 rounded-lg mb-6 ${
            isPaid ? 'bg-success/10 border border-success' :
            invoice.status === 'overdue' ? 'bg-destructive/10 border border-destructive' :
            'bg-warning/10 border border-warning'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Status: <span className={`${getStatusColor(invoice.status)}`}>{invoice.status.toUpperCase()}</span></p>
                {!isPaid && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Remaining Balance: <strong className="text-foreground">{formatCurrency(remainingBalance)}</strong>
                  </p>
                )}
              </div>
              {isPaid && (
                <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Invoice Information */}
          <Card title="Invoice Information" variant="elevated">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Patient Name</label>
                <p className="text-lg font-semibold text-foreground">{invoice.patientName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                <p className="text-lg font-semibold text-foreground">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="text-lg font-semibold text-foreground">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                <p className="text-lg font-semibold text-foreground">{invoice.paymentMethod || 'Not specified'}</p>
              </div>
            </div>
          </Card>

          {/* Invoice Items */}
          <Card title="Invoice Items" variant="elevated" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-4 text-foreground">{item.description}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-4 text-right text-foreground">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-foreground">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <span className="font-semibold text-success">{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span className="text-foreground">Balance Due:</span>
                    <span className={remainingBalance > 0 ? 'text-destructive' : 'text-success'}>
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          {invoice.paidAt && (
            <Card title="Payment History" variant="elevated" className="mt-6">
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Payment Received</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.paidAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{formatCurrency(invoice.paidAmount)}</p>
                      <p className="text-sm text-muted-foreground">{invoice.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Payment"
        >
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-foreground">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Already Paid:</span>
                <span className="font-semibold text-success">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span className="text-foreground">Remaining Balance:</span>
                <span className="text-destructive">{formatCurrency(remainingBalance)}</span>
              </div>
            </div>

            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter payment amount"
            />

            <Select
              label="Payment Method"
              value={paymentData.paymentMethod}
              onChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'Credit Card', label: 'Credit Card' },
                { value: 'Debit Card', label: 'Debit Card' },
                { value: 'Insurance', label: 'Insurance' },
                { value: 'Check', label: 'Check' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
              ]}
            />

            <Input
              label="Notes (Optional)"
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any payment notes"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePayment}>
                Process Payment
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}
