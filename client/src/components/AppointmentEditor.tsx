import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import Button from './Button';
import { api } from '@/utils/api';
import { useToast } from './Toast';
import { Appointment } from '@/utils/types';

interface AppointmentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  appointment?: Appointment | null;
  onSaved?: (saved: Appointment) => void;
}

const AppointmentEditor: React.FC<AppointmentEditorProps> = ({ isOpen, onClose, mode, appointment, onSaved }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    duration: '30',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (mode === 'edit' && appointment) {
      setForm({
        patientId: appointment.patientId || '',
        doctorId: appointment.doctorId || '',
        date: appointment.date || '',
        time: appointment.time || '',
        duration: String(appointment.duration || 30),
        reason: appointment.reason || '',
        notes: appointment.notes || '',
      });
    } else if (mode === 'add') {
      setForm({
        patientId: '', doctorId: '', date: '', time: '', duration: '30', reason: '', notes: ''
      });
    }
  }, [mode, appointment, isOpen]);

  const validate = () => {
    if (!form.patientId) return 'Please select a patient';
    if (!form.doctorId) return 'Please select a doctor';
    if (!form.date) return 'Please select a date';
    if (!form.time) return 'Please select time';
    if (!form.reason || !form.reason.trim()) return 'Please enter a reason';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const err = validate();
    if (err) {
      showToast(err, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: form.patientId,
        doctorId: form.doctorId,
        date: form.date,
        time: form.time,
        duration: parseInt(form.duration, 10),
        reason: form.reason.trim(),
        notes: form.notes.trim(),
      };

      if (mode === 'add') {
        const created = await api.appointments.create(payload);
        showToast('Appointment created successfully', 'success');
        onSaved?.(created as Appointment);
      } else {
        if (!appointment?.id) {
          throw new Error('Appointment ID is required for update');
        }
        const updated = await api.appointments.update(appointment.id, payload);
        showToast('Appointment updated successfully', 'success');
        onSaved?.(updated as Appointment);
      }

      onClose();
    } catch (error: unknown) {
      console.error('Save appointment error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save appointment';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Schedule New Appointment' : 'Edit Appointment'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={() => handleSubmit()} disabled={isSubmitting}>{mode === 'add' ? 'Schedule' : 'Update'}</Button>
        </>
      }
    >
      <form id="appointment-editor-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Patient and Doctor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Patient ID"
            placeholder="Enter patient ID (e.g., P001)"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            required
          />
          <Input
            label="Doctor ID"
            placeholder="Enter doctor ID (e.g., 2)"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            required
          />
        </div>

        {/* Date, Time, Duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Time"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
          <Select
            label="Duration"
            value={form.duration}
            onChange={(v) => setForm({ ...form, duration: v })}
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
            ]}
          />
        </div>

        {/* Reason */}
        <Input
          label="Reason for Visit"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="e.g., Routine checkup, Follow-up consultation"
          required
        />

        {/* Notes */}
        <Textarea
          label="Notes (Optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Additional notes or special requirements"
          rows={3}
        />

        {/* Info tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Appointment Tips:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• System will check for time conflicts automatically</li>
                <li>• Appointments cannot be scheduled in the past</li>
                <li>• Patient and doctor will receive confirmation notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentEditor;
