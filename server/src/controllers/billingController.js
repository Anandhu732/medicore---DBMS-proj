import { query } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { toCamelCase, toISOString } from '../utils/datetime.js';

/**
 * Billing/Invoice Controller
 *
 * TODO: Frontend Integration Points:
 * - GET /api/invoices - Called from client/src/app/billing/page.tsx
 * - GET /api/invoices/:id - Called when viewing invoice details
 * - POST /api/invoices - Called when creating new invoice
 * - PATCH /api/invoices/:id/payment - Called when recording payment
 */

export const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
    } = req.query;

    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(i.id LIKE ? OR p.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    if (status) {
      whereConditions.push('i.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM invoices i
       JOIN patients p ON i.patient_id = p.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const invoices = await query(
      `SELECT i.*, p.name as patient_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       ${whereClause}
       ORDER BY i.date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const transformedInvoices = [];

    for (const invoice of invoices) {
      const items = await query(
        'SELECT * FROM invoice_items WHERE invoice_id = ?',
        [invoice.id]
      );

      const transformed = toCamelCase(invoice);
      transformed.patientName = invoice.patient_name;
      transformed.items = items.map(item => toCamelCase(item));

      if (invoice.paid_at) {
        transformed.paidAt = toISOString(invoice.paid_at);
      }

      transformedInvoices.push(transformed);
    }

    return paginatedResponse(res, transformedInvoices, parseInt(page), parseInt(limit), total);

  } catch (error) {
    console.error('Get invoices error:', error);
    return errorResponse(res, 'Failed to retrieve invoices', 500);
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoices = await query(
      `SELECT i.*, p.name as patient_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       WHERE i.id = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const invoice = invoices[0];

    const items = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [id]
    );

    const transformed = toCamelCase(invoice);
    transformed.patientName = invoice.patient_name;
    transformed.items = items.map(item => toCamelCase(item));

    if (invoice.paid_at) {
      transformed.paidAt = toISOString(invoice.paid_at);
    }

    return successResponse(res, transformed, 'Invoice retrieved successfully');

  } catch (error) {
    console.error('Get invoice error:', error);
    return errorResponse(res, 'Failed to retrieve invoice', 500);
  }
};

export const createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      date,
      dueDate,
      items = [],
    } = req.body;

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

    const countResult = await query('SELECT COUNT(*) as count FROM invoices');
    const count = countResult[0].count;
    const invoiceId = `INV${String(count + 1).padStart(3, '0')}`;

    await query(
      `INSERT INTO invoices (id, patient_id, date, due_date, total_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, patientId, date, dueDate, totalAmount, 0, 'pending']
    );

    // Insert invoice items
    for (const item of items) {
      const itemCountResult = await query('SELECT COUNT(*) as count FROM invoice_items');
      const itemCount = itemCountResult[0].count;
      const itemId = `ITEM${String(itemCount + 1).padStart(3, '0')}`;

      await query(
        `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, price, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, invoiceId, item.description, item.category || 'General', item.quantity, item.price, item.total]
      );
    }

    // Fetch created invoice
    const invoices = await query(
      `SELECT i.*, p.name as patient_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       WHERE i.id = ?`,
      [invoiceId]
    );

    const invoice = invoices[0];
    const createdItems = await query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    const transformed = toCamelCase(invoice);
    transformed.patientName = invoice.patient_name;
    transformed.items = createdItems.map(item => toCamelCase(item));

    return successResponse(res, transformed, 'Invoice created successfully', 201);

  } catch (error) {
    console.error('Create invoice error:', error);
    return errorResponse(res, 'Failed to create invoice', 500);
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'Cash' } = req.body;

    const invoices = await query('SELECT * FROM invoices WHERE id = ?', [id]);

    if (invoices.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const invoice = invoices[0];
    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
    const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) ? 'paid' : 'pending';
    const paidAt = newStatus === 'paid' ? new Date().toISOString() : null;

    await query(
      `UPDATE invoices
       SET paid_amount = ?, status = ?, payment_method = ?, paid_at = ?
       WHERE id = ?`,
      [newPaidAmount, newStatus, paymentMethod, paidAt, id]
    );

    const updated = await query(
      `SELECT i.*, p.name as patient_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       WHERE i.id = ?`,
      [id]
    );

    const items = await query('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);

    const transformed = toCamelCase(updated[0]);
    transformed.patientName = updated[0].patient_name;
    transformed.items = items.map(item => toCamelCase(item));

    if (paidAt) {
      transformed.paidAt = paidAt;
    }

    return successResponse(res, transformed, 'Payment recorded successfully');

  } catch (error) {
    console.error('Record payment error:', error);
    return errorResponse(res, 'Failed to record payment', 500);
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['paid', 'pending', 'overdue'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    await query('UPDATE invoices SET status = ? WHERE id = ?', [status, id]);

    return successResponse(res, { id, status }, 'Invoice status updated successfully');

  } catch (error) {
    console.error('Update invoice status error:', error);
    return errorResponse(res, 'Failed to update invoice status', 500);
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM invoices WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    await query('DELETE FROM invoices WHERE id = ?', [id]);

    return successResponse(res, null, 'Invoice deleted successfully');

  } catch (error) {
    console.error('Delete invoice error:', error);
    return errorResponse(res, 'Failed to delete invoice', 500);
  }
};

export default {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  updateInvoiceStatus,
  deleteInvoice,
};
