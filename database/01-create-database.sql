-- ================================
-- LABUREMOS Database Creation Script
-- Version: 1.0
-- Date: 2025-07-23
-- ================================

-- Drop database if exists (USE WITH CAUTION IN PRODUCTION)
-- DROP DATABASE IF EXISTS laburemos_db;

-- Create database with proper charset for Spanish content
CREATE DATABASE IF NOT EXISTS laburemos_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_spanish_ci;

-- Use the database
USE laburemos_db;

-- Set SQL mode for strict operations
SET SQL_MODE = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Disable foreign key checks temporarily for clean installation
SET FOREIGN_KEY_CHECKS = 0;

-- Create database user (run as root)
-- CREATE USER IF NOT EXISTS 'laburemos_user'@'localhost' IDENTIFIED BY 'LABUREMOS2025!Secure';
-- GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ================================
-- CORE SYSTEM TABLES
-- ================================

-- Users table - Main user authentication
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    document_type ENUM('DNI', 'CI', 'LE', 'LC', 'CUIT-CUIL', 'PASAPORTE') NOT NULL COMMENT 'Tipo de documento',
    document_number VARCHAR(15) NOT NULL COMMENT 'Número de documento',
    UNIQUE KEY unique_document (document_type, document_number),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'suspended', 'pending', 'deleted') DEFAULT 'pending',
    user_type ENUM('client', 'freelancer', 'both') DEFAULT 'client',
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_document (document_type, document_number),
    INDEX idx_status (status),
    INDEX idx_user_type (user_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- User profiles - Extended user information
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    bio TEXT,
    profile_image VARCHAR(255),
    cover_image VARCHAR(255),
    
    -- Ubicación Nacional
    province VARCHAR(50) COMMENT 'Provincia nacional',
    city VARCHAR(100),
    postal_code VARCHAR(10),
    
    -- Datos Profesionales
    skills JSON COMMENT 'Array de habilidades',
    languages JSON COMMENT 'Idiomas con niveles',
    experience_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'beginner',
    
    -- Datos Comerciales
    hourly_rate DECIMAL(10,2) COMMENT 'Tarifa por hora en ARS',
    availability ENUM('full_time', 'part_time', 'weekends', 'unavailable') DEFAULT 'part_time',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Datos Fiscales Nacionales
    tax_condition ENUM('monotributo', 'responsable_inscripto', 'exento') DEFAULT 'monotributo',
    monotributo_category VARCHAR(5) COMMENT 'Categoría A-K del monotributo',
    invoice_enabled BOOLEAN DEFAULT FALSE,
    
    -- Estadísticas
    response_time_hours INT DEFAULT 24,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_province (province),
    INDEX idx_skills (skills),
    INDEX idx_hourly_rate (hourly_rate),
    INDEX idx_availability (availability)
) ENGINE=InnoDB;

-- Categories for services
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) COMMENT 'Emoji o clase de icono',
    description TEXT,
    parent_id INT NULL COMMENT 'Para subcategorías',
    is_trending BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    service_count INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_trending (is_trending),
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Services offered by freelancers
CREATE TABLE services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    
    -- Información Básica
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    tags JSON COMMENT 'Tags para búsqueda',
    
    -- Precios en ARS
    base_price DECIMAL(10,2) NOT NULL COMMENT 'Precio base en ARS',
    delivery_time_days INT NOT NULL DEFAULT 7,
    revisions_included INT DEFAULT 0,
    
    -- Galería
    main_image VARCHAR(255),
    gallery_images JSON,
    video_url VARCHAR(255),
    
    -- Estado y Métricas
    status ENUM('draft', 'active', 'paused', 'deleted') DEFAULT 'draft',
    views_count INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    favorites_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    
    -- SEO y Metadatos
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_user_category (user_id, category_id),
    INDEX idx_price_range (base_price),
    INDEX idx_rating (average_rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB;

-- Service packages (ServicioLaR system)
CREATE TABLE service_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    package_type ENUM('basico', 'completo', 'premium', 'colaborativo') NOT NULL,
    
    -- Detalles del Paquete
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL COMMENT 'Precio en ARS',
    delivery_time_days INT NOT NULL,
    revisions_included INT DEFAULT 0,
    
    -- Características incluidas
    features JSON NOT NULL COMMENT 'Lista de características',
    extras_available BOOLEAN DEFAULT TRUE,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_service_type (service_id, package_type),
    INDEX idx_price (price),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ================================
-- INITIAL SUCCESS MESSAGE
-- ================================
SELECT 'LABUREMOS Database Core Tables Created Successfully!' as Status;