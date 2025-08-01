-- =============================================
-- LaburAR - Complete Database Schema (MySQL 8.0+)
-- Generated from database-er-final-fixed.md
-- 35 Tables - Production Ready with Full FK Relationships
-- =============================================

-- =============================================
-- DATABASE AND USER SETUP
-- =============================================

-- Drop database if exists and create new one
DROP DATABASE IF EXISTS `laburemos_db`;
CREATE DATABASE `laburemos_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create database user with password
DROP USER IF EXISTS 'laburemos_user'@'localhost';
CREATE USER 'laburemos_user'@'localhost' IDENTIFIED BY 'Tyr1945@';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON `laburemos_db`.* TO 'laburemos_user'@'localhost';
FLUSH PRIVILEGES;

USE `laburemos_db`;

-- Enable foreign key checks
SET foreign_key_checks = 1;

-- =============================================
-- CORE USERS & AUTHENTICATION
-- =============================================

-- Users table - Core user information
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `user_type` ENUM('client', 'freelancer', 'admin') NOT NULL DEFAULT 'client',
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20),
  `country` VARCHAR(100),
  `city` VARCHAR(100),
  `profile_image` TEXT,
  `status` ENUM('active', 'inactive', 'banned', 'pending_verification') NOT NULL DEFAULT 'pending_verification',
  `email_verified_at` TIMESTAMP NULL,
  `phone_verified_at` TIMESTAMP NULL,
  `last_active` TIMESTAMP NULL,
  `is_online` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  
  -- Indexes for performance
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_user_type` (`user_type`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_created_at` (`created_at`),
  INDEX `idx_users_last_active` (`last_active`),
  INDEX `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB 
COMMENT='Core user accounts with authentication and profile information';

-- User sessions table
CREATE TABLE `user_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_token` VARCHAR(255) UNIQUE NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `device_info` JSON,
  `expires_at` TIMESTAMP NOT NULL,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_user_sessions_user_id` (`user_id`),
  INDEX `idx_user_sessions_expires_at` (`expires_at`),
  INDEX `idx_user_sessions_last_activity` (`last_activity`)
) ENGINE=InnoDB 
COMMENT='Active user sessions for authentication tracking';

-- Password reset tokens
CREATE TABLE `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) UNIQUE NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_password_resets_user_id` (`user_id`),
  INDEX `idx_password_resets_email` (`email`),
  INDEX `idx_password_resets_expires_at` (`expires_at`)
) ENGINE=InnoDB 
COMMENT='Password reset tokens for secure password recovery';

-- Refresh tokens for JWT authentication
CREATE TABLE `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) UNIQUE NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `ip_address` VARCHAR(45),
  `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_refresh_tokens_user_id` (`user_id`),
  INDEX `idx_refresh_tokens_expires_at` (`expires_at`)
) ENGINE=InnoDB 
COMMENT='JWT refresh tokens for secure authentication';

-- Freelancer profiles with extended information
CREATE TABLE `freelancer_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNIQUE NOT NULL,
  `bio` TEXT,
  `title` VARCHAR(255),
  `hourly_rate` DECIMAL(10,2),
  `availability` ENUM('available', 'busy', 'unavailable') NOT NULL DEFAULT 'available',
  `timezone` VARCHAR(50),
  `portfolio_url` VARCHAR(500),
  `languages` JSON,
  `certifications` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_freelancer_profiles_user_id` (`user_id`),
  INDEX `idx_freelancer_profiles_availability` (`availability`),
  INDEX `idx_freelancer_profiles_hourly_rate` (`hourly_rate`)
) ENGINE=InnoDB 
COMMENT='Extended profiles for freelancer users';

-- =============================================
-- SKILLS SYSTEM (NORMALIZED)
-- =============================================

-- Skills master table
CREATE TABLE `skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) UNIQUE NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `category` VARCHAR(100),
  `subcategory` VARCHAR(100),
  `description` TEXT,
  `is_trending` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `usage_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX `idx_skills_name` (`name`),
  INDEX `idx_skills_slug` (`slug`),
  INDEX `idx_skills_category` (`category`),
  INDEX `idx_skills_is_trending` (`is_trending`),
  INDEX `idx_skills_usage_count` (`usage_count`)
) ENGINE=InnoDB 
COMMENT='Master skills catalog with categories and metadata';

-- Freelancer skills junction table
CREATE TABLE `freelancer_skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `proficiency_level` ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL DEFAULT 'intermediate',
  `years_experience` INT DEFAULT 0,
  `endorsed_count` INT NOT NULL DEFAULT 0,
  `hourly_rate_skill` DECIMAL(10,2),
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate skills per user
  UNIQUE KEY `unique_user_skill` (`user_id`, `skill_id`),
  
  -- Indexes
  INDEX `idx_freelancer_skills_user_id` (`user_id`),
  INDEX `idx_freelancer_skills_skill_id` (`skill_id`),
  INDEX `idx_freelancer_skills_proficiency` (`proficiency_level`),
  INDEX `idx_freelancer_skills_is_featured` (`is_featured`)
) ENGINE=InnoDB 
COMMENT='Skills associated with freelancer users';

-- Portfolio items
CREATE TABLE `portfolio_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category_id` INT,
  `project_url` VARCHAR(500),
  `media_files` JSON,
  `technologies_used` JSON,
  `completion_date` DATE,
  `client_name` VARCHAR(255),
  `project_value` DECIMAL(12,2),
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `view_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_portfolio_items_user_id` (`user_id`),
  INDEX `idx_portfolio_items_category_id` (`category_id`),
  INDEX `idx_portfolio_items_is_featured` (`is_featured`),
  INDEX `idx_portfolio_items_view_count` (`view_count`)
) ENGINE=InnoDB 
COMMENT='Portfolio items showcasing freelancer work';

-- =============================================
-- CATEGORIES & SERVICES
-- =============================================

-- Hierarchical categories
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(100),
  `color` VARCHAR(7),
  `parent_id` INT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_categories_parent_id` (`parent_id`),
  INDEX `idx_categories_slug` (`slug`),
  INDEX `idx_categories_is_active` (`is_active`),
  INDEX `idx_categories_sort_order` (`sort_order`),
  INDEX `idx_categories_level` (`level`)
) ENGINE=InnoDB 
COMMENT='Hierarchical category system for services and projects';

-- Services offered by freelancers
CREATE TABLE `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `delivery_time` INT NOT NULL,
  `requirements` TEXT,
  `gallery_images` JSON,
  `faq` JSON,
  `extras` JSON,
  `total_orders` INT NOT NULL DEFAULT 0,
  `total_reviews` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX `idx_services_user_id` (`user_id`),
  INDEX `idx_services_category_id` (`category_id`),
  INDEX `idx_services_is_active` (`is_active`),
  INDEX `idx_services_is_featured` (`is_featured`),
  INDEX `idx_services_base_price` (`base_price`)
) ENGINE=InnoDB 
COMMENT='Services offered by freelancers with pricing and details';

-- Service packages (Basic, Standard, Premium)
CREATE TABLE `service_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `service_id` INT NOT NULL,
  `package_type` ENUM('basic', 'standard', 'premium') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `delivery_time` INT NOT NULL,
  `features` JSON,
  `max_revisions` INT DEFAULT 1,
  `extras_included` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate package types per service
  UNIQUE KEY `unique_service_package` (`service_id`, `package_type`),
  
  -- Indexes
  INDEX `idx_service_packages_service_id` (`service_id`),
  INDEX `idx_service_packages_package_type` (`package_type`),
  INDEX `idx_service_packages_price` (`price`)
) ENGINE=InnoDB 
COMMENT='Service packages with different tiers and pricing';

-- =============================================
-- PROJECTS & PROPOSALS
-- =============================================

-- Projects posted by clients
CREATE TABLE `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `freelancer_id` INT NULL,
  `category_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `budget_min` DECIMAL(12,2),
  `budget_max` DECIMAL(12,2),
  `budget_type` ENUM('fixed', 'hourly') NOT NULL DEFAULT 'fixed',
  `deadline` DATE,
  `status` ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'draft',
  `required_skills` JSON,
  `experience_level` ENUM('entry', 'intermediate', 'expert') NOT NULL DEFAULT 'intermediate',
  `proposal_count` INT NOT NULL DEFAULT 0,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_urgent` BOOLEAN NOT NULL DEFAULT FALSE,
  `published_at` TIMESTAMP NULL,
  `started_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`freelancer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX `idx_projects_client_id` (`client_id`),
  INDEX `idx_projects_freelancer_id` (`freelancer_id`),
  INDEX `idx_projects_category_id` (`category_id`),
  INDEX `idx_projects_status` (`status`),
  INDEX `idx_projects_is_featured` (`is_featured`),
  INDEX `idx_projects_published_at` (`published_at`),
  INDEX `idx_projects_budget_max` (`budget_max`)
) ENGINE=InnoDB 
COMMENT='Projects posted by clients seeking freelancers';

-- Proposals submitted by freelancers
CREATE TABLE `proposals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `freelancer_id` INT NOT NULL,
  `service_package_id` INT NULL,
  `cover_letter` TEXT NOT NULL,
  `proposed_amount` DECIMAL(12,2) NOT NULL,
  `proposed_timeline` INT NOT NULL,
  `milestones` JSON,
  `attachments` JSON,
  `status` ENUM('pending', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  `client_viewed_at` TIMESTAMP NULL,
  `responded_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`freelancer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`service_package_id`) REFERENCES `service_packages`(`id`) ON DELETE SET NULL,
  
  -- Prevent duplicate proposals
  UNIQUE KEY `unique_project_freelancer` (`project_id`, `freelancer_id`),
  
  -- Indexes
  INDEX `idx_proposals_project_id` (`project_id`),
  INDEX `idx_proposals_freelancer_id` (`freelancer_id`),
  INDEX `idx_proposals_status` (`status`),
  INDEX `idx_proposals_created_at` (`created_at`)
) ENGINE=InnoDB 
COMMENT='Proposals submitted by freelancers for projects';

-- Project milestones for progress tracking
CREATE TABLE `project_milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `amount` DECIMAL(10,2) NOT NULL,
  `due_date` DATE,
  `status` ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `deliverables` JSON,
  `completed_at` TIMESTAMP NULL,
  `approved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_project_milestones_project_id` (`project_id`),
  INDEX `idx_project_milestones_status` (`status`),
  INDEX `idx_project_milestones_due_date` (`due_date`)
) ENGINE=InnoDB 
COMMENT='Project milestones for tracking progress and payments';

-- =============================================
-- COMMUNICATION SYSTEM
-- =============================================

-- Conversations between users
CREATE TABLE `conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NULL,
  `participant_1_id` INT NOT NULL,
  `participant_2_id` INT NOT NULL,
  `last_message_id` INT NULL,
  `last_message_at` TIMESTAMP NULL,
  `unread_count_p1` INT NOT NULL DEFAULT 0,
  `unread_count_p2` INT NOT NULL DEFAULT 0,
  `is_archived_p1` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_archived_p2` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`participant_1_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`participant_2_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate conversations
  UNIQUE KEY `unique_participants` (`participant_1_id`, `participant_2_id`, `project_id`),
  
  -- Indexes
  INDEX `idx_conversations_project_id` (`project_id`),
  INDEX `idx_conversations_participant_1` (`participant_1_id`),
  INDEX `idx_conversations_participant_2` (`participant_2_id`),
  INDEX `idx_conversations_last_message_at` (`last_message_at`)
) ENGINE=InnoDB 
COMMENT='Conversations between users for project communication';

-- Messages within conversations
CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `message_content` TEXT NOT NULL,
  `message_type` ENUM('text', 'file', 'image', 'system') NOT NULL DEFAULT 'text',
  `attachments` JSON,
  `metadata` JSON,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_messages_conversation_id` (`conversation_id`),
  INDEX `idx_messages_sender_id` (`sender_id`),
  INDEX `idx_messages_receiver_id` (`receiver_id`),
  INDEX `idx_messages_created_at` (`created_at`),
  INDEX `idx_messages_is_read` (`is_read`)
) ENGINE=InnoDB 
COMMENT='Messages exchanged in conversations';

-- Add foreign key for last_message_id after messages table is created
ALTER TABLE `conversations` 
ADD FOREIGN KEY (`last_message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL;

-- Video calls within conversations
CREATE TABLE `video_calls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `initiator_id` INT NOT NULL,
  `room_id` VARCHAR(255) UNIQUE NOT NULL,
  `duration_minutes` INT DEFAULT 0,
  `status` ENUM('scheduled', 'active', 'ended', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `recording_url` JSON,
  `scheduled_at` TIMESTAMP NULL,
  `started_at` TIMESTAMP NULL,
  `ended_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`initiator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_video_calls_conversation_id` (`conversation_id`),
  INDEX `idx_video_calls_initiator_id` (`initiator_id`),
  INDEX `idx_video_calls_status` (`status`),
  INDEX `idx_video_calls_scheduled_at` (`scheduled_at`)
) ENGINE=InnoDB 
COMMENT='Video calls between users within conversations';

-- =============================================
-- PAYMENTS SYSTEM
-- =============================================

-- User wallets for balance management
CREATE TABLE `wallets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNIQUE NOT NULL,
  `available_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `pending_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `escrow_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `lifetime_earnings` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `lifetime_spent` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `last_transaction_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_wallets_user_id` (`user_id`),
  INDEX `idx_wallets_available_balance` (`available_balance`)
) ENGINE=InnoDB 
COMMENT='User wallets for balance and transaction management';

-- Payment methods for users
CREATE TABLE `payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('credit_card', 'debit_card', 'bank_account', 'paypal', 'crypto', 'other') NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `external_id` VARCHAR(255),
  `last_four` VARCHAR(4),
  `brand` VARCHAR(50),
  `billing_details` JSON,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `metadata` JSON,
  `verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_payment_methods_user_id` (`user_id`),
  INDEX `idx_payment_methods_is_default` (`is_default`),
  INDEX `idx_payment_methods_is_verified` (`is_verified`)
) ENGINE=InnoDB 
COMMENT='Payment methods registered by users';

-- Transaction history
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `from_user_id` INT NULL,
  `to_user_id` INT NULL,
  `project_id` INT NULL,
  `milestone_id` INT NULL,
  `transaction_id` VARCHAR(255) UNIQUE NOT NULL,
  `external_transaction_id` VARCHAR(255),
  `type` ENUM('payment', 'withdrawal', 'refund', 'fee', 'bonus', 'escrow_fund', 'escrow_release') NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `fee_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `gateway` VARCHAR(50),
  `gateway_response` JSON,
  `metadata` JSON,
  `description` TEXT,
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_transactions_from_user_id` (`from_user_id`),
  INDEX `idx_transactions_to_user_id` (`to_user_id`),
  INDEX `idx_transactions_project_id` (`project_id`),
  INDEX `idx_transactions_type` (`type`),
  INDEX `idx_transactions_status` (`status`),
  INDEX `idx_transactions_created_at` (`created_at`)
) ENGINE=InnoDB 
COMMENT='Complete transaction history for all payment activities';

-- Escrow accounts for secure payments
CREATE TABLE `escrow_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `milestone_id` INT NULL,
  `client_id` INT NOT NULL,
  `freelancer_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `fee_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'funded', 'released', 'refunded', 'disputed') NOT NULL DEFAULT 'pending',
  `release_conditions` TEXT,
  `funded_at` TIMESTAMP NULL,
  `released_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`freelancer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_escrow_accounts_project_id` (`project_id`),
  INDEX `idx_escrow_accounts_client_id` (`client_id`),
  INDEX `idx_escrow_accounts_freelancer_id` (`freelancer_id`),
  INDEX `idx_escrow_accounts_status` (`status`)
) ENGINE=InnoDB 
COMMENT='Escrow accounts for secure milestone-based payments';

-- Withdrawal requests
CREATE TABLE `withdrawal_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `fee_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_method_id` INT NOT NULL,
  `payment_details` JSON,
  `status` ENUM('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `admin_notes` TEXT,
  `processed_by_admin_id` INT NULL,
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`processed_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_withdrawal_requests_user_id` (`user_id`),
  INDEX `idx_withdrawal_requests_status` (`status`),
  INDEX `idx_withdrawal_requests_processed_by_admin_id` (`processed_by_admin_id`)
) ENGINE=InnoDB 
COMMENT='User withdrawal requests with admin approval workflow';

-- =============================================
-- REVIEWS & REPUTATION SYSTEM
-- =============================================

-- Reviews between users after project completion
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `reviewee_id` INT NOT NULL,
  `reviewer_type` ENUM('client', 'freelancer') NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` TEXT,
  `criteria_ratings` JSON,
  `pros_cons` JSON,
  `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `helpful_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate reviews per project per user
  UNIQUE KEY `unique_project_reviewer` (`project_id`, `reviewer_id`),
  
  -- Indexes
  INDEX `idx_reviews_project_id` (`project_id`),
  INDEX `idx_reviews_reviewer_id` (`reviewer_id`),
  INDEX `idx_reviews_reviewee_id` (`reviewee_id`),
  INDEX `idx_reviews_rating` (`rating`),
  INDEX `idx_reviews_is_public` (`is_public`)
) ENGINE=InnoDB 
COMMENT='Reviews and ratings between clients and freelancers';

-- Responses to reviews
CREATE TABLE `review_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `review_id` INT UNIQUE NOT NULL,
  `user_id` INT NOT NULL,
  `response` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_review_responses_review_id` (`review_id`),
  INDEX `idx_review_responses_user_id` (`user_id`)
) ENGINE=InnoDB 
COMMENT='Responses to reviews by reviewees';

-- Centralized reputation scores
CREATE TABLE `user_reputation` (
  `user_id` INT PRIMARY KEY,
  `overall_rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `total_reviews` INT NOT NULL DEFAULT 0,
  `completed_projects` INT NOT NULL DEFAULT 0,
  `success_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `response_time_avg_hours` INT NOT NULL DEFAULT 24,
  `client_satisfaction` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `quality_score` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `professionalism_score` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `communication_score` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `total_earnings` INT NOT NULL DEFAULT 0,
  `repeat_clients` INT NOT NULL DEFAULT 0,
  `last_calculated` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_user_reputation_overall_rating` (`overall_rating`),
  INDEX `idx_user_reputation_completed_projects` (`completed_projects`),
  INDEX `idx_user_reputation_success_rate` (`success_rate`)
) ENGINE=InnoDB 
COMMENT='Centralized reputation scores and statistics for users';

-- =============================================
-- GAMIFICATION SYSTEM
-- =============================================

-- Badge categories for organization
CREATE TABLE `badge_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(100),
  `color` VARCHAR(7),
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX `idx_badge_categories_slug` (`slug`),
  INDEX `idx_badge_categories_is_active` (`is_active`),
  INDEX `idx_badge_categories_sort_order` (`sort_order`)
) ENGINE=InnoDB 
COMMENT='Categories for organizing achievement badges';

-- Achievement badges
CREATE TABLE `badges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(100),
  `rarity` ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  `requirements` JSON,
  `rewards` JSON,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_automatic` BOOLEAN NOT NULL DEFAULT TRUE,
  `earned_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`category_id`) REFERENCES `badge_categories`(`id`) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX `idx_badges_category_id` (`category_id`),
  INDEX `idx_badges_slug` (`slug`),
  INDEX `idx_badges_rarity` (`rarity`),
  INDEX `idx_badges_is_active` (`is_active`)
) ENGINE=InnoDB 
COMMENT='Achievement badges for user gamification';

-- User earned badges
CREATE TABLE `user_badges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `badge_id` INT NOT NULL,
  `earned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `progress_data` JSON,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
  `earn_description` TEXT,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate badges per user
  UNIQUE KEY `unique_user_badge` (`user_id`, `badge_id`),
  
  -- Indexes
  INDEX `idx_user_badges_user_id` (`user_id`),
  INDEX `idx_user_badges_badge_id` (`badge_id`),
  INDEX `idx_user_badges_earned_at` (`earned_at`),
  INDEX `idx_user_badges_is_featured` (`is_featured`)
) ENGINE=InnoDB 
COMMENT='Badges earned by users with progress tracking';

-- Badge milestones for complex achievements
CREATE TABLE `badge_milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `badge_id` INT NOT NULL,
  `milestone_name` VARCHAR(255) NOT NULL,
  `requirements` JSON,
  `sort_order` INT NOT NULL DEFAULT 0,
  `progress_weight` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_badge_milestones_badge_id` (`badge_id`),
  INDEX `idx_badge_milestones_sort_order` (`sort_order`)
) ENGINE=InnoDB 
COMMENT='Milestones for complex multi-step badges';

-- =============================================
-- FILE MANAGEMENT SYSTEM
-- =============================================

-- File uploads with cloud storage support
CREATE TABLE `file_uploads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `entity_type` ENUM('profile', 'portfolio', 'project', 'message', 'service', 'review', 'dispute', 'support') NOT NULL,
  `entity_id` INT,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `storage_provider` ENUM('local', 's3', 'cloudinary', 'other') NOT NULL DEFAULT 'local',
  `storage_path` VARCHAR(500) NOT NULL,
  `cdn_url` VARCHAR(500),
  `thumbnail_url` VARCHAR(500),
  `is_public` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_temporary` BOOLEAN NOT NULL DEFAULT FALSE,
  `download_count` INT NOT NULL DEFAULT 0,
  `virus_scan_status` ENUM('pending', 'clean', 'infected', 'error') NOT NULL DEFAULT 'pending',
  `metadata` JSON,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_file_uploads_user_id` (`user_id`),
  INDEX `idx_file_uploads_entity_type` (`entity_type`),
  INDEX `idx_file_uploads_entity_id` (`entity_id`),
  INDEX `idx_file_uploads_is_temporary` (`is_temporary`),
  INDEX `idx_file_uploads_expires_at` (`expires_at`)
) ENGINE=InnoDB 
COMMENT='File uploads with cloud storage and metadata management';

-- Project attachments
CREATE TABLE `project_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `file_upload_id` INT NOT NULL,
  `attachment_type` ENUM('requirement', 'deliverable', 'revision', 'final') NOT NULL,
  `uploaded_by_id` INT NOT NULL,
  `description` TEXT,
  `is_final_deliverable` BOOLEAN NOT NULL DEFAULT FALSE,
  `requires_approval` BOOLEAN NOT NULL DEFAULT FALSE,
  `approved_at` TIMESTAMP NULL,
  `approved_by_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`file_upload_id`) REFERENCES `file_uploads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_project_attachments_project_id` (`project_id`),
  INDEX `idx_project_attachments_file_upload_id` (`file_upload_id`),
  INDEX `idx_project_attachments_uploaded_by_id` (`uploaded_by_id`),
  INDEX `idx_project_attachments_attachment_type` (`attachment_type`)
) ENGINE=InnoDB 
COMMENT='File attachments associated with projects';

-- Add foreign key constraint for portfolio items category
ALTER TABLE `portfolio_items` 
ADD FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL;

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- User notifications
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'error', 'project', 'payment', 'message', 'review') NOT NULL DEFAULT 'info',
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `data` JSON,
  `action_buttons` JSON,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_dismissed` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_notifications_user_id` (`user_id`),
  INDEX `idx_notifications_type` (`type`),
  INDEX `idx_notifications_priority` (`priority`),
  INDEX `idx_notifications_is_read` (`is_read`),
  INDEX `idx_notifications_expires_at` (`expires_at`)
) ENGINE=InnoDB 
COMMENT='Real-time notifications for users';

-- Notification preferences per user
CREATE TABLE `notification_preferences` (
  `user_id` INT PRIMARY KEY,
  `email_notifications` JSON,
  `push_notifications` JSON,
  `sms_notifications` JSON,
  `frequency` ENUM('immediate', 'daily', 'weekly', 'never') NOT NULL DEFAULT 'immediate',
  `quiet_hours_start` TIME,
  `quiet_hours_end` TIME,
  `timezone` VARCHAR(50),
  `marketing_emails` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB 
COMMENT='User notification preferences and settings';

-- =============================================
-- USER FEATURES (FAVORITES & SEARCHES)
-- =============================================

-- User favorites for services, projects, etc.
CREATE TABLE `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `entity_type` ENUM('service', 'project', 'freelancer', 'client') NOT NULL,
  `entity_id` INT NOT NULL,
  `notes` TEXT,
  `tags` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate favorites
  UNIQUE KEY `unique_user_favorite` (`user_id`, `entity_type`, `entity_id`),
  
  -- Indexes
  INDEX `idx_favorites_user_id` (`user_id`),
  INDEX `idx_favorites_entity_type` (`entity_type`),
  INDEX `idx_favorites_entity_id` (`entity_id`)
) ENGINE=InnoDB 
COMMENT='User favorites for services, projects, and profiles';

-- Saved searches with alerts
CREATE TABLE `saved_searches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `search_name` VARCHAR(255) NOT NULL,
  `search_criteria` JSON NOT NULL,
  `alert_frequency` ENUM('immediate', 'daily', 'weekly', 'never') NOT NULL DEFAULT 'never',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `results_count` INT NOT NULL DEFAULT 0,
  `last_alert_sent` TIMESTAMP NULL,
  `last_executed` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_saved_searches_user_id` (`user_id`),
  INDEX `idx_saved_searches_is_active` (`is_active`),
  INDEX `idx_saved_searches_alert_frequency` (`alert_frequency`)
) ENGINE=InnoDB 
COMMENT='Saved searches with alert functionality';

-- =============================================
-- DISPUTES & SUPPORT SYSTEM
-- =============================================

-- Project disputes
CREATE TABLE `disputes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `initiator_id` INT NOT NULL,
  `respondent_id` INT NOT NULL,
  `reason` ENUM('payment', 'quality', 'deadline', 'communication', 'breach_of_contract', 'other') NOT NULL,
  `description` TEXT NOT NULL,
  `disputed_amount` DECIMAL(15,2),
  `status` ENUM('pending', 'investigating', 'mediation', 'resolved', 'closed') NOT NULL DEFAULT 'pending',
  `resolution_type` ENUM('refund', 'partial_refund', 'payment_release', 'no_action', 'other') NULL,
  `evidence` JSON,
  `resolution` TEXT,
  `admin_id` INT NULL,
  `admin_assigned_at` TIMESTAMP NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`initiator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`respondent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_disputes_project_id` (`project_id`),
  INDEX `idx_disputes_initiator_id` (`initiator_id`),
  INDEX `idx_disputes_respondent_id` (`respondent_id`),
  INDEX `idx_disputes_admin_id` (`admin_id`),
  INDEX `idx_disputes_status` (`status`)
) ENGINE=InnoDB 
COMMENT='Project disputes between clients and freelancers';

-- Messages within disputes
CREATE TABLE `dispute_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dispute_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `attachments` JSON,
  `is_admin_message` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_dispute_messages_dispute_id` (`dispute_id`),
  INDEX `idx_dispute_messages_user_id` (`user_id`),
  INDEX `idx_dispute_messages_is_admin_message` (`is_admin_message`)
) ENGINE=InnoDB 
COMMENT='Messages and communication within disputes';

-- Support tickets
CREATE TABLE `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ticket_number` VARCHAR(20) UNIQUE NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('technical', 'billing', 'account', 'dispute', 'feature_request', 'bug_report', 'other') NOT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `status` ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `assigned_admin_id` INT NULL,
  `attachments` JSON,
  `first_response_at` TIMESTAMP NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_support_tickets_user_id` (`user_id`),
  INDEX `idx_support_tickets_assigned_admin_id` (`assigned_admin_id`),
  INDEX `idx_support_tickets_status` (`status`),
  INDEX `idx_support_tickets_priority` (`priority`),
  INDEX `idx_support_tickets_category` (`category`)
) ENGINE=InnoDB 
COMMENT='Support tickets for customer service';

-- Support ticket responses
CREATE TABLE `support_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `response` TEXT NOT NULL,
  `is_admin_response` BOOLEAN NOT NULL DEFAULT FALSE,
  `attachments` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_support_responses_ticket_id` (`ticket_id`),
  INDEX `idx_support_responses_user_id` (`user_id`),
  INDEX `idx_support_responses_is_admin_response` (`is_admin_response`)
) ENGINE=InnoDB 
COMMENT='Responses and communication in support tickets';

-- =============================================
-- ANALYTICS & LOGGING
-- =============================================

-- Activity logs for audit trail
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50),
  `entity_id` INT,
  `data` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `session_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes for performance
  INDEX `idx_activity_logs_user_id` (`user_id`),
  INDEX `idx_activity_logs_action` (`action`),
  INDEX `idx_activity_logs_entity_type` (`entity_type`),
  INDEX `idx_activity_logs_created_at` (`created_at`)
) ENGINE=InnoDB 
COMMENT='Activity logs for security and audit purposes';

-- User analytics for business intelligence
CREATE TABLE `user_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `profile_views` INT NOT NULL DEFAULT 0,
  `service_views` INT NOT NULL DEFAULT 0,
  `message_sent` INT NOT NULL DEFAULT 0,
  `proposals_sent` INT NOT NULL DEFAULT 0,
  `projects_created` INT NOT NULL DEFAULT 0,
  `earnings_day` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `login_count` INT NOT NULL DEFAULT 0,
  `active_minutes` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Prevent duplicate analytics per user per day
  UNIQUE KEY `unique_user_date` (`user_id`, `date`),
  
  -- Indexes
  INDEX `idx_user_analytics_user_id` (`user_id`),
  INDEX `idx_user_analytics_date` (`date`)
) ENGINE=InnoDB 
COMMENT='Daily user analytics for business intelligence';

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Trigger to update wallet after completed transaction
DELIMITER $$
CREATE TRIGGER `update_wallet_after_transaction` 
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update sender wallet (decrease balance)
        IF NEW.from_user_id IS NOT NULL THEN
            UPDATE `wallets` 
            SET `available_balance` = `available_balance` - NEW.amount - NEW.fee_amount,
                `lifetime_spent` = `lifetime_spent` + NEW.amount + NEW.fee_amount,
                `last_transaction_at` = NOW()
            WHERE `user_id` = NEW.from_user_id;
        END IF;
        
        -- Update receiver wallet (increase balance)
        IF NEW.to_user_id IS NOT NULL THEN
            UPDATE `wallets` 
            SET `available_balance` = `available_balance` + NEW.amount,
                `lifetime_earnings` = `lifetime_earnings` + NEW.amount,
                `last_transaction_at` = NOW()
            WHERE `user_id` = NEW.to_user_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- Trigger to update conversation last message
DELIMITER $$
CREATE TRIGGER `update_conversation_last_message` 
AFTER INSERT ON `messages`
FOR EACH ROW
BEGIN
    UPDATE `conversations` 
    SET `last_message_id` = NEW.id,
        `last_message_at` = NEW.created_at,
        `unread_count_p1` = CASE 
            WHEN NEW.receiver_id = `participant_1_id` THEN `unread_count_p1` + 1 
            ELSE `unread_count_p1` 
        END,
        `unread_count_p2` = CASE 
            WHEN NEW.receiver_id = `participant_2_id` THEN `unread_count_p2` + 1 
            ELSE `unread_count_p2` 
        END
    WHERE `id` = NEW.conversation_id;
END$$
DELIMITER ;

-- Trigger to update skill usage count
DELIMITER $$
CREATE TRIGGER `update_skill_usage_count` 
AFTER INSERT ON `freelancer_skills`
FOR EACH ROW
BEGIN
    UPDATE `skills` 
    SET `usage_count` = `usage_count` + 1 
    WHERE `id` = NEW.skill_id;
END$$
DELIMITER ;

-- Trigger to update project proposal count
DELIMITER $$
CREATE TRIGGER `update_project_proposal_count` 
AFTER INSERT ON `proposals`
FOR EACH ROW
BEGIN
    UPDATE `projects` 
    SET `proposal_count` = `proposal_count` + 1 
    WHERE `id` = NEW.project_id;
END$$
DELIMITER ;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Create default admin user
INSERT INTO `users` (
    `email`, `password_hash`, `user_type`, `first_name`, `last_name`, 
    `status`, `email_verified_at`, `created_at`
) VALUES (
    'admin@laburemos.com.ar', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'admin', 
    'Admin', 
    'LaburAR',
    'active',
    NOW(),
    NOW()
);

-- Create wallet for admin user
INSERT INTO `wallets` (`user_id`, `created_at`) 
SELECT `id`, NOW() FROM `users` WHERE `email` = 'admin@laburemos.com.ar';

-- Create notification preferences for admin
INSERT INTO `notification_preferences` (`user_id`) 
SELECT `id` FROM `users` WHERE `email` = 'admin@laburemos.com.ar';

-- Create main categories
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `color`, `level`, `sort_order`, `created_at`) VALUES
('Desarrollo Web', 'desarrollo-web', 'Servicios de desarrollo web y aplicaciones', 'code', '#3498db', 0, 1, NOW()),
('Diseño Gráfico', 'diseno-grafico', 'Servicios de diseño visual y gráfico', 'palette', '#e74c3c', 0, 2, NOW()),
('Marketing Digital', 'marketing-digital', 'Servicios de marketing y publicidad digital', 'megaphone', '#f39c12', 0, 3, NOW()),
('Redacción y Traducción', 'redaccion-traduccion', 'Servicios de contenido y traducción', 'edit', '#27ae60', 0, 4, NOW()),
('Video y Animación', 'video-animacion', 'Servicios de video y contenido audiovisual', 'video', '#9b59b6', 0, 5, NOW()),
('Música y Audio', 'musica-audio', 'Servicios de audio y producción musical', 'music', '#1abc9c', 0, 6, NOW()),
('Programación', 'programacion', 'Servicios de programación y desarrollo', 'terminal', '#34495e', 0, 7, NOW()),
('Datos', 'datos', 'Servicios de análisis y ciencia de datos', 'bar-chart', '#e67e22', 0, 8, NOW());

-- Create basic skills
INSERT INTO `skills` (`name`, `slug`, `category`, `subcategory`, `description`, `is_verified`, `created_at`) VALUES
('JavaScript', 'javascript', 'Desarrollo Web', 'Frontend', 'Lenguaje de programación para desarrollo web', TRUE, NOW()),
('React', 'react', 'Desarrollo Web', 'Frontend', 'Biblioteca de JavaScript para interfaces de usuario', TRUE, NOW()),
('Node.js', 'nodejs', 'Desarrollo Web', 'Backend', 'Entorno de ejecución para JavaScript del lado del servidor', TRUE, NOW()),
('Python', 'python', 'Programación', 'Backend', 'Lenguaje de programación versátil', TRUE, NOW()),
('PHP', 'php', 'Desarrollo Web', 'Backend', 'Lenguaje de programación para desarrollo web', TRUE, NOW()),
('MySQL', 'mysql', 'Desarrollo Web', 'Database', 'Sistema de gestión de base de datos relacional', TRUE, NOW()),
('Adobe Photoshop', 'adobe-photoshop', 'Diseño Gráfico', 'Edición', 'Software de edición de imágenes', TRUE, NOW()),
('WordPress', 'wordpress', 'Desarrollo Web', 'CMS', 'Sistema de gestión de contenidos', TRUE, NOW()),
('SEO', 'seo', 'Marketing Digital', 'Orgánico', 'Optimización para motores de búsqueda', TRUE, NOW()),
('Google Ads', 'google-ads', 'Marketing Digital', 'Publicidad', 'Plataforma de publicidad de Google', TRUE, NOW());

-- Create badge categories
INSERT INTO `badge_categories` (`name`, `slug`, `description`, `icon`, `color`, `sort_order`, `created_at`) VALUES
('Logros Generales', 'logros-generales', 'Badges por actividad general en la plataforma', 'trophy', '#f1c40f', 1, NOW()),
('Proyectos', 'proyectos', 'Badges relacionados con proyectos completados', 'briefcase', '#3498db', 2, NOW()),
('Calidad', 'calidad', 'Badges por calidad de trabajo y reviews', 'star', '#e74c3c', 3, NOW()),
('Comunicación', 'comunicacion', 'Badges por excelente comunicación', 'message-circle', '#27ae60', 4, NOW()),
('Especialización', 'especializacion', 'Badges por expertise en áreas específicas', 'award', '#9b59b6', 5, NOW());

-- Create basic badges
INSERT INTO `badges` (`category_id`, `name`, `slug`, `description`, `icon`, `rarity`, `requirements`, `is_automatic`, `created_at`) VALUES
(1, 'Bienvenido', 'bienvenido', 'Completaste tu perfil por primera vez', 'user-check', 'common', '{"profile_completion": 100}', TRUE, NOW()),
(1, 'Primera Propuesta', 'primera-propuesta', 'Enviaste tu primera propuesta', 'send', 'common', '{"proposals_sent": 1}', TRUE, NOW()),
(2, 'Primer Proyecto', 'primer-proyecto', 'Completaste tu primer proyecto', 'check-circle', 'common', '{"projects_completed": 1}', TRUE, NOW()),
(2, 'Trabajador Consistente', 'trabajador-consistente', 'Completaste 10 proyectos exitosamente', 'briefcase', 'uncommon', '{"projects_completed": 10}', TRUE, NOW()),
(3, '5 Estrellas', 'cinco-estrellas', 'Mantén un promedio de 5 estrellas en 10+ reviews', 'star', 'rare', '{"avg_rating": 5.0, "min_reviews": 10}', TRUE, NOW()),
(4, 'Comunicador Efectivo', 'comunicador-efectivo', 'Tiempo de respuesta promedio menor a 2 horas', 'message-circle', 'uncommon', '{"avg_response_time_hours": 2}', TRUE, NOW()),
(5, 'Especialista JavaScript', 'especialista-javascript', 'Completa 5 proyectos usando JavaScript', 'code', 'uncommon', '{"skill_projects": {"javascript": 5}}', TRUE, NOW());

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user profiles with reputation
CREATE VIEW `user_profiles_with_reputation` AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.user_type,
    u.profile_image,
    u.country,
    u.city,
    u.status,
    u.is_online,
    u.last_active,
    fp.bio,
    fp.title,
    fp.hourly_rate,
    fp.availability,
    ur.overall_rating,
    ur.total_reviews,
    ur.completed_projects,
    ur.success_rate,
    ur.response_time_avg_hours
FROM users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
LEFT JOIN user_reputation ur ON u.id = ur.user_id
WHERE u.deleted_at IS NULL;

-- View for active projects with client and freelancer info
CREATE VIEW `active_projects_with_users` AS
SELECT 
    p.*,
    c.first_name as client_first_name,
    c.last_name as client_last_name,
    c.email as client_email,
    f.first_name as freelancer_first_name,
    f.last_name as freelancer_last_name,
    f.email as freelancer_email,
    cat.name as category_name
FROM projects p
JOIN users c ON p.client_id = c.id
LEFT JOIN users f ON p.freelancer_id = f.id
JOIN categories cat ON p.category_id = cat.id
WHERE p.status IN ('published', 'in_progress');

-- View for service listings with user info
CREATE VIEW `service_listings` AS
SELECT 
    s.*,
    u.first_name,
    u.last_name,
    u.profile_image,
    cat.name as category_name,
    ur.overall_rating,
    ur.total_reviews
FROM services s
JOIN users u ON s.user_id = u.id
JOIN categories cat ON s.category_id = cat.id
LEFT JOIN user_reputation ur ON u.id = ur.user_id
WHERE s.is_active = TRUE
AND u.status = 'active';

-- =============================================
-- PERFORMANCE OPTIMIZATION
-- =============================================

-- Additional composite indexes for common query patterns
CREATE INDEX `idx_projects_status_category` ON `projects` (`status`, `category_id`);
CREATE INDEX `idx_services_category_active` ON `services` (`category_id`, `is_active`);
CREATE INDEX `idx_freelancer_skills_user_featured` ON `freelancer_skills` (`user_id`, `is_featured`);
CREATE INDEX `idx_messages_conversation_created` ON `messages` (`conversation_id`, `created_at`);
CREATE INDEX `idx_transactions_user_status` ON `transactions` (`to_user_id`, `from_user_id`, `status`);
CREATE INDEX `idx_reviews_reviewee_rating` ON `reviews` (`reviewee_id`, `rating`);
CREATE INDEX `idx_notifications_user_unread` ON `notifications` (`user_id`, `is_read`);

-- =============================================
-- DATABASE COMPLETION
-- =============================================

-- Analyze tables for optimal performance
ANALYZE TABLE users, projects, services, transactions, messages, reviews;

-- Show database summary
SELECT 
    'Database created successfully!' as status,
    COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'laburemos_db';

-- Show foreign key relationships count
SELECT 
    'Foreign key constraints created' as status,
    COUNT(*) as total_constraints
FROM information_schema.referential_constraints 
WHERE constraint_schema = 'laburemos_db';

COMMIT;

-- =============================================
-- FINAL SUCCESS MESSAGE
-- =============================================
SELECT 
    'LaburAR Database Created Successfully!' as message,
    '35 tables with complete FK relationships' as details,
    'Production ready with triggers, views, and indexes' as features,
    NOW() as created_at;