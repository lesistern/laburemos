-- =====================================================
-- LABUREMOS Database Creation Script
-- Version: 1.0
-- Date: 2024
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS laburemos_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE laburemos_db;

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('client', 'freelancer', 'admin') DEFAULT 'client',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Argentina',
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    address TEXT,
    dni_cuit VARCHAR(20),
    profile_image VARCHAR(255),
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'ARS',
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FREELANCER PROFILES
-- =====================================================

-- Freelancer profiles
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    title VARCHAR(200),
    professional_overview TEXT,
    skills TEXT, -- JSON array
    experience_years INT DEFAULT 0,
    education TEXT, -- JSON array
    certifications TEXT, -- JSON array
    portfolio_items TEXT, -- JSON array
    availability ENUM('full_time', 'part_time', 'hourly', 'not_available') DEFAULT 'full_time',
    response_time VARCHAR(50),
    completion_rate DECIMAL(5,2) DEFAULT 0,
    on_time_rate DECIMAL(5,2) DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    total_projects INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    profile_views INT DEFAULT 0,
    last_active TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rating (rating_average),
    INDEX idx_availability (availability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SERVICES AND CATEGORIES
-- =====================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id INT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services offered by freelancers
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price_type ENUM('fixed', 'hourly', 'custom') DEFAULT 'fixed',
    base_price DECIMAL(10,2) NOT NULL,
    delivery_time INT NOT NULL, -- in days
    revisions_included INT DEFAULT 1,
    tags TEXT, -- JSON array
    requirements TEXT,
    gallery_images TEXT, -- JSON array
    video_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    order_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_category (category_id),
    INDEX idx_price (base_price),
    INDEX idx_rating (rating_average)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service packages (basic, standard, premium)
CREATE TABLE IF NOT EXISTS service_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    package_type ENUM('basic', 'standard', 'premium') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    delivery_time INT NOT NULL,
    revisions INT DEFAULT 1,
    features TEXT, -- JSON array
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_package (service_id, package_type),
    INDEX idx_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROJECTS AND ORDERS
-- =====================================================

-- Projects/Orders
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    service_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    budget DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'ARS',
    deadline DATE,
    status ENUM('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
    payment_status ENUM('pending', 'escrow', 'released', 'refunded') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    client_rating INT,
    client_review TEXT,
    freelancer_rating INT,
    freelancer_review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    status ENUM('pending', 'in_progress', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMMUNICATIONS
-- =====================================================

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    project_id INT,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    attachments TEXT, -- JSON array
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_project (project_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data TEXT, -- JSON
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENTS AND TRANSACTIONS
-- =====================================================

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    type ENUM('payment', 'withdrawal', 'refund', 'fee') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ARS',
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    metadata TEXT, -- JSON
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User wallets
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0,
    pending_balance DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'ARS',
    last_withdrawal TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REVIEWS AND RATINGS
-- =====================================================

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewed_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    response TEXT,
    response_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_id) REFERENCES users(id),
    UNIQUE KEY unique_project_review (project_id, reviewer_id),
    INDEX idx_reviewed (reviewed_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SUPPORT AND DISPUTES
-- =====================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    category VARCHAR(50),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ANALYTICS AND TRACKING
-- =====================================================

-- User activity log
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Programación y Tecnología', 'programacion-tecnologia', 'Desarrollo web, móvil, software y más', 'code', 1),
('Diseño Gráfico', 'diseno-grafico', 'Logos, branding, ilustraciones y más', 'palette', 2),
('Marketing Digital', 'marketing-digital', 'SEO, SEM, redes sociales y publicidad online', 'trending-up', 3),
('Redacción y Traducción', 'redaccion-traduccion', 'Contenido, copywriting, traducción y edición', 'edit', 4),
('Video y Animación', 'video-animacion', 'Edición de video, animación 2D/3D y motion graphics', 'video', 5),
('Música y Audio', 'musica-audio', 'Producción musical, locución y edición de audio', 'music', 6),
('Negocios', 'negocios', 'Consultoría, planes de negocio y análisis', 'briefcase', 7),
('Datos e IA', 'datos-ia', 'Análisis de datos, machine learning e inteligencia artificial', 'database', 8);

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, user_type, first_name, last_name, email_verified, is_active) VALUES
('admin@laburemos.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'LABUREMOS', TRUE, TRUE);

-- Create wallet for admin
INSERT INTO wallets (user_id) VALUES (1);

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to update freelancer stats
CREATE PROCEDURE UpdateFreelancerStats(IN freelancer_id INT)
BEGIN
    DECLARE total_reviews INT;
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE completed_projects INT;
    DECLARE total_earned DECIMAL(12,2);
    
    -- Calculate total reviews and average rating
    SELECT COUNT(*), AVG(rating) INTO total_reviews, avg_rating
    FROM reviews
    WHERE reviewed_id = freelancer_id;
    
    -- Calculate completed projects
    SELECT COUNT(*) INTO completed_projects
    FROM projects
    WHERE freelancer_id = freelancer_id AND status = 'completed';
    
    -- Calculate total earnings
    SELECT COALESCE(SUM(budget), 0) INTO total_earned
    FROM projects
    WHERE freelancer_id = freelancer_id AND status = 'completed';
    
    -- Update freelancer profile
    UPDATE freelancer_profiles
    SET 
        rating_average = COALESCE(avg_rating, 0),
        total_reviews = total_reviews,
        total_projects = completed_projects,
        total_earnings = total_earned,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = freelancer_id;
END//

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger to create wallet when user is created
CREATE TRIGGER create_user_wallet
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
END//

-- Trigger to create freelancer profile when user type is freelancer
CREATE TRIGGER create_freelancer_profile
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.user_type = 'freelancer' THEN
        INSERT INTO freelancer_profiles (user_id) VALUES (NEW.id);
    END IF;
END//

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for search and filtering
CREATE INDEX idx_services_search ON services(title, is_active);
CREATE INDEX idx_users_location ON users(country, city);
CREATE INDEX idx_projects_dates ON projects(created_at, deadline);
CREATE INDEX idx_transactions_dates ON transactions(created_at, processed_at);

-- =====================================================
-- GRANT PERMISSIONS (adjust as needed)
-- =====================================================

-- Create application user
-- CREATE USER 'laburar_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON laburemos_db.* TO 'laburemos_app'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- END OF SCRIPT
-- =====================================================