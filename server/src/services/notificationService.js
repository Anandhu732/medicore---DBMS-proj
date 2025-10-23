import emailService from './emailService.js';
import { query } from '../config/database.js';

/**
 * Notification Service
 * Handles sending notifications for various events
 * Respects user notification preferences
 */

class NotificationService {
  /**
   * Check if user wants to receive notification for a specific event
   */
  async shouldNotify(userId, eventType) {
    try {
      const users = await query(
        'SELECT notification_preferences FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) return true; // Default: send all notifications

      const user = users[0];
      const preferences = user.notification_preferences ? JSON.parse(user.notification_preferences) : {};

      // If preferences exist, check specific event type
      // If not specified, default is true (send notification)
      return preferences[eventType] !== false;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // On error, default to sending
    }
  }

  /**
   * Send login notification
   */
  async notifyLogin(user, req) {
    try {
      if (!await this.shouldNotify(user.id, 'login')) {
        console.log(`⏭️  Skipping login notification for user ${user.id} (disabled in preferences)`);
        return { success: true, skipped: true };
      }

      const loginInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown',
      };

      return await emailService.sendLoginNotification(user, loginInfo);
    } catch (error) {
      console.error('Login notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send profile update notification
   */
  async notifyProfileUpdate(user, changes) {
    try {
      if (!await this.shouldNotify(user.id, 'profile_update')) {
        console.log(`⏭️  Skipping profile update notification for user ${user.id} (disabled in preferences)`);
        return { success: true, skipped: true };
      }

      return await emailService.sendProfileUpdateNotification(user, changes);
    } catch (error) {
      console.error('Profile update notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment notification
   */
  async notifyAppointment(patient, appointment, type = 'created') {
    try {
      const eventType = `appointment_${type}`;

      // For patients table, we need to check if they are linked to a user
      // For now, we'll send the notification anyway
      // In future, you could add a user_id field to patients table

      return await emailService.sendAppointmentNotification(patient, appointment, type);
    } catch (error) {
      console.error('Appointment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send billing notification
   */
  async notifyBilling(patient, invoice, type = 'created') {
    try {
      const eventType = type === 'created' ? 'billing_invoice_created' : 'billing_payment_received';

      return await emailService.sendBillingNotification(patient, invoice, type);
    } catch (error) {
      console.error('Billing notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment created notification
   */
  async notifyAppointmentCreated(patient, appointment) {
    return this.notifyAppointment(patient, appointment, 'created');
  }

  /**
   * Send appointment updated notification
   */
  async notifyAppointmentUpdated(patient, appointment) {
    return this.notifyAppointment(patient, appointment, 'updated');
  }

  /**
   * Send appointment cancelled notification
   */
  async notifyAppointmentCancelled(patient, appointment) {
    return this.notifyAppointment(patient, appointment, 'cancelled');
  }

  /**
   * Send invoice created notification
   */
  async notifyInvoiceCreated(patient, invoice) {
    return this.notifyBilling(patient, invoice, 'created');
  }

  /**
   * Send payment received notification
   */
  async notifyPaymentReceived(patient, invoice) {
    return this.notifyBilling(patient, invoice, 'payment');
  }
}

// Export singleton instance
export default new NotificationService();
