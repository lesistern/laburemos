<?php
/**
 * Migration: Create Core Authentication Tables
 * LaburAR Complete Platform - Enterprise Authentication System
 * Generated: 2025-01-18
 * Version: 1.0
 */

class Migration_001_CreateCoreAuthTables
{
    private $pdo;
    
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Run the migration
     */
    public function up()
    {
        try {
            $this->pdo->beginTransaction();
            
            // Create users table
            $this->createUsersTable();
            
            // Create freelancers table
            $this->createFreelancersTable();
            
            // Create clients table
            $this->createClientsTable();
            
            // Create user preferences table
            $this->createUserPreferencesTable();
            
            $this->pdo->commit();
            echo "✅ Migration 001: Core auth tables created successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 001 failed: " . $e->getMessage());
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down()
    {
        try {
            $this->pdo->beginTransaction();
            
            $this->pdo->exec("DROP TABLE IF EXISTS user_preferences");
            $this->pdo->exec("DROP TABLE IF EXISTS clients");
            $this->pdo->exec("DROP TABLE IF EXISTS freelancers");
            $this->pdo->exec("DROP TABLE IF EXISTS users");
            
            $this->pdo->commit();
            echo "✅ Migration 001: Core auth tables dropped successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 001 rollback failed: " . $e->getMessage());
        }
    }
    
    private function createUsersTable()
    {
        $sql = "
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
            INDEX idx_last_login (last_login_at),
            
            -- Constraints
            CONSTRAINT chk_email_format 
            CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$')
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createFreelancersTable()
    {
        $sql = "
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
            INDEX idx_freelancers_search (availability_status, hourly_rate_min, hourly_rate_max, completion_rate),
            
            -- Full text search
            FULLTEXT(professional_name, title, bio, portfolio_description),
            
            -- Constraints
            CONSTRAINT chk_hourly_rate_valid 
            CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createClientsTable()
    {
        $sql = "
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
            INDEX idx_clients_budget (budget_range_min, budget_range_max, company_size),
            
            -- Full text search
            FULLTEXT(company_name, company_description),
            
            -- Constraints
            CONSTRAINT chk_budget_range_valid 
            CHECK (budget_range_min IS NULL OR budget_range_max IS NULL OR budget_range_min <= budget_range_max)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createUserPreferencesTable()
    {
        $sql = "
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
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
}
?>