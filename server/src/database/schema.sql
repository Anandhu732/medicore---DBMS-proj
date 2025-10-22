-- MediCore Hospital Management System Database Schema
-- Fixed for MySQL compatibility (2025)
-- Includes corrected FK constraints, nullability, and charset definitions

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Drop existing tables
-- ============================================
DROP TABLE IF EXISTS `logs`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `medical_record_attachments`;
DROP TABLE IF EXISTS `medical_record_lab_results`;
DROP TABLE IF EXISTS `medical_record_prescriptions`;
DROP TABLE IF EXISTS `medical_records`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `reports`;

-- ============================================
-- Users Table (Admin, Doctor, Receptionist)
-- ============================================
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'doctor', 'receptionist') NOT NULL DEFAULT 'doctor',
  `department` VARCHAR(100) NULL,
  `avatar` VARCHAR(500) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Patients Table
-- ============================================
CREATE TABLE `patients` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `age` INT NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `address` TEXT NOT NULL,
  `emergency_contact` VARCHAR(255) NOT NULL,
  `medical_history` JSON NULL,
  `status` ENUM('Active', 'Archived') DEFAULT 'Active',
  `registration_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_status` (`status`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Appointments Table
-- ============================================
CREATE TABLE `appointments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `patient_id` VARCHAR(50) NOT NULL,
  `doctor_id` VARCHAR(50) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `duration` INT NOT NULL COMMENT 'Duration in minutes',
  `status` ENUM('Scheduled', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Scheduled',
  `reason` VARCHAR(500) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_date` (`date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_patient` (`patient_id`),
  INDEX `idx_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Medical Records Table
-- ============================================
CREATE TABLE `medical_records` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `patient_id` VARCHAR(50) NOT NULL,
  `doctor_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `diagnosis` TEXT NOT NULL,
  `symptoms` JSON NULL,
  `notes` TEXT NULL,
  `version` INT DEFAULT 1,
  `updated_by` VARCHAR(50) NULL, -- fixed: now nullable to allow ON DELETE SET NULL
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_patient` (`patient_id`),
  INDEX `idx_doctor` (`doctor_id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Medical Record Prescriptions Table
-- ============================================
CREATE TABLE `medical_record_prescriptions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `medical_record_id` VARCHAR(50) NOT NULL,
  `medication` VARCHAR(255) NOT NULL,
  `dosage` VARCHAR(100) NOT NULL,
  `frequency` VARCHAR(100) NOT NULL,
  `duration` VARCHAR(100) NOT NULL,
  `instructions` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON DELETE CASCADE,
  INDEX `idx_medical_record` (`medical_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Medical Record Lab Results Table
-- ============================================
CREATE TABLE `medical_record_lab_results` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `medical_record_id` VARCHAR(50) NOT NULL,
  `test_name` VARCHAR(255) NOT NULL,
  `value` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `normal_range` VARCHAR(100) NOT NULL,
  `status` ENUM('Normal', 'Abnormal', 'Critical') DEFAULT 'Normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON DELETE CASCADE,
  INDEX `idx_medical_record` (`medical_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Medical Record Attachments Table
-- ============================================
CREATE TABLE `medical_record_attachments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `medical_record_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `size` BIGINT NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON DELETE CASCADE,
  INDEX `idx_medical_record` (`medical_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Invoices Table
-- ============================================
CREATE TABLE `invoices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `patient_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  `payment_method` VARCHAR(100) NULL,
  `paid_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  INDEX `idx_patient` (`patient_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Invoice Items Table
-- ============================================
CREATE TABLE `invoice_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `invoice_id` VARCHAR(50) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  INDEX `idx_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Reports Table
-- ============================================
CREATE TABLE `reports` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `report_type` VARCHAR(100) NOT NULL,
  `generated_by` VARCHAR(50) NOT NULL,
  `date_from` DATE NULL,
  `date_to` DATE NULL,
  `filters` JSON NULL,
  `file_url` VARCHAR(500) NULL,
  `status` ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_report_type` (`report_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Logs Table (Audit Trail)
-- ============================================
CREATE TABLE `logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NULL,
  `action` VARCHAR(100) NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `record_id` VARCHAR(50) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_table` (`table_name`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
