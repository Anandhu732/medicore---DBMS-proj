-- Email Verification and Notifications Schema Update
-- Add email verification and notification tracking tables

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Email Verification Codes Table
-- ============================================
CREATE TABLE IF NOT EXISTS `email_verification_codes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `type` ENUM('registration', 'email_change', 'password_reset') NOT NULL DEFAULT 'registration',
  `expires_at` TIMESTAMP NOT NULL,
  `verified` BOOLEAN DEFAULT FALSE,
  `verified_at` TIMESTAMP NULL,
  `attempts` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`user_id`, `email`),
  INDEX `idx_code` (`code`),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Email Notifications Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `template` VARCHAR(100) NOT NULL,
  `event_type` ENUM('login', 'profile_update', 'appointment_created', 'appointment_updated', 'appointment_cancelled', 'billing_invoice_created', 'billing_payment_received', 'password_reset', 'email_verification') NOT NULL,
  `status` ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  `sent_at` TIMESTAMP NULL,
  `error_message` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Add email verification fields to users table
-- ============================================
ALTER TABLE `users`
ADD COLUMN `email_verified` BOOLEAN DEFAULT FALSE AFTER `email`,
ADD COLUMN `email_verified_at` TIMESTAMP NULL AFTER `email_verified`,
ADD COLUMN `phone` VARCHAR(50) NULL AFTER `email_verified_at`,
ADD COLUMN `phone_verified` BOOLEAN DEFAULT FALSE AFTER `phone`,
ADD COLUMN `phone_verified_at` TIMESTAMP NULL AFTER `phone_verified`,
ADD COLUMN `notification_preferences` JSON NULL AFTER `phone_verified_at`;

-- ============================================
-- Add email verification fields to patients table
-- ============================================
ALTER TABLE `patients`
ADD COLUMN `email_verified` BOOLEAN DEFAULT FALSE AFTER `email`,
ADD COLUMN `email_verified_at` TIMESTAMP NULL AFTER `email_verified`,
ADD COLUMN `phone_verified` BOOLEAN DEFAULT FALSE AFTER `phone`,
ADD COLUMN `phone_verified_at` TIMESTAMP NULL AFTER `phone_verified`;

SET FOREIGN_KEY_CHECKS = 1;

-- Success message
SELECT 'Email verification and notifications schema updated successfully!' as message;
