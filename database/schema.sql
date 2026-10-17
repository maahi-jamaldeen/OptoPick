-- OptoPick Database Schema
-- Client: Indian Optician, Main Street, Nintavur, Sri Lanka
-- Engine: MySQL 8.0+ / MariaDB (XAMPP Compatible)

CREATE DATABASE IF NOT EXISTS `optopick_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `optopick_db`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users table (Administrator / Optometrist and Optical Staff)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('ADMIN', 'STAFF') NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
  `reset_token_hash` VARCHAR(255) NULL,
  `reset_token_expires_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customers table
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `age` INT NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `occupation` VARCHAR(100) NULL,
  `preferences_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_phone` (`phone_number`),
  INDEX `idx_customers_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2B. Customer Profile History table (Demographic evolution & audit trail)
DROP TABLE IF EXISTS `customer_profile_history`;
CREATE TABLE `customer_profile_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `changed_by_user_id` INT NULL,
  `changed_by_name` VARCHAR(100) NULL,
  `previous_full_name` VARCHAR(100) NULL,
  `previous_phone_number` VARCHAR(20) NULL,
  `previous_email` VARCHAR(100) NULL,
  `previous_address` TEXT NULL,
  `previous_age` INT NULL,
  `previous_gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `previous_occupation` VARCHAR(100) NULL,
  `previous_preferences_notes` TEXT NULL,
  `change_reason` VARCHAR(255) DEFAULT 'Returning patient profile update',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  INDEX `idx_hist_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Eye Examinations table
DROP TABLE IF EXISTS `examinations`;
CREATE TABLE `examinations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `examiner_id` INT NOT NULL,
  `exam_date` DATE NOT NULL,
  `clinical_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`examiner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_exam_customer_date` (`customer_id`, `exam_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Prescriptions table
DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE `prescriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `examination_id` INT NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `od_sph` DECIMAL(4,2) NOT NULL,
  `od_cyl` DECIMAL(4,2) DEFAULT 0.00 NOT NULL,
  `od_axis` INT DEFAULT 0 NOT NULL,
  `od_add` DECIMAL(3,2) DEFAULT 0.00 NULL,
  `os_sph` DECIMAL(4,2) NOT NULL,
  `os_cyl` DECIMAL(4,2) DEFAULT 0.00 NOT NULL,
  `os_axis` INT DEFAULT 0 NOT NULL,
  `os_add` DECIMAL(3,2) DEFAULT 0.00 NULL,
  `pd` DECIMAL(3,1) NOT NULL,
  `is_latest` BOOLEAN DEFAULT TRUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`examination_id`) REFERENCES `examinations`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  INDEX `idx_prescriptions_customer` (`customer_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Suppliers table
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supplier_code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
  `credit_terms` VARCHAR(100) DEFAULT 'Net 30 Days credit settlement from date of physical Goods Receipt at Nintavur',
  `settlement_method` VARCHAR(100) DEFAULT 'Direct Electronic Bank Transfer (Commercial Bank / HNB Sri Lanka)',
  `lead_time` VARCHAR(100) DEFAULT '2 to 3 Business Days via standard courier delivery to Indian Optician',
  `warranty_terms` VARCHAR(255) DEFAULT '12 months frame hinge warranty; 6 months hard multi-coating guarantee on lenses',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Frames table
DROP TABLE IF EXISTS `frames`;
CREATE TABLE `frames` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `frame_code` VARCHAR(30) NOT NULL UNIQUE,
  `brand` VARCHAR(50) NOT NULL,
  `model_name` VARCHAR(50) NOT NULL,
  `shape` VARCHAR(30) NOT NULL,
  `color` VARCHAR(30) NOT NULL,
  `material` VARCHAR(30) NOT NULL,
  `size` VARCHAR(20) NOT NULL,
  `selling_price` DECIMAL(10,2) NOT NULL,
  `supplier_id` INT NOT NULL,
  `stock_quantity` INT DEFAULT 0 NOT NULL,
  `low_stock_threshold` INT DEFAULT 2 NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT,
  INDEX `idx_frames_brand` (`brand`),
  INDEX `idx_frames_stock` (`stock_quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Lenses table (with supported Rx ranges for LensIQ)
DROP TABLE IF EXISTS `lenses`;
CREATE TABLE `lenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lens_code` VARCHAR(30) NOT NULL UNIQUE,
  `brand` VARCHAR(50) NOT NULL,
  `design_type` ENUM('SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE') NOT NULL,
  `material` VARCHAR(30) NOT NULL,
  `refractive_index` DECIMAL(3,2) NOT NULL,
  `coatings` VARCHAR(100) NOT NULL,
  `min_sph` DECIMAL(4,2) NOT NULL,
  `max_sph` DECIMAL(4,2) NOT NULL,
  `min_cyl` DECIMAL(4,2) NOT NULL,
  `max_cyl` DECIMAL(4,2) NOT NULL,
  `min_add` DECIMAL(3,2) DEFAULT 0.00 NULL,
  `max_add` DECIMAL(3,2) DEFAULT 0.00 NULL,
  `selling_price` DECIMAL(10,2) NOT NULL,
  `supplier_id` INT NOT NULL,
  `stock_quantity` INT DEFAULT 0 NOT NULL,
  `low_stock_threshold` INT DEFAULT 2 NOT NULL,
  `is_available` BOOLEAN DEFAULT TRUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT,
  INDEX `idx_lenses_power_range` (`min_sph`, `max_sph`, `min_cyl`, `max_cyl`),
  INDEX `idx_lenses_design` (`design_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Accessories table
DROP TABLE IF EXISTS `accessories`;
CREATE TABLE `accessories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `selling_price` DECIMAL(10,2) NOT NULL,
  `supplier_id` INT NOT NULL,
  `stock_quantity` INT DEFAULT 0 NOT NULL,
  `low_stock_threshold` INT DEFAULT 5 NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Sales / Orders table
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_number` VARCHAR(30) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `prescription_id` INT NULL,
  `user_id` INT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  `balance_amount` DECIMAL(10,2) NOT NULL,
  `payment_status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID') NOT NULL,
  `order_status` ENUM('ORDER_PLACED', 'DISPATCHED_TO_LAB', 'RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION', 'COLLECTED', 'CANCELLED') NOT NULL,
  `order_type` ENUM('IMMEDIATE_SALE', 'CUSTOM_FITTING_ORDER') NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_sales_order_status` (`order_status`),
  INDEX `idx_sales_payment_status` (`payment_status`),
  INDEX `idx_sales_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Sale Items table
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `item_type` ENUM('FRAME', 'LENS', 'ACCESSORY') NOT NULL,
  `product_id` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  INDEX `idx_sale_items_product` (`item_type`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Payments table
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_number` VARCHAR(30) NOT NULL UNIQUE,
  `sale_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('CASH', 'CARD', 'BANK_TRANSFER') NOT NULL,
  `payment_type` ENUM('ADVANCE', 'BALANCE', 'FULL') NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_payments_sale` (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Inventory Movements ledger
DROP TABLE IF EXISTS `inventory_movements`;
CREATE TABLE `inventory_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_type` ENUM('FRAME', 'LENS', 'ACCESSORY') NOT NULL,
  `product_id` INT NOT NULL,
  `movement_type` ENUM('STOCK_IN', 'SALE_DEDUCTION', 'RETURN_RESTOCK', 'ADJUSTMENT', 'DEFECTIVE_WRITE_OFF') NOT NULL,
  `quantity_change` INT NOT NULL,
  `previous_quantity` INT NOT NULL,
  `new_quantity` INT NOT NULL,
  `reference_sale_id` INT NULL,
  `user_id` INT NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`reference_sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_movements_product` (`product_type`, `product_id`),
  INDEX `idx_movements_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Communications table (OptoRecall, Reminders)
DROP TABLE IF EXISTS `communications`;
CREATE TABLE `communications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `related_sale_id` INT NULL,
  `comm_type` ENUM('ORDER_READY', 'ANNUAL_REVIEW_RECALL', 'LAPSED_RETENTION', 'PROMOTIONAL') NOT NULL,
  `channel` ENUM('EMAIL', 'SMS_DRAFT') NOT NULL,
  `recipient_contact` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message_body` TEXT NOT NULL,
  `status` ENUM('DRAFT_PENDING_APPROVAL', 'APPROVED', 'DISPATCHED', 'FAILED') NOT NULL,
  `approved_by_user_id` INT NULL,
  `dispatched_at` DATETIME NULL,
  `delivery_error` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`related_sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_comm_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. AI Logs table
DROP TABLE IF EXISTS `ai_logs`;
CREATE TABLE `ai_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module_name` ENUM('LENSIQ', 'OPTOFORECAST', 'OPTORECALL') NOT NULL,
  `user_id` INT NOT NULL,
  `prompt_summary` TEXT NOT NULL,
  `raw_response` JSON NOT NULL,
  `validation_status` ENUM('VALID', 'SCHEMA_FAILED', 'FALLBACK_USED') NOT NULL,
  `response_time_ms` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Audit Logs table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `ip_address` VARCHAR(45) NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. System Settings table
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
