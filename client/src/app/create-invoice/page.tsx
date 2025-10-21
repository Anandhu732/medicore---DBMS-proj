'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useToast } from '@/components/Toast';
import { api } from '@/utils/api';
import { formatCurrency } from '@/utils/helpers';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PERMISSIONS } from '@/utils/constants';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
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
    discount: 0,
    taxRate: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      loadInitialData();
    }
  }, [router]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch real patients from API
      const patientsData = await api.patients.getAll({ status: 'Active', limit: 100 });
      const patients = Array.isArray(patientsData) ? patientsData : [];
      setAvailablePatients(patients);

      // Set default due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Failed to load patients', 'error');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInvoiceItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        category: 'Consultation',
        quantity: 1,
        price: 0,
      }]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * formData.discount) / 100;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount();
    const taxableAmount = subtotal - discountAmount;
    return (taxableAmount * formData.taxRate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount();
    const taxAmount = calculateTax();
    return subtotal - discountAmount + taxAmount;
  };

  const validateForm = () => {
    if (!formData.patientId) {
      showToast('Please select a patient', 'error');
      return false;
    }
    if (!formData.dueDate) {
      showToast('Please select a due date', 'error');
      return false;
    }
    if (formData.items.some(item => !item.description.trim() || item.price <= 0)) {
      showToast('Please fill all item details with valid prices', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Transform items to match backend schema with calculated totals
      const itemsPayload = formData.items.map(item => ({
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price, // Calculate total for each item
      }));

      const invoiceData = {
        patientId: formData.patientId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        dueDate: formData.dueDate,
        items: itemsPayload,
      };

      // Call the actual API
      await api.invoices.create(invoiceData);

      showToast('Invoice created successfully!', 'success');
      router.push('/billing');
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      showToast(error.message || 'Failed to create invoice', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
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

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_BILLING]}>
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
              <p className="text-gray-600 mt-1">Generate a new invoice for a patient</p>
            </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card title="Patient Information" variant="elevated">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Patient <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.patientId}
                  onChange={(value) => handleInputChange('patientId', value)}
                  placeholder="Select a patient"
                  options={availablePatients.map(patient => ({
                    value: patient.id,
                    label: `${patient.name} (${patient.id})`
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </Card>

          {/* Invoice Items */}
          <Card title="Invoice Items" variant="elevated">
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <Select
                      value={item.category}
                      onChange={(value) => updateInvoiceItem(index, 'category', value)}
                      options={[
                        { value: 'Consultation', label: 'Consultation' },
                        { value: 'Procedure', label: 'Procedure' },
                        { value: 'Medication', label: 'Medication' },
                        { value: 'Lab Test', label: 'Lab Test' },
                        { value: 'Imaging', label: 'Imaging' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      min="1"
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Total: {formatCurrency(item.quantity * item.price)}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addInvoiceItem}
                variant="outline"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Item
              </Button>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card title="Pricing Summary" variant="elevated">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formData.discount}%):</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                  {formData.taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                      <span className="font-medium">{formatCurrency(calculateTax())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Notes */}
          <Card title="Additional Information" variant="elevated">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or payment instructions..."
                rows={4}
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <Card variant="outline">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                Create Invoice
              </Button>
            </div>
          </Card>
        </form>

        {/* Quick Tips */}
        <Card title="Quick Tips" variant="outline">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Select the appropriate patient and set a reasonable due date for payment.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Add detailed descriptions for all services and items to avoid confusion.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Apply discounts and taxes as needed. The system will calculate totals automatically.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Include payment instructions or special notes in the additional notes section.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}
