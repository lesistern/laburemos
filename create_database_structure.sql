-- =====================================================
-- LaburAR Database Complete Structure Creation Script
-- Generated from Prisma Schema - MySQL Version
-- Database: laburemos_db
-- =====================================================

USE laburemos_db;

-- Disable foreign key checks during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- DROP ALL TABLES (IF EXISTS) - For Clean Creation
-- =====================================================

DROP TABLE IF EXISTS user_alpha;
DROP TABLE IF EXISTS user_analytics;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS support_responses;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS dispute_messages;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS saved_searches;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS project_attachments;
DROP TABLE IF EXISTS file_uploads;
DROP TABLE IF EXISTS badge_milestones;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS badge_categories;
DROP TABLE IF EXISTS user_reputation;
DROP TABLE IF EXISTS review_responses;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS withdrawal_requests;
DROP TABLE IF EXISTS escrow_accounts;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS video_calls;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS proposals;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS portfolio_items;
DROP TABLE IF EXISTS freelancer_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS freelancer_profiles;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

-- =====================================================
-- USER AUTHENTICATION & PROFILES
-- =====================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('CLIENT', 'FREELANCER', 'ADMIN') NOT NULL DEFAULT 'CLIENT',
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(255),
    country VARCHAR(255) DEFAULT 'Argentina',
    city VARCHAR(255),
    profile_image TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'VERIFIED') NOT NULL DEFAULT 'ACTIVE',
    email_verified_at DATETIME,
    phone_verified_at DATETIME,
    last_active DATETIME,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_last_active (last_active)
);

CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(255),
    user_agent TEXT,
    device_info JSON,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(255),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE freelancer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    title VARCHAR(255),
    hourly_rate DECIMAL(10, 2),
    availability ENUM('AVAILABLE', 'BUSY', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    timezone VARCHAR(255),
    portfolio_url TEXT,
    languages JSON,
    certifications JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_availability (availability),
    INDEX idx_hourly_rate (hourly_rate)
);

-- =====================================================
-- SKILLS SYSTEM
-- =====================================================

CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(255),
    subcategory VARCHAR(255),
    description TEXT,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    usage_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_is_trending (is_trending),
    INDEX idx_usage_count (usage_count)
);

CREATE TABLE freelancer_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL,
    years_experience INT NOT NULL DEFAULT 0,
    endorsed_count INT NOT NULL DEFAULT 0,
    hourly_rate_skill DECIMAL(10, 2),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_id),
    INDEX idx_user_id (user_id),
    INDEX idx_skill_id (skill_id),
    INDEX idx_proficiency_level (proficiency_level)
);

-- =====================================================
-- CATEGORIES & SERVICES
-- =====================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    parent_id INT,
    sort_order INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_slug (slug),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_level (level)
);

CREATE TABLE portfolio_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    project_url TEXT,
    media_files JSON,
    technologies_used JSON,
    completion_date DATE,
    client_name VARCHAR(255),
    project_value DECIMAL(10, 2),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_is_featured (is_featured),
    INDEX idx_view_count (view_count)
);

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    delivery_time INT NOT NULL,
    requirements TEXT,
    gallery_images JSON,
    faq JSON,
    extras JSON,
    total_orders INT NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_base_price (base_price),
    INDEX idx_total_orders (total_orders),
    INDEX idx_is_featured (is_featured)
);

CREATE TABLE service_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    package_type ENUM('BASIC', 'STANDARD', 'PREMIUM') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    delivery_time INT NOT NULL,
    features JSON,
    max_revisions INT NOT NULL DEFAULT 1,
    extras_included JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_package (service_id, package_type),
    INDEX idx_service_id (service_id),
    INDEX idx_package_type (package_type)
);

-- =====================================================
-- PROJECTS & PROPOSALS
-- =====================================================

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    freelancer_id INT,
    category_id INT NOT NULL,
    service_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    budget_type ENUM('FIXED', 'HOURLY') NOT NULL DEFAULT 'FIXED',
    deadline DATE,
    status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'DRAFT',
    required_skills JSON,
    experience_level ENUM('ENTRY', 'INTERMEDIATE', 'EXPERT') NOT NULL DEFAULT 'INTERMEDIATE',
    proposal_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    published_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    INDEX idx_client_id (client_id),
    INDEX idx_freelancer_id (freelancer_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_budget_type (budget_type),
    INDEX idx_experience_level (experience_level),
    INDEX idx_created_at (created_at)
);

CREATE TABLE proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    service_package_id INT,
    cover_letter TEXT NOT NULL,
    proposed_amount DECIMAL(10, 2) NOT NULL,
    proposed_timeline INT NOT NULL,
    milestones JSON,
    attachments JSON,
    status ENUM('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'PENDING',
    client_viewed_at DATETIME,
    responded_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_package_id) REFERENCES service_packages(id),
    UNIQUE KEY unique_project_freelancer (project_id, freelancer_id),
    INDEX idx_project_id (project_id),
    INDEX idx_freelancer_id (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE project_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    deliverables JSON,
    completed_at DATETIME,
    approved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- =====================================================
-- COMMUNICATION SYSTEM
-- =====================================================

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    participant_1_id INT NOT NULL,
    participant_2_id INT NOT NULL,
    last_message_id INT,
    last_message_at DATETIME,
    unread_count_p1 INT NOT NULL DEFAULT 0,
    unread_count_p2 INT NOT NULL DEFAULT 0,
    is_archived_p1 BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived_p2 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (participant_1_id) REFERENCES users(id),
    FOREIGN KEY (participant_2_id) REFERENCES users(id),
    UNIQUE KEY unique_project_participants (project_id, participant_1_id, participant_2_id),
    INDEX idx_participant_1_id (participant_1_id),
    INDEX idx_participant_2_id (participant_2_id),
    INDEX idx_last_message_at (last_message_at)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_content TEXT NOT NULL,
    message_type ENUM('TEXT', 'FILE', 'IMAGE', 'SYSTEM', 'MILESTONE', 'PAYMENT') NOT NULL DEFAULT 'TEXT',
    attachments JSON,
    metadata JSON,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_message_type (message_type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE video_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    initiator_id INT NOT NULL,
    room_id VARCHAR(255) NOT NULL UNIQUE,
    duration_minutes INT,
    status ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'SCHEDULED',
    recording_url JSON,
    scheduled_at DATETIME,
    started_at DATETIME,
    ended_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_initiator_id (initiator_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- =====================================================
-- PAYMENTS SYSTEM
-- =====================================================

CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    available_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    escrow_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    lifetime_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
    lifetime_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
    last_transaction_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('CREDIT_CARD', 'DEBIT_CARD', 'BANK_ACCOUNT', 'MERCADOPAGO', 'PAYPAL', 'STRIPE') NOT NULL,
    provider VARCHAR(255),
    external_id VARCHAR(255),
    last_four VARCHAR(4),
    brand VARCHAR(255),
    billing_details JSON,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSON,
    verified_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_default (is_default)
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT,
    to_user_id INT,
    project_id INT,
    milestone_id INT,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    external_transaction_id VARCHAR(255),
    type ENUM('PAYMENT', 'REFUND', 'WITHDRAWAL', 'FEE', 'BONUS', 'ESCROW_FUND', 'ESCROW_RELEASE') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(255),
    gateway VARCHAR(255),
    gateway_response JSON,
    metadata JSON,
    description TEXT,
    processed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_to_user_id (to_user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE escrow_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    milestone_id INT,
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status ENUM('CREATED', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED') NOT NULL DEFAULT 'CREATED',
    release_conditions TEXT,
    funded_at DATETIME,
    released_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id),
    UNIQUE KEY unique_project_milestone (project_id, milestone_id),
    INDEX idx_project_id (project_id),
    INDEX idx_client_id (client_id),
    INDEX idx_freelancer_id (freelancer_id),
    INDEX idx_status (status)
);

CREATE TABLE withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method_id INT NOT NULL,
    payment_details JSON,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    processed_by_admin_id INT,
    processed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (processed_by_admin_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- REVIEWS & REPUTATION
-- =====================================================

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    reviewer_type ENUM('CLIENT', 'FREELANCER') NOT NULL,
    rating SMALLINT NOT NULL,
    comment TEXT,
    criteria_ratings JSON,
    pros_cons JSON,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    helpful_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id),
    UNIQUE KEY unique_project_reviewer (project_id, reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_rating (rating),
    INDEX idx_reviewer_type (reviewer_type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE review_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

CREATE TABLE user_reputation (
    user_id INT PRIMARY KEY,
    overall_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    completed_projects INT NOT NULL DEFAULT 0,
    success_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    response_time_avg_hours INT NOT NULL DEFAULT 0,
    client_satisfaction DECIMAL(5, 2) NOT NULL DEFAULT 0,
    quality_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    professionalism_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    communication_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    total_earnings INT NOT NULL DEFAULT 0,
    repeat_clients INT NOT NULL DEFAULT 0,
    last_calculated DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_overall_rating (overall_rating),
    INDEX idx_completed_projects (completed_projects),
    INDEX idx_success_rate (success_rate)
);

-- =====================================================
-- GAMIFICATION SYSTEM
-- =====================================================

CREATE TABLE badge_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_sort_order (sort_order)
);

CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    rarity ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'EXCLUSIVE') NOT NULL DEFAULT 'COMMON',
    requirements JSON,
    rewards JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_automatic BOOLEAN NOT NULL DEFAULT FALSE,
    earned_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES badge_categories(id),
    INDEX idx_category_id (category_id),
    INDEX idx_slug (slug),
    INDEX idx_rarity (rarity),
    INDEX idx_is_automatic (is_automatic)
);

CREATE TABLE user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progress_data JSON,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    earn_description TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_badge_id (badge_id),
    INDEX idx_earned_at (earned_at)
);

CREATE TABLE badge_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    badge_id INT NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    requirements JSON,
    sort_order INT NOT NULL DEFAULT 0,
    progress_weight DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    INDEX idx_badge_id (badge_id),
    INDEX idx_sort_order (sort_order)
);

-- =====================================================
-- FILE MANAGEMENT
-- =====================================================

CREATE TABLE file_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entity_type ENUM('PROFILE', 'PROJECT', 'MESSAGE', 'PORTFOLIO', 'SERVICE', 'PROPOSAL', 'DISPUTE', 'REVIEW') NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    storage_provider ENUM('LOCAL', 'S3', 'CLOUDINARY', 'CDN') NOT NULL,
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
    download_count INT NOT NULL DEFAULT 0,
    virus_scan_status ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR') NOT NULL DEFAULT 'PENDING',
    metadata JSON,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type_id (entity_type, entity_id),
    INDEX idx_storage_provider (storage_provider),
    INDEX idx_is_temporary (is_temporary),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE project_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    file_upload_id INT NOT NULL,
    attachment_type ENUM('REQUIREMENT', 'DELIVERABLE', 'REFERENCE', 'FEEDBACK', 'CONTRACT') NOT NULL,
    uploaded_by_id INT NOT NULL,
    description TEXT,
    is_final_deliverable BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at DATETIME,
    approved_by_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (file_upload_id) REFERENCES file_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
    FOREIGN KEY (approved_by_id) REFERENCES users(id),
    INDEX idx_project_id (project_id),
    INDEX idx_file_upload_id (file_upload_id),
    INDEX idx_attachment_type (attachment_type),
    INDEX idx_uploaded_by_id (uploaded_by_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('SYSTEM', 'PROJECT', 'PAYMENT', 'MESSAGE', 'REVIEW', 'BADGE', 'MILESTONE', 'DISPUTE') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    data JSON,
    action_buttons JSON,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

CREATE TABLE notification_preferences (
    user_id INT PRIMARY KEY,
    email_notifications JSON,
    push_notifications JSON,
    sms_notifications JSON,
    frequency ENUM('INSTANT', 'HOURLY', 'DAILY', 'WEEKLY') NOT NULL DEFAULT 'INSTANT',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(255),
    marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- USER FEATURES
-- =====================================================

CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entity_type ENUM('FREELANCER', 'SERVICE', 'PROJECT', 'CATEGORY') NOT NULL,
    entity_id INT NOT NULL,
    notes TEXT,
    tags JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_entity (user_id, entity_type, entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type_id (entity_type, entity_id)
);

CREATE TABLE saved_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    search_name VARCHAR(255) NOT NULL,
    search_criteria JSON NOT NULL,
    alert_frequency ENUM('NEVER', 'DAILY', 'WEEKLY', 'INSTANT') NOT NULL DEFAULT 'NEVER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    results_count INT NOT NULL DEFAULT 0,
    last_alert_sent DATETIME,
    last_executed DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_alert_frequency (alert_frequency),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- DISPUTES & SUPPORT
-- =====================================================

CREATE TABLE disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    initiator_id INT NOT NULL,
    respondent_id INT NOT NULL,
    reason ENUM('PAYMENT', 'QUALITY', 'COMMUNICATION', 'SCOPE', 'DEADLINE', 'REFUND') NOT NULL,
    description TEXT NOT NULL,
    disputed_amount DECIMAL(12, 2),
    status ENUM('OPEN', 'INVESTIGATING', 'MEDIATION', 'RESOLVED', 'CLOSED', 'ESCALATED') NOT NULL DEFAULT 'OPEN',
    resolution_type ENUM('REFUND', 'PARTIAL_REFUND', 'REVISION', 'MEDIATION', 'ARBITRATION'),
    evidence JSON,
    resolution TEXT,
    admin_id INT,
    admin_assigned_at DATETIME,
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id),
    FOREIGN KEY (respondent_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_project_id (project_id),
    INDEX idx_initiator_id (initiator_id),
    INDEX idx_respondent_id (respondent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE dispute_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispute_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    attachments JSON,
    is_admin_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_dispute_id (dispute_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_number VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('TECHNICAL', 'PAYMENT', 'ACCOUNT', 'DISPUTE', 'GENERAL', 'VERIFICATION') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    assigned_admin_id INT,
    attachments JSON,
    first_response_at DATETIME,
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
);

CREATE TABLE support_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    response TEXT NOT NULL,
    is_admin_response BOOLEAN NOT NULL DEFAULT FALSE,
    attachments JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- ANALYTICS & LOGS
-- =====================================================

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255),
    entity_id INT,
    data JSON,
    ip_address VARCHAR(255),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type_id (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE user_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    profile_views INT NOT NULL DEFAULT 0,
    service_views INT NOT NULL DEFAULT 0,
    message_sent INT NOT NULL DEFAULT 0,
    proposals_sent INT NOT NULL DEFAULT 0,
    projects_created INT NOT NULL DEFAULT 0,
    earnings_day DECIMAL(10, 2) NOT NULL DEFAULT 0,
    login_count INT NOT NULL DEFAULT 0,
    active_minutes INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
);

-- =====================================================
-- NDA (NON-DISCLOSURE AGREEMENT) SYSTEM
-- =====================================================

CREATE TABLE user_alpha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    user_agent VARCHAR(500),
    accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nda_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    
    UNIQUE KEY unique_ip_device (ip_address, device_fingerprint),
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_accepted_at (accepted_at)
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF SCRIPT
-- =====================================================