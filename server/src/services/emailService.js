import nodemailer from 'nodemailer';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Email Service
 * Handles all email sending and notification management
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   * Uses environment variables for configuration
   */
  initializeTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // For development/testing without real SMTP
    if (!process.env.SMTP_USER) {
      console.warn('⚠️  SMTP credentials not configured. Email notifications will be simulated.');
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Simulate email sending
      });
    } else {
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  /**
   * Generate verification code (6-digit)
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store verification code in database
   */
  async storeVerificationCode(userId, email, type = 'registration') {
    const code = this.generateVerificationCode();
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      `INSERT INTO email_verification_codes (id, user_id, email, code, type, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, email, code, type, expiresAt]
    );

    return { id, code, expiresAt };
  }

  /**
   * Verify code
   */
  async verifyCode(userId, code) {
    const codes = await query(
      `SELECT * FROM email_verification_codes
       WHERE user_id = ? AND code = ? AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );

    if (codes.length === 0) {
      // Update attempts
      await query(
        `UPDATE email_verification_codes
         SET attempts = attempts + 1
         WHERE user_id = ? AND code = ?`,
        [userId, code]
      );
      return { success: false, message: 'Invalid or expired verification code' };
    }

    const verificationCode = codes[0];

    // Mark as verified
    await query(
      `UPDATE email_verification_codes
       SET verified = TRUE, verified_at = NOW()
       WHERE id = ?`,
      [verificationCode.id]
    );

    // Update user email verification status
    await query(
      `UPDATE users
       SET email_verified = TRUE, email_verified_at = NOW()
       WHERE id = ?`,
      [userId]
    );

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Log email notification
   */
  async logNotification(data) {
    const id = uuidv4();
    const { userId, recipientEmail, subject, template, eventType, metadata, status = 'pending' } = data;

    await query(
      `INSERT INTO email_notifications (id, user_id, recipient_email, subject, template, event_type, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, recipientEmail, subject, template, eventType, status, JSON.stringify(metadata || {})]
    );

    return id;
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(notificationId, status, errorMessage = null) {
    await query(
      `UPDATE email_notifications
       SET status = ?, sent_at = NOW(), error_message = ?
       WHERE id = ?`,
      [status, errorMessage, notificationId]
    );
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text, template, eventType, userId, metadata }) {
    try {
      // Log notification
      const notificationId = await this.logNotification({
        userId,
        recipientEmail: to,
        subject,
        template: template || 'generic',
        eventType,
        metadata,
        status: 'pending',
      });

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'MediCore Hospital'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      // Update notification status
      await this.updateNotificationStatus(notificationId, 'sent');

      console.log('✅ Email sent:', info.messageId || 'simulated');
      return { success: true, messageId: info.messageId, notificationId };
    } catch (error) {
      console.error('❌ Email send error:', error);

      if (metadata?.notificationId) {
        await this.updateNotificationStatus(metadata.notificationId, 'failed', error.message);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Email Templates
   */

  async sendVerificationEmail(user, code) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; text-align: center; padding: 20px; background: white; border: 2px dashed #2563eb; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MediCore Hospital</h1>
          </div>
          <div class="content">
            <h2>Email Verification</h2>
            <p>Hello ${user.name},</p>
            <p>Thank you for registering with MediCore Hospital Management System. Please use the verification code below to verify your email address:</p>
            <div class="code">${code}</div>
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 MediCore Hospital. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - MediCore Hospital',
      html,
      text: `Your verification code is: ${code}. This code expires in 15 minutes.`,
      template: 'email_verification',
      eventType: 'email_verification',
      userId: user.id,
      metadata: { userName: user.name, userRole: user.role },
    });
  }

  async sendLoginNotification(user, loginInfo) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MediCore Hospital</h1>
          </div>
          <div class="content">
            <h2>New Login Detected</h2>
            <p>Hello ${user.name},</p>
            <p>We detected a new login to your account:</p>
            <div class="info-box">
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>IP Address:</strong> ${loginInfo.ipAddress || 'Unknown'}</p>
              <p><strong>Device:</strong> ${loginInfo.userAgent || 'Unknown'}</p>
            </div>
            <p>If this wasn't you, please secure your account immediately.</p>
          </div>
          <div class="footer">
            <p>© 2025 MediCore Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'New Login to Your Account - MediCore Hospital',
      html,
      text: `New login detected at ${new Date().toLocaleString()}`,
      template: 'login_notification',
      eventType: 'login',
      userId: user.id,
      metadata: loginInfo,
    });
  }

  async sendProfileUpdateNotification(user, changes) {
    const changedFields = Object.keys(changes).join(', ');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MediCore Hospital</h1>
          </div>
          <div class="content">
            <h2>Profile Updated</h2>
            <p>Hello ${user.name},</p>
            <p>Your profile has been updated. The following fields were changed:</p>
            <p><strong>${changedFields}</strong></p>
            <p>If you didn't make these changes, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>© 2025 MediCore Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Profile Updated - MediCore Hospital',
      html,
      text: `Your profile has been updated. Changed fields: ${changedFields}`,
      template: 'profile_update',
      eventType: 'profile_update',
      userId: user.id,
      metadata: { changes },
    });
  }

  async sendAppointmentNotification(patient, appointment, type = 'created') {
    const titles = {
      created: 'Appointment Scheduled',
      updated: 'Appointment Updated',
      cancelled: 'Appointment Cancelled',
    };

    const colors = {
      created: '#10b981',
      updated: '#f59e0b',
      cancelled: '#ef4444',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${colors[type]}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .appointment-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid ${colors[type]}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MediCore Hospital</h1>
          </div>
          <div class="content">
            <h2>${titles[type]}</h2>
            <p>Dear ${patient.name},</p>
            <div class="appointment-box">
              <p><strong>Appointment ID:</strong> ${appointment.id}</p>
              <p><strong>Date:</strong> ${appointment.date}</p>
              <p><strong>Time:</strong> ${appointment.time}</p>
              <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
              <p><strong>Department:</strong> ${appointment.department}</p>
              <p><strong>Status:</strong> ${appointment.status}</p>
            </div>
            <p>If you have any questions, please contact our reception.</p>
          </div>
          <div class="footer">
            <p>© 2025 MediCore Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: patient.email,
      subject: `${titles[type]} - MediCore Hospital`,
      html,
      text: `${titles[type]}: ${appointment.date} at ${appointment.time} with Dr. ${appointment.doctorName}`,
      template: 'appointment_notification',
      eventType: `appointment_${type}`,
      userId: patient.id,
      metadata: { appointmentId: appointment.id, type },
    });
  }

  async sendBillingNotification(patient, invoice, type = 'created') {
    const titles = {
      created: 'New Invoice Created',
      payment: 'Payment Received',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .invoice-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MediCore Hospital</h1>
          </div>
          <div class="content">
            <h2>${titles[type]}</h2>
            <p>Dear ${patient.name},</p>
            <div class="invoice-box">
              <p><strong>Invoice ID:</strong> ${invoice.id}</p>
              <p><strong>Date:</strong> ${invoice.date}</p>
              <p><strong>Total Amount:</strong> $${invoice.totalAmount}</p>
              <p><strong>Paid Amount:</strong> $${invoice.paidAmount}</p>
              <p><strong>Balance:</strong> $${invoice.totalAmount - invoice.paidAmount}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
            <p>You can view and pay your invoice by logging into your account.</p>
          </div>
          <div class="footer">
            <p>© 2025 MediCore Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: patient.email,
      subject: `${titles[type]} - MediCore Hospital`,
      html,
      text: `${titles[type]}: Invoice ${invoice.id} - Total: $${invoice.totalAmount}`,
      template: 'billing_notification',
      eventType: type === 'created' ? 'billing_invoice_created' : 'billing_payment_received',
      userId: patient.id,
      metadata: { invoiceId: invoice.id, type },
    });
  }
}

// Export singleton instance
export default new EmailService();
