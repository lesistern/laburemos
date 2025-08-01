-- =====================================================================
-- LABUREMOS Complete Platform Database Schema
-- Enterprise Grade - Authentication & Profile System
-- Generated: 2025-01-18
-- Version: 1.0 (Complete Platform)
-- =====================================================================

-- Database creation and configuration
CREATE DATABASE IF NOT EXISTS laburar_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE laburar_platform;

-- =====================================================================
-- CORE AUTHENTICATION TABLES
-- =====================================================================

-- Main users table (base authentication)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('freelancer', 'client') NOT NULL,
    status ENUM('pending', 'active', 'suspended', 'deleted') DEFAULT 'pending',
    
    -- Email verification
    email_verified_at TIMESTAMP NULL,
    email_verification_token VARCHAR(255) NULL,
    
    -- Phone verification
    phone VARCHAR(20) NULL,
    phone_verified_at TIMESTAMP NULL,
    phone_verification_code VARCHAR(10) NULL,
    phone_verification_expires_at TIMESTAMP NULL,
    
    -- Two Factor Authentication
    two_factor_secret VARCHAR(255) NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_backup_codes JSON NULL,
    
    -- Security tracking
    last_login_at TIMESTAMP NULL,
    login_attempts TINYINT UNSIGNED DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires_at TIMESTAMP NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_email_verified (email_verified_at),
    INDEX idx_phone_verified (phone_verified_at),
    INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB;

-- =====================================================================
-- EXTENDED PROFILE TABLES
-- =====================================================================

-- Freelancer professional profiles
CREATE TABLE freelancers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Basic profile info
    professional_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NULL,
    bio TEXT NULL,
    
    -- Pricing and availability
    hourly_rate_min DECIMAL(10,2) UNSIGNED NULL,
    hourly_rate_max DECIMAL(10,2) UNSIGNED NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    availability_status ENUM('available', 'busy', 'unavailable') DEFAULT 'available',
    
    -- Location and legal
    location VARCHAR(255) NULL,
    cuil VARCHAR(11) NULL UNIQUE,
    tax_condition ENUM('monotributo', 'responsable_inscripto', 'exento') NULL,
    
    -- Portfolio and media
    portfolio_description TEXT NULL,
    profile_image VARCHAR(500) NULL,
    cover_image VARCHAR(500) NULL,
    website_url VARCHAR(500) NULL,
    
    -- Performance metrics
    response_time_avg INT UNSIGNED NULL COMMENT 'Average response time in minutes',
    completion_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage of completed projects',
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    total_projects INT UNSIGNED DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_professional_name (professional_name),
    INDEX idx_location (location),
    INDEX idx_cuil (cuil),
    INDEX idx_availability (availability_status),
    INDEX idx_hourly_rate (hourly_rate_min, hourly_rate_max),
    INDEX idx_completion_rate (completion_rate),
    
    -- Full text search
    FULLTEXT(professional_name, title, bio, portfolio_description)
) ENGINE=InnoDB;

-- Client company profiles
CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Company information
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NULL,
    company_size ENUM('1-10', '11-50', '51-200', '201-500', '500+') NULL,
    
    -- Legal and fiscal
    cuit VARCHAR(11) NULL UNIQUE,
    fiscal_address TEXT NULL,
    
    -- Contact information
    contact_person VARCHAR(255) NULL,
    position VARCHAR(255) NULL,
    
    -- Budget and preferences
    budget_range_min DECIMAL(12,2) UNSIGNED NULL,
    budget_range_max DECIMAL(12,2) UNSIGNED NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    preferred_freelancer_types JSON NULL,
    
    -- Company media
    company_logo VARCHAR(500) NULL,
    company_description TEXT NULL,
    company_website VARCHAR(500) NULL,
    
    -- Business metrics
    projects_completed INT UNSIGNED DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    avg_project_budget DECIMAL(12,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_company_name (company_name),
    INDEX idx_industry (industry),
    INDEX idx_cuit (cuit),
    INDEX idx_company_size (company_size),
    INDEX idx_budget_range (budget_range_min, budget_range_max),
    
    -- Full text search
    FULLTEXT(company_name, company_description)
) ENGINE=InnoDB;

-- =====================================================================
-- SKILLS AND VERIFICATION SYSTEM
-- =====================================================================

-- Master skills catalog
CREATE TABLE skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50) NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    market_demand ENUM('low', 'medium', 'high', 'very_high') DEFAULT 'medium',
    description TEXT NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_category (category),
    INDEX idx_subcategory (subcategory),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_market_demand (market_demand),
    INDEX idx_is_active (is_active),
    
    -- Full text search
    FULLTEXT(name, description)
) ENGINE=InnoDB;

-- Freelancer skills with verification
CREATE TABLE freelancer_skills (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    freelancer_id BIGINT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    
    -- Skill proficiency
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
    years_experience TINYINT UNSIGNED NULL,
    
    -- Verification status
    verified_by BIGINT UNSIGNED NULL COMMENT 'User ID who verified this skill',
    verified_at TIMESTAMP NULL,
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
    
    -- Supporting evidence
    portfolio_samples JSON NULL COMMENT 'Array of portfolio item IDs',
    certification_url VARCHAR(500) NULL,
    certification_name VARCHAR(255) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint
    UNIQUE KEY unique_freelancer_skill (freelancer_id, skill_id),
    
    -- Indexes
    INDEX idx_proficiency (proficiency_level),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verified_at (verified_at),
    INDEX idx_years_experience (years_experience)
) ENGINE=InnoDB;

-- =====================================================================
-- PORTFOLIO AND MEDIA SYSTEM
-- =====================================================================

-- Portfolio items for freelancers
CREATE TABLE portfolio_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    freelancer_id BIGINT UNSIGNED NOT NULL,
    
    -- Portfolio item details
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    project_url VARCHAR(500) NULL,
    
    -- Project metadata
    project_duration_days INT UNSIGNED NULL,
    budget_range_min DECIMAL(12,2) UNSIGNED NULL,
    budget_range_max DECIMAL(12,2) UNSIGNED NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Skills used (JSON array of skill IDs)
    skills_used JSON NULL,
    
    -- Client testimonial
    client_testimonial TEXT NULL,
    client_name VARCHAR(255) NULL,
    client_company VARCHAR(255) NULL,
    
    -- Display options
    featured BOOLEAN DEFAULT FALSE,
    display_order INT UNSIGNED DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_freelancer_featured (freelancer_id, featured),
    INDEX idx_display_order (display_order),
    INDEX idx_is_public (is_public),
    INDEX idx_budget_range (budget_range_min, budget_range_max),
    
    -- Full text search
    FULLTEXT(title, description, client_testimonial)
) ENGINE=InnoDB;

-- Media files for portfolios and profiles
CREATE TABLE media_files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Ownership
    owner_id BIGINT UNSIGNED NOT NULL,
    owner_type ENUM('user', 'freelancer', 'client', 'portfolio_item') NOT NULL,
    related_id BIGINT UNSIGNED NULL COMMENT 'ID of related entity (portfolio_item, etc)',
    
    -- File information
    file_type ENUM('image', 'video', 'document', 'audio') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT UNSIGNED NOT NULL COMMENT 'File size in bytes',
    mime_type VARCHAR(100) NOT NULL,
    
    -- Image/video specific
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    duration INT UNSIGNED NULL COMMENT 'Duration in seconds for video/audio',
    
    -- SEO and accessibility
    alt_text VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    
    -- Processing status
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    thumbnail_path VARCHAR(500) NULL,
    
    -- Security
    virus_scan_status ENUM('pending', 'clean', 'infected', 'error') DEFAULT 'pending',
    virus_scan_at TIMESTAMP NULL,
    
    -- Metadata
    metadata JSON NULL COMMENT 'EXIF data, etc',
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_owner (owner_id, owner_type),
    INDEX idx_related (related_id),
    INDEX idx_file_type (file_type),
    INDEX idx_processing_status (processing_status),
    INDEX idx_virus_scan (virus_scan_status),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB;

-- =====================================================================
-- VERIFICATION AND REPUTATION SYSTEM
-- =====================================================================

-- User verifications (identity, documents, etc.)
CREATE TABLE verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Verification type
    verification_type ENUM('email', 'phone', 'identity', 'cuil_cuit', 'address', 'skill', 'reference') NOT NULL,
    status ENUM('pending', 'in_review', 'verified', 'rejected', 'expired') DEFAULT 'pending',
    
    -- Verification data (encrypted JSON)
    verification_data JSON NULL COMMENT 'Encrypted verification details',
    
    -- Verification process
    verified_by BIGINT UNSIGNED NULL COMMENT 'Admin/system user who verified',
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Documents and evidence
    document_ids JSON NULL COMMENT 'Array of media_file IDs',
    
    -- External verification
    external_reference VARCHAR(255) NULL COMMENT 'AFIP reference, etc',
    external_verified_at TIMESTAMP NULL,
    
    -- Notes and metadata
    notes TEXT NULL,
    metadata JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_type (user_id, verification_type),
    INDEX idx_status (status),
    INDEX idx_verified_at (verified_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_external_reference (external_reference)
) ENGINE=InnoDB;

-- Reputation scoring system
CREATE TABLE reputation_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Overall reputation
    overall_score DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Overall score 0.00-5.00',
    
    -- Detailed scores
    communication_score DECIMAL(3,2) DEFAULT 0.00,
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    timeliness_score DECIMAL(3,2) DEFAULT 0.00,
    professionalism_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Review statistics
    total_reviews INT UNSIGNED DEFAULT 0,
    five_star_count INT UNSIGNED DEFAULT 0,
    four_star_count INT UNSIGNED DEFAULT 0,
    three_star_count INT UNSIGNED DEFAULT 0,
    two_star_count INT UNSIGNED DEFAULT 0,
    one_star_count INT UNSIGNED DEFAULT 0,
    
    -- Calculation metadata
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_version VARCHAR(10) DEFAULT '1.0',
    
    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_user_reputation (user_id),
    
    -- Indexes
    INDEX idx_overall_score (overall_score),
    INDEX idx_total_reviews (total_reviews),
    INDEX idx_calculated_at (calculated_at)
) ENGINE=InnoDB;

-- =====================================================================
-- AUDIT AND SECURITY SYSTEM
-- =====================================================================

-- Comprehensive audit logging
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- User and session
    user_id BIGINT UNSIGNED NULL,
    session_id VARCHAR(255) NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL COMMENT 'login, logout, profile_update, etc',
    resource_type VARCHAR(50) NULL COMMENT 'user, freelancer, portfolio_item',
    resource_id BIGINT UNSIGNED NULL,
    
    -- Request details
    ip_address VARCHAR(45) NOT NULL COMMENT 'Supports IPv6',
    user_agent TEXT NULL,
    request_method VARCHAR(10) NULL,
    request_uri VARCHAR(500) NULL,
    
    -- Changes tracking
    old_values JSON NULL COMMENT 'Previous values for updates',
    new_values JSON NULL COMMENT 'New values for updates',
    
    -- Context and metadata
    context JSON NULL COMMENT 'Additional context data',
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    
    -- Compliance and legal
    gdpr_lawful_basis VARCHAR(50) NULL,
    data_subject_rights_impact TEXT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_action (user_id, action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_severity (severity),
    
    -- Partitioning ready
    INDEX idx_created_at_partition (created_at)
) ENGINE=InnoDB;

-- Login attempt tracking
CREATE TABLE login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    
    -- Attempt details
    success BOOLEAN NOT NULL,
    failure_reason ENUM('invalid_credentials', 'account_locked', 'account_suspended', 'too_many_attempts', '2fa_failed') NULL,
    
    -- Security context
    country_code VARCHAR(2) NULL,
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score TINYINT UNSIGNED DEFAULT 0 COMMENT '0-100 risk score',
    
    -- Timestamps
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email_ip (email, ip_address),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_success (success),
    INDEX idx_is_suspicious (is_suspicious),
    INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB;

-- =====================================================================
-- USER PREFERENCES AND INTEGRATION
-- =====================================================================

-- User preferences and settings
CREATE TABLE user_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Notification preferences
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    
    -- Notification types
    notify_new_messages BOOLEAN DEFAULT TRUE,
    notify_project_updates BOOLEAN DEFAULT TRUE,
    notify_payment_updates BOOLEAN DEFAULT TRUE,
    notify_review_received BOOLEAN DEFAULT TRUE,
    notify_marketing BOOLEAN DEFAULT FALSE,
    
    -- Localization
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    language VARCHAR(5) DEFAULT 'es_AR',
    currency VARCHAR(3) DEFAULT 'ARS',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    
    -- Privacy settings
    profile_visibility ENUM('public', 'registered_users', 'private') DEFAULT 'public',
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_seen BOOLEAN DEFAULT TRUE,
    allow_contact_form BOOLEAN DEFAULT TRUE,
    
    -- Marketing and analytics
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT TRUE,
    cookie_consent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_user_preferences (user_id),
    
    -- Indexes
    INDEX idx_timezone (timezone),
    INDEX idx_language (language),
    INDEX idx_profile_visibility (profile_visibility)
) ENGINE=InnoDB;

-- API tokens for integrations
CREATE TABLE api_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Token details
    token_name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_prefix VARCHAR(20) NOT NULL COMMENT 'First 20 chars for identification',
    
    -- Permissions (JSON array)
    permissions JSON NOT NULL DEFAULT '[]',
    
    -- Usage tracking
    last_used_at TIMESTAMP NULL,
    usage_count INT UNSIGNED DEFAULT 0,
    
    -- Security
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Rate limiting
    rate_limit_per_minute INT UNSIGNED DEFAULT 60,
    rate_limit_per_hour INT UNSIGNED DEFAULT 1000,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_tokens (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB;

-- =====================================================================
-- FUTURE INTEGRATION PREPARATION
-- =====================================================================

-- Categories for services/projects (future)
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT UNSIGNED NULL,
    description TEXT NULL,
    icon VARCHAR(100) NULL,
    sort_order INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- SEO
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_parent (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB;

-- Notifications system (future)
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    -- Notification details
    type VARCHAR(50) NOT NULL COMMENT 'message, project_update, payment, etc',
    title VARCHAR(255) NOT NULL,
    message TEXT NULL,
    
    -- Action and linking
    action_url VARCHAR(500) NULL,
    action_text VARCHAR(100) NULL,
    
    -- Related entities
    related_type VARCHAR(50) NULL,
    related_id BIGINT UNSIGNED NULL,
    
    -- Status
    read_at TIMESTAMP NULL,
    is_important BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_unread (user_id, read_at),
    INDEX idx_type (type),
    INDEX idx_is_important (is_important),
    INDEX idx_created_at (created_at),
    INDEX idx_related (related_type, related_id)
) ENGINE=InnoDB;

-- =====================================================================
-- INITIAL DATA SEEDING
-- =====================================================================

-- Insert basic skill categories
INSERT INTO skills (name, category, subcategory, difficulty_level, market_demand, description) VALUES
-- Programming & Development
('PHP', 'desarrollo', 'backend', 'intermediate', 'high', 'Lenguaje de programación para desarrollo web backend'),
('JavaScript', 'desarrollo', 'frontend', 'intermediate', 'very_high', 'Lenguaje de programación para frontend y aplicaciones web'),
('React', 'desarrollo', 'frontend', 'advanced', 'very_high', 'Biblioteca de JavaScript para interfaces de usuario'),
('Laravel', 'desarrollo', 'backend', 'advanced', 'high', 'Framework PHP para desarrollo web'),
('MySQL', 'desarrollo', 'database', 'intermediate', 'high', 'Sistema de gestión de bases de datos relacionales'),

-- Design
('Adobe Photoshop', 'diseño', 'grafico', 'intermediate', 'high', 'Software de edición de imágenes y diseño gráfico'),
('Adobe Illustrator', 'diseño', 'grafico', 'intermediate', 'high', 'Software de diseño vectorial'),
('Figma', 'diseño', 'ui_ux', 'intermediate', 'very_high', 'Herramienta de diseño de interfaces colaborativa'),
('UI Design', 'diseño', 'ui_ux', 'advanced', 'very_high', 'Diseño de interfaces de usuario'),
('UX Design', 'diseño', 'ui_ux', 'expert', 'very_high', 'Diseño de experiencia de usuario'),

-- Marketing
('Google Ads', 'marketing', 'digital', 'intermediate', 'high', 'Plataforma de publicidad de Google'),
('Facebook Ads', 'marketing', 'digital', 'intermediate', 'high', 'Publicidad en redes sociales de Meta'),
('SEO', 'marketing', 'digital', 'advanced', 'very_high', 'Optimización para motores de búsqueda'),
('Content Marketing', 'marketing', 'contenido', 'intermediate', 'high', 'Marketing de contenidos'),
('Social Media', 'marketing', 'social', 'beginner', 'medium', 'Gestión de redes sociales'),

-- Writing & Translation
('Redacción Comercial', 'redaccion', 'comercial', 'intermediate', 'high', 'Escritura para fines comerciales y marketing'),
('Traducción EN-ES', 'traduccion', 'idiomas', 'advanced', 'medium', 'Traducción inglés-español'),
('Copywriting', 'redaccion', 'publicitaria', 'advanced', 'high', 'Escritura persuasiva para publicidad'),

-- Other
('WordPress', 'desarrollo', 'cms', 'beginner', 'medium', 'Sistema de gestión de contenidos'),
('E-commerce', 'desarrollo', 'web', 'intermediate', 'high', 'Desarrollo de tiendas online'),
('Contabilidad', 'finanzas', 'contabilidad', 'intermediate', 'medium', 'Servicios contables y financieros');

-- Insert basic categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Desarrollo Web', 'desarrollo-web', 'Servicios de programación y desarrollo web', 1),
('Diseño Gráfico', 'diseno-grafico', 'Servicios de diseño visual y gráfico', 2),
('Marketing Digital', 'marketing-digital', 'Servicios de marketing online y publicidad', 3),
('Redacción y Traducción', 'redaccion-traduccion', 'Servicios de escritura y traducción', 4),
('Consultoría', 'consultoria', 'Servicios de consultoría empresarial', 5);

-- =====================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================

-- Complete user profile view
CREATE VIEW user_profiles AS
SELECT 
    u.id as user_id,
    u.email,
    u.user_type,
    u.status,
    u.email_verified_at,
    u.phone_verified_at,
    u.two_factor_enabled,
    u.last_login_at,
    u.created_at,
    
    -- Freelancer data
    f.professional_name,
    f.title as freelancer_title,
    f.bio as freelancer_bio,
    f.hourly_rate_min,
    f.hourly_rate_max,
    f.location,
    f.cuil,
    f.completion_rate,
    f.total_projects as freelancer_projects,
    f.profile_image,
    
    -- Client data
    c.company_name,
    c.industry,
    c.company_size,
    c.cuit,
    c.contact_person,
    c.budget_range_min,
    c.budget_range_max,
    c.projects_completed as client_projects,
    c.company_logo,
    
    -- Reputation
    r.overall_score,
    r.total_reviews
    
FROM users u
LEFT JOIN freelancers f ON u.id = f.user_id AND u.user_type = 'freelancer'
LEFT JOIN clients c ON u.id = c.user_id AND u.user_type = 'client'
LEFT JOIN reputation_scores r ON u.id = r.user_id;

-- Freelancer search view
CREATE VIEW freelancer_search AS
SELECT 
    f.id as freelancer_id,
    f.user_id,
    f.professional_name,
    f.title,
    f.bio,
    f.hourly_rate_min,
    f.hourly_rate_max,
    f.location,
    f.availability_status,
    f.completion_rate,
    f.total_projects,
    f.profile_image,
    
    -- User data
    u.email_verified_at,
    u.phone_verified_at,
    u.status as user_status,
    
    -- Reputation
    r.overall_score,
    r.total_reviews,
    
    -- Skills (aggregated)
    GROUP_CONCAT(DISTINCT s.name ORDER BY fs.proficiency_level DESC) as skills,
    GROUP_CONCAT(DISTINCT s.category ORDER BY s.category) as skill_categories,
    
    -- Verification count
    COUNT(DISTINCT v.id) as verification_count
    
FROM freelancers f
JOIN users u ON f.user_id = u.id
LEFT JOIN reputation_scores r ON f.user_id = r.user_id
LEFT JOIN freelancer_skills fs ON f.id = fs.freelancer_id
LEFT JOIN skills s ON fs.skill_id = s.id
LEFT JOIN verifications v ON f.user_id = v.user_id AND v.status = 'verified'
WHERE u.status = 'active'
GROUP BY f.id;

-- =====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

-- Composite indexes for common queries
CREATE INDEX idx_freelancers_search ON freelancers (availability_status, hourly_rate_min, hourly_rate_max, completion_rate);
CREATE INDEX idx_clients_budget ON clients (budget_range_min, budget_range_max, company_size);
CREATE INDEX idx_portfolio_featured_public ON portfolio_items (freelancer_id, featured, is_public);
CREATE INDEX idx_audit_user_date ON audit_logs (user_id, created_at);
CREATE INDEX idx_notifications_unread ON notifications (user_id, read_at, is_important);

-- Full-text search indexes (already created in table definitions)
-- Additional performance considerations will be added based on actual usage patterns

-- =====================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================

-- Update freelancer completion rate when projects are completed (future)
DELIMITER //
CREATE TRIGGER update_freelancer_stats
AFTER UPDATE ON freelancers
FOR EACH ROW
BEGIN
    -- This will be expanded when project tables are added
    -- For now, just ensure updated_at is current
    IF NEW.total_projects != OLD.total_projects THEN
        SET NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
END;//
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================================

-- Procedure to safely delete user and all related data
DELIMITER //
CREATE PROCEDURE DeleteUserCompletely(IN user_id_param BIGINT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Log the deletion
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, severity)
    VALUES (user_id_param, 'user_deletion', 'user', user_id_param, 'SYSTEM', 'info');
    
    -- Delete will cascade automatically due to foreign key constraints
    DELETE FROM users WHERE id = user_id_param;
    
    COMMIT;
END;//
DELIMITER ;

-- Procedure to calculate reputation score
DELIMITER //
CREATE PROCEDURE CalculateReputationScore(IN user_id_param BIGINT)
BEGIN
    -- This will be implemented when review system is added
    -- For now, just ensure the record exists
    INSERT INTO reputation_scores (user_id, overall_score, calculated_at)
    VALUES (user_id_param, 0.00, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE calculated_at = CURRENT_TIMESTAMP;
END;//
DELIMITER ;

-- =====================================================================
-- SCHEMA VALIDATION AND CONSTRAINTS
-- =====================================================================

-- Ensure data integrity with custom constraints
ALTER TABLE freelancers ADD CONSTRAINT chk_hourly_rate_valid 
CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);

ALTER TABLE clients ADD CONSTRAINT chk_budget_range_valid 
CHECK (budget_range_min IS NULL OR budget_range_max IS NULL OR budget_range_min <= budget_range_max);

ALTER TABLE reputation_scores ADD CONSTRAINT chk_score_range 
CHECK (overall_score >= 0.00 AND overall_score <= 5.00);

ALTER TABLE users ADD CONSTRAINT chk_email_format 
CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- =====================================================================
-- FINAL NOTES AND DOCUMENTATION
-- =====================================================================

/*
SCHEMA SUMMARY:
===============

Core Tables: 15 main tables
- users: Base authentication
- freelancers, clients: Extended profiles
- skills, freelancer_skills: Skills system
- portfolio_items, media_files: Portfolio management
- verifications, reputation_scores: Trust system
- audit_logs, login_attempts: Security tracking
- user_preferences, api_tokens: User settings
- categories, notifications: Future integration

Key Features:
- Complete authentication with 2FA
- Portfolio multimedia system
- Skills verification
- Reputation tracking
- Comprehensive audit logging
- GDPR compliance ready
- Performance optimized with views and indexes
- Prepared for future modules (projects, payments, reviews)

Performance Considerations:
- Proper indexing for search queries
- Partitioning ready for audit_logs
- Views for common complex queries
- Full-text search capabilities
- Stored procedures for complex operations

Security Features:
- Password hashing with Argon2ID
- JWT token management
- Rate limiting preparation
- Audit trail for all actions
- Virus scanning for uploads
- IP tracking and risk scoring

Next Steps:
1. Run migrations in development environment
2. Create seed data for testing
3. Implement application models (PHP classes)
4. Create API endpoints for CRUD operations
5. Implement authentication middleware
6. Add file upload and processing
7. Create user interfaces
*/