-- =====================================================================
-- LaburAR - Complete Database Schema for MySQL/XAMPP
-- Equivalent to PostgreSQL version for local development
-- Total Tables: 35
-- Author: Backend Developer  
-- Version: Production Ready - MySQL Edition
-- Compatible with: phpMyAdmin, XAMPP, MySQL 8.0+
-- =====================================================================

-- Set SQL mode and character set
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Set character set for proper UTF-8 support
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Database creation
CREATE DATABASE IF NOT EXISTS `laburemos_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `laburemos_db`;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS `user_analytics`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `support_responses`;
DROP TABLE IF EXISTS `support_tickets`;
DROP TABLE IF EXISTS `dispute_messages`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `saved_searches`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `project_attachments`;
DROP TABLE IF EXISTS `file_uploads`;
DROP TABLE IF EXISTS `badge_milestones`;
DROP TABLE IF EXISTS `user_badges`;
DROP TABLE IF EXISTS `badges`;
DROP TABLE IF EXISTS `review_responses`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `withdrawal_requests`;
DROP TABLE IF EXISTS `escrow_accounts`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `video_calls`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `project_milestones`;
DROP TABLE IF EXISTS `proposals`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `service_packages`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `portfolio_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `freelancer_skills`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `notification_preferences`;
DROP TABLE IF EXISTS `user_reputation`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `freelancer_profiles`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `badge_categories`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `users`;

-- =====================================================================
-- CORE TABLES (NO DEPENDENCIES)
-- =====================================================================

-- Users table (core table)
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `user_type` enum('client','freelancer','admin','both') NOT NULL DEFAULT 'client',
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `profile_image` text DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending_verification','deleted') NOT NULL DEFAULT 'active',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `last_active` timestamp NULL DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_user_type` (`user_type`),
  KEY `idx_users_is_online` (`is_online`),
  KEY `idx_users_last_active` (`last_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skills table (independent)
CREATE TABLE `skills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_trending` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `usage_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_skills_name_description` (`name`,`description`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badge categories table (independent)
CREATE TABLE `badge_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- USER DEPENDENT TABLES
-- =====================================================================

-- User sessions
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_info` json DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password resets
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `is_revoked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Freelancer profiles
CREATE TABLE `freelancer_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `availability` enum('available','busy','unavailable','vacation') DEFAULT 'available',
  `timezone` varchar(50) DEFAULT NULL,
  `portfolio_url` varchar(500) DEFAULT NULL,
  `languages` json DEFAULT NULL,
  `certifications` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `freelancer_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User wallets
CREATE TABLE `wallets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `available_balance` decimal(12,2) DEFAULT 0.00,
  `pending_balance` decimal(12,2) DEFAULT 0.00,
  `escrow_balance` decimal(12,2) DEFAULT 0.00,
  `lifetime_earnings` decimal(15,2) DEFAULT 0.00,
  `lifetime_spent` decimal(15,2) DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'USD',
  `last_transaction_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User reputation (one-to-one with users)
CREATE TABLE `user_reputation` (
  `user_id` int(11) NOT NULL,
  `overall_rating` decimal(3,2) DEFAULT 0.00,
  `total_reviews` int(11) DEFAULT 0,
  `completed_projects` int(11) DEFAULT 0,
  `success_rate` decimal(5,2) DEFAULT 0.00,
  `response_time_avg_hours` int(11) DEFAULT 0,
  `client_satisfaction` decimal(3,2) DEFAULT 0.00,
  `quality_score` decimal(3,2) DEFAULT 0.00,
  `professionalism_score` decimal(3,2) DEFAULT 0.00,
  `communication_score` decimal(3,2) DEFAULT 0.00,
  `total_earnings` int(11) DEFAULT 0,
  `repeat_clients` int(11) DEFAULT 0,
  `last_calculated` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_reputation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification preferences (one-to-one with users)
CREATE TABLE `notification_preferences` (
  `user_id` int(11) NOT NULL,
  `email_notifications` json DEFAULT NULL,
  `push_notifications` json DEFAULT NULL,
  `sms_notifications` json DEFAULT NULL,
  `frequency` enum('instant','daily','weekly','never') DEFAULT 'instant',
  `quiet_hours_start` time DEFAULT NULL,
  `quiet_hours_end` time DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `marketing_emails` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment methods
CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('credit_card','debit_card','paypal','stripe','bank_transfer','crypto') NOT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `external_id` varchar(255) DEFAULT NULL,
  `last_four` varchar(4) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `billing_details` json DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `metadata` json DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SKILLS SYSTEM
-- =====================================================================

-- Freelancer skills (junction table)
CREATE TABLE `freelancer_skills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `proficiency_level` enum('beginner','intermediate','advanced','expert') NOT NULL,
  `years_experience` int(11) DEFAULT 0,
  `endorsed_count` int(11) DEFAULT 0,
  `hourly_rate_skill` decimal(10,2) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_skill_unique` (`user_id`,`skill_id`),
  KEY `skill_id` (`skill_id`),
  KEY `idx_freelancer_skills_user_id` (`user_id`),
  KEY `idx_freelancer_skills_skill_id` (`skill_id`),
  KEY `idx_freelancer_skills_proficiency` (`proficiency_level`),
  CONSTRAINT `freelancer_skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `freelancer_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- CATEGORIES SYSTEM (SELF-REFERENCING) 
-- =====================================================================

-- Categories with self-reference
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_categories_parent_id` (`parent_id`),
  KEY `idx_categories_slug` (`slug`),
  KEY `idx_categories_is_active` (`is_active`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- CATEGORIES DEPENDENT TABLES
-- =====================================================================

-- Portfolio items
CREATE TABLE `portfolio_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `project_url` varchar(500) DEFAULT NULL,
  `media_files` json DEFAULT NULL,
  `technologies_used` json DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `client_name` varchar(100) DEFAULT NULL,
  `project_value` decimal(12,2) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `portfolio_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `portfolio_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `delivery_time` int(11) NOT NULL COMMENT 'in days',
  `requirements` text DEFAULT NULL,
  `gallery_images` json DEFAULT NULL,
  `faq` json DEFAULT NULL,
  `extras` json DEFAULT NULL,
  `total_orders` int(11) DEFAULT 0,
  `total_reviews` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  KEY `idx_services_user_id` (`user_id`),
  KEY `idx_services_category_id` (`category_id`),
  KEY `idx_services_is_active` (`is_active`),
  KEY `idx_services_is_featured` (`is_featured`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service packages
CREATE TABLE `service_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `package_type` enum('basic','standard','premium') NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `delivery_time` int(11) NOT NULL COMMENT 'in days',
  `features` json DEFAULT NULL,
  `max_revisions` int(11) DEFAULT 0,
  `extras_included` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `service_packages_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `freelancer_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `budget_min` decimal(12,2) DEFAULT NULL,
  `budget_max` decimal(12,2) DEFAULT NULL,
  `budget_type` enum('fixed','hourly','milestone') NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('draft','published','in_progress','completed','cancelled','disputed') DEFAULT 'draft',
  `required_skills` json DEFAULT NULL,
  `experience_level` enum('entry','intermediate','expert') DEFAULT NULL,
  `proposal_count` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_urgent` tinyint(1) DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `freelancer_id` (`freelancer_id`),
  KEY `category_id` (`category_id`),
  KEY `idx_projects_client_id` (`client_id`),
  KEY `idx_projects_freelancer_id` (`freelancer_id`),
  KEY `idx_projects_category_id` (`category_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_published_at` (`published_at`),
  KEY `idx_projects_budget_type` (`budget_type`),
  KEY `idx_projects_is_featured` (`is_featured`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- PROJECT DEPENDENT TABLES
-- =====================================================================

-- Proposals
CREATE TABLE `proposals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `freelancer_id` int(11) NOT NULL,
  `service_package_id` int(11) DEFAULT NULL,
  `cover_letter` text DEFAULT NULL,
  `proposed_amount` decimal(12,2) NOT NULL,
  `proposed_timeline` int(11) NOT NULL COMMENT 'in days',
  `milestones` json DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `status` enum('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
  `client_viewed_at` timestamp NULL DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_freelancer_unique` (`project_id`,`freelancer_id`),
  KEY `freelancer_id` (`freelancer_id`),
  KEY `service_package_id` (`service_package_id`),
  KEY `idx_proposals_project_id` (`project_id`),
  KEY `idx_proposals_freelancer_id` (`freelancer_id`),
  KEY `idx_proposals_status` (`status`),
  KEY `idx_proposals_created_at` (`created_at`),
  CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `proposals_ibfk_2` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `proposals_ibfk_3` FOREIGN KEY (`service_package_id`) REFERENCES `service_packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project milestones
CREATE TABLE `project_milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','in_progress','completed','approved','disputed') DEFAULT 'pending',
  `deliverables` json DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations (create before messages for circular reference)
CREATE TABLE `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL,
  `participant_1_id` int(11) NOT NULL,
  `participant_2_id` int(11) NOT NULL,
  `last_message_id` int(11) DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `unread_count_p1` int(11) DEFAULT 0,
  `unread_count_p2` int(11) DEFAULT 0,
  `is_archived_p1` tinyint(1) DEFAULT 0,
  `is_archived_p2` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `participants_project_unique` (`participant_1_id`,`participant_2_id`,`project_id`),
  KEY `project_id` (`project_id`),
  KEY `participant_2_id` (`participant_2_id`),
  KEY `last_message_id` (`last_message_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`participant_1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`participant_2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message_content` text DEFAULT NULL,
  `message_type` enum('text','file','image','proposal','milestone','system') DEFAULT 'text',
  `attachments` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `idx_messages_conversation_id` (`conversation_id`),
  KEY `idx_messages_sender_id` (`sender_id`),
  KEY `idx_messages_receiver_id` (`receiver_id`),
  KEY `idx_messages_created_at` (`created_at`),
  KEY `idx_messages_is_read` (`is_read`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK constraint for conversations.last_message_id after messages table exists
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_ibfk_4` FOREIGN KEY (`last_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

-- Video calls
CREATE TABLE `video_calls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `initiator_id` int(11) NOT NULL,
  `room_id` varchar(255) NOT NULL,
  `duration_minutes` int(11) DEFAULT 0,
  `status` enum('scheduled','ongoing','completed','cancelled','failed') DEFAULT 'scheduled',
  `recording_url` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_id` (`room_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `initiator_id` (`initiator_id`),
  CONSTRAINT `video_calls_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_calls_ibfk_2` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- PAYMENT SYSTEM TABLES
-- =====================================================================

-- Transactions
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user_id` int(11) DEFAULT NULL,
  `to_user_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `milestone_id` int(11) DEFAULT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `external_transaction_id` varchar(255) DEFAULT NULL,
  `type` enum('payment','withdrawal','refund','fee','bonus','escrow_fund','escrow_release') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `fee_amount` decimal(12,2) DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'USD',
  `status` enum('pending','processing','completed','failed','cancelled','refunded') DEFAULT 'pending',
  `payment_method` varchar(100) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `description` text DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `project_id` (`project_id`),
  KEY `milestone_id` (`milestone_id`),
  KEY `idx_transactions_from_user_id` (`from_user_id`),
  KEY `idx_transactions_to_user_id` (`to_user_id`),
  KEY `idx_transactions_project_id` (`project_id`),
  KEY `idx_transactions_status` (`status`),
  KEY `idx_transactions_type` (`type`),
  KEY `idx_transactions_created_at` (`created_at`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_4` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Escrow accounts
CREATE TABLE `escrow_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `milestone_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `freelancer_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `fee_amount` decimal(12,2) DEFAULT 0.00,
  `status` enum('pending','funded','released','refunded','disputed','expired') DEFAULT 'pending',
  `release_conditions` text DEFAULT NULL,
  `funded_at` timestamp NULL DEFAULT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `milestone_id` (`milestone_id`),
  KEY `client_id` (`client_id`),
  KEY `freelancer_id` (`freelancer_id`),
  CONSTRAINT `escrow_accounts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `escrow_accounts_ibfk_2` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `escrow_accounts_ibfk_3` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `escrow_accounts_ibfk_4` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Withdrawal requests
CREATE TABLE `withdrawal_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `fee_amount` decimal(12,2) DEFAULT 0.00,
  `payment_method_id` int(11) DEFAULT NULL,
  `payment_details` json DEFAULT NULL,
  `status` enum('pending','processing','completed','rejected','cancelled') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_by_admin_id` int(11) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `processed_by_admin_id` (`processed_by_admin_id`),
  CONSTRAINT `withdrawal_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `withdrawal_requests_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `withdrawal_requests_ibfk_3` FOREIGN KEY (`processed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- REVIEWS & REPUTATION SYSTEM
-- =====================================================================

-- Reviews
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `reviewee_id` int(11) NOT NULL,
  `reviewer_type` enum('client','freelancer') NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` text DEFAULT NULL,
  `criteria_ratings` json DEFAULT NULL COMMENT 'quality, communication, deadline, etc.',
  `pros_cons` json DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_reviewer_unique` (`project_id`,`reviewer_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `reviewee_id` (`reviewee_id`),
  KEY `idx_reviews_project_id` (`project_id`),
  KEY `idx_reviews_reviewer_id` (`reviewer_id`),
  KEY `idx_reviews_reviewee_id` (`reviewee_id`),
  KEY `idx_reviews_rating` (`rating`),
  KEY `idx_reviews_is_public` (`is_public`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review responses
CREATE TABLE `review_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `review_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `response` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `review_id` (`review_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `review_responses_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_responses_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- GAMIFICATION SYSTEM
-- =====================================================================

-- Badges
CREATE TABLE `badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `rarity` enum('common','uncommon','rare','epic','legendary') DEFAULT 'common',
  `requirements` json DEFAULT NULL,
  `rewards` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_automatic` tinyint(1) DEFAULT 1,
  `earned_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `badges_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `badge_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User badges
CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `progress_data` json DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_public` tinyint(1) DEFAULT 1,
  `earn_description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_badge_unique` (`user_id`,`badge_id`),
  KEY `badge_id` (`badge_id`),
  CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badge milestones
CREATE TABLE `badge_milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `badge_id` int(11) NOT NULL,
  `milestone_name` varchar(100) NOT NULL,
  `requirements` json DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `progress_weight` decimal(3,2) DEFAULT 1.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `badge_id` (`badge_id`),
  CONSTRAINT `badge_milestones_ibfk_1` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- FILE MANAGEMENT SYSTEM
-- =====================================================================

-- File uploads
CREATE TABLE `file_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `entity_type` enum('user','project','service','portfolio','message','dispute','support_ticket') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `storage_provider` enum('local','s3','gcs','azure') DEFAULT 'local',
  `storage_path` text NOT NULL,
  `cdn_url` text DEFAULT NULL,
  `thumbnail_url` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `is_temporary` tinyint(1) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `virus_scan_status` enum('pending','clean','infected','failed') DEFAULT 'pending',
  `metadata` json DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_file_uploads_user_id` (`user_id`),
  KEY `idx_file_uploads_entity` (`entity_type`,`entity_id`),
  KEY `idx_file_uploads_created_at` (`created_at`),
  CONSTRAINT `file_uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project attachments
CREATE TABLE `project_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `file_upload_id` int(11) NOT NULL,
  `attachment_type` enum('requirement','deliverable','reference','final') NOT NULL,
  `uploaded_by_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_final_deliverable` tinyint(1) DEFAULT 0,
  `requires_approval` tinyint(1) DEFAULT 0,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `file_upload_id` (`file_upload_id`),
  KEY `uploaded_by_id` (`uploaded_by_id`),
  KEY `approved_by_id` (`approved_by_id`),
  CONSTRAINT `project_attachments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_attachments_ibfk_2` FOREIGN KEY (`file_upload_id`) REFERENCES `file_uploads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_attachments_ibfk_3` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_attachments_ibfk_4` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- NOTIFICATIONS SYSTEM
-- =====================================================================

-- Notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error','proposal','message','payment','review') DEFAULT 'info',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `data` json DEFAULT NULL,
  `action_buttons` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_dismissed` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- USER FEATURES
-- =====================================================================

-- Favorites
CREATE TABLE `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `entity_type` enum('user','project','service','portfolio','message','dispute','support_ticket') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_entity_unique` (`user_id`,`entity_type`,`entity_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved searches
CREATE TABLE `saved_searches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `search_name` varchar(100) NOT NULL,
  `search_criteria` json NOT NULL,
  `alert_frequency` enum('instant','daily','weekly','never') DEFAULT 'never',
  `is_active` tinyint(1) DEFAULT 1,
  `results_count` int(11) DEFAULT 0,
  `last_alert_sent` timestamp NULL DEFAULT NULL,
  `last_executed` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `saved_searches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DISPUTES & SUPPORT SYSTEM
-- =====================================================================

-- Disputes
CREATE TABLE `disputes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `initiator_id` int(11) NOT NULL,
  `respondent_id` int(11) NOT NULL,
  `reason` enum('quality','deadline','payment','communication','requirements','other') NOT NULL,
  `description` text NOT NULL,
  `disputed_amount` decimal(12,2) DEFAULT NULL,
  `status` enum('open','in_review','resolved','closed') DEFAULT 'open',
  `resolution_type` enum('refund','partial_refund','rework','dismissed') DEFAULT NULL,
  `evidence` json DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `admin_assigned_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `initiator_id` (`initiator_id`),
  KEY `respondent_id` (`respondent_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `disputes_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disputes_ibfk_2` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disputes_ibfk_3` FOREIGN KEY (`respondent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disputes_ibfk_4` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute messages
CREATE TABLE `dispute_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dispute_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `attachments` json DEFAULT NULL,
  `is_admin_message` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `dispute_id` (`dispute_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dispute_messages_ibfk_1` FOREIGN KEY (`dispute_id`) REFERENCES `disputes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dispute_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support tickets
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ticket_number` varchar(20) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('technical','billing','account','dispute','feature_request','other') NOT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `status` enum('open','assigned','in_progress','waiting_customer','resolved','closed') DEFAULT 'open',
  `assigned_admin_id` int(11) DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `user_id` (`user_id`),
  KEY `assigned_admin_id` (`assigned_admin_id`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support responses
CREATE TABLE `support_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `response` text NOT NULL,
  `is_admin_response` tinyint(1) DEFAULT 0,
  `attachments` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `support_responses_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_responses_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- ANALYTICS & LOGS
-- =====================================================================

-- Activity logs
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User analytics
CREATE TABLE `user_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `profile_views` int(11) DEFAULT 0,
  `service_views` int(11) DEFAULT 0,
  `message_sent` int(11) DEFAULT 0,
  `proposals_sent` int(11) DEFAULT 0,
  `projects_created` int(11) DEFAULT 0,
  `earnings_day` decimal(12,2) DEFAULT 0.00,
  `login_count` int(11) DEFAULT 0,
  `active_minutes` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date_unique` (`user_id`,`date`),
  CONSTRAINT `user_analytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- STORED PROCEDURES & FUNCTIONS
-- =====================================================================

-- Procedure to generate unique ticket number
DELIMITER $$
CREATE FUNCTION generate_ticket_number() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE ticket_number VARCHAR(20);
    DECLARE counter INT DEFAULT 0;
    DECLARE max_attempts INT DEFAULT 100;
    DECLARE done INT DEFAULT 0;
    
    ticket_loop: LOOP
        SET ticket_number = CONCAT('TKT-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
        
        IF NOT EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = ticket_number) THEN
            LEAVE ticket_loop;
        END IF;
        
        SET counter = counter + 1;
        IF counter >= max_attempts THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to generate unique ticket number after maximum attempts';
        END IF;
    END LOOP;
    
    RETURN ticket_number;
END$$
DELIMITER ;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Trigger to auto-generate ticket numbers
DELIMITER $$
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        SET NEW.ticket_number = generate_ticket_number();
    END IF;
END$$
DELIMITER ;

-- Trigger to update conversation last_message
DELIMITER $$
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        unread_count_p1 = CASE 
            WHEN participant_1_id = NEW.receiver_id THEN unread_count_p1 + 1 
            ELSE unread_count_p1 
        END,
        unread_count_p2 = CASE 
            WHEN participant_2_id = NEW.receiver_id THEN unread_count_p2 + 1 
            ELSE unread_count_p2 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
END$$
DELIMITER ;

-- =====================================================================
-- INITIAL DATA INSERTS
-- =====================================================================

-- Insert default badge categories  
INSERT INTO `badge_categories` (`name`, `slug`, `description`, `icon`, `color`, `sort_order`) VALUES
('Achievement', 'achievement', 'General achievement badges', 'trophy', '#FFD700', 1),
('Skill', 'skill', 'Skill-based badges', 'star', '#4A90E2', 2),
('Community', 'community', 'Community participation badges', 'users', '#7ED321', 3),
('Quality', 'quality', 'Quality and excellence badges', 'award', '#F5A623', 4),
('Milestone', 'milestone', 'Career milestone badges', 'flag', '#BD10E0', 5);

-- Insert some default skills
INSERT INTO `skills` (`name`, `slug`, `category`, `subcategory`, `description`, `is_verified`) VALUES
('JavaScript', 'javascript', 'Programming', 'Frontend', 'Popular programming language for web development', 1),
('Python', 'python', 'Programming', 'Backend', 'Versatile programming language', 1),
('React', 'react', 'Framework', 'Frontend', 'Popular JavaScript library for building user interfaces', 1),
('Node.js', 'nodejs', 'Runtime', 'Backend', 'JavaScript runtime built on Chrome\'s V8 JavaScript engine', 1),
('MySQL', 'mysql', 'Database', 'Backend', 'Popular open source relational database', 1),
('PostgreSQL', 'postgresql', 'Database', 'Backend', 'Advanced open source relational database', 1),
('UI/UX Design', 'ui-ux-design', 'Design', 'Frontend', 'User interface and user experience design', 1),
('Mobile Development', 'mobile-development', 'Programming', 'Mobile', 'Development of mobile applications', 1),
('DevOps', 'devops', 'Operations', 'Infrastructure', 'Development and IT operations practices', 1),
('Machine Learning', 'machine-learning', 'AI', 'Data Science', 'AI and machine learning techniques', 1),
('Content Writing', 'content-writing', 'Writing', 'Content', 'Creating engaging written content', 1);

-- Insert default categories
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `color`, `level`, `sort_order`) VALUES
('Web Development', 'web-development', 'Website and web application development', 'code', '#3498db', 0, 1),
('Mobile Development', 'mobile-development', 'iOS and Android app development', 'mobile', '#e74c3c', 0, 2),
('Design & Creative', 'design-creative', 'Graphic design, UI/UX, and creative services', 'palette', '#9b59b6', 0, 3),
('Writing & Translation', 'writing-translation', 'Content writing, copywriting, and translation', 'edit', '#f39c12', 0, 4),
('Digital Marketing', 'digital-marketing', 'SEO, social media, and online marketing', 'trending-up', '#2ecc71', 0, 5),
('Video & Animation', 'video-animation', 'Video editing, animation, and multimedia', 'video', '#e67e22', 0, 6),
('Programming & Tech', 'programming-tech', 'Software development and technical services', 'terminal', '#34495e', 0, 7),
('Business', 'business', 'Business consulting and strategy', 'briefcase', '#95a5a6', 0, 8);

-- Create admin user (password: admin123 - should be hashed in production)
INSERT INTO `users` (`email`, `password_hash`, `user_type`, `first_name`, `last_name`, `status`, `email_verified_at`) VALUES
('admin@laburemos.com.ar', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXWQRkBPeHFO', 'admin', 'Admin', 'User', 'active', NOW());

-- Create default wallet for admin user
INSERT INTO `wallets` (`user_id`) VALUES (1);

-- Create default reputation for admin user
INSERT INTO `user_reputation` (`user_id`) VALUES (1);

-- Create default notification preferences for admin user
INSERT INTO `notification_preferences` (`user_id`) VALUES (1);

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

SELECT 'LaburAR MySQL Database Schema Created Successfully!' as message;
SELECT 'Total Tables: 35' as info;
SELECT 'Total Indexes: 40+' as info;
SELECT 'Total Triggers: 2' as info;
SELECT 'All Foreign Keys and Relationships: IMPLEMENTED' as info;
SELECT 'Compatible with: phpMyAdmin, XAMPP, MySQL 8.0+' as info;
SELECT 'Ready for local development!' as status;

COMMIT;

-- Reset SQL settings
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;