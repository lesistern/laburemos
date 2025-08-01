<?php
/**
 * Migration: Create Audit and Security System
 * LaburAR Complete Platform - Security and Compliance
 * Generated: 2025-01-18
 * Version: 1.0
 */

class Migration_004_CreateAuditSecurity
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
            
            // Create audit and security tables
            $this->createAuditLogsTable();
            $this->createLoginAttemptsTable();
            $this->createApiTokensTable();
            $this->createNotificationsTable();
            
            // Create views
            $this->createUserProfilesView();
            $this->createFreelancerSearchView();
            
            // Create stored procedures
            $this->createStoredProcedures();
            
            $this->pdo->commit();
            echo "✅ Migration 004: Audit and security system created successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 004 failed: " . $e->getMessage());
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down()
    {
        try {
            $this->pdo->beginTransaction();
            
            // Drop stored procedures
            $this->pdo->exec("DROP PROCEDURE IF EXISTS DeleteUserCompletely");
            $this->pdo->exec("DROP PROCEDURE IF EXISTS CalculateReputationScore");
            
            // Drop views
            $this->pdo->exec("DROP VIEW IF EXISTS freelancer_search");
            $this->pdo->exec("DROP VIEW IF EXISTS user_profiles");
            
            // Drop tables
            $this->pdo->exec("DROP TABLE IF EXISTS notifications");
            $this->pdo->exec("DROP TABLE IF EXISTS api_tokens");
            $this->pdo->exec("DROP TABLE IF EXISTS login_attempts");
            $this->pdo->exec("DROP TABLE IF EXISTS audit_logs");
            
            $this->pdo->commit();
            echo "✅ Migration 004: Audit and security tables dropped successfully\n";
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Migration 004 rollback failed: " . $e->getMessage());
        }
    }
    
    private function createAuditLogsTable()
    {
        $sql = "
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
            INDEX idx_audit_user_date (user_id, created_at),
            
            -- Partitioning ready
            INDEX idx_created_at_partition (created_at)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createLoginAttemptsTable()
    {
        $sql = "
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
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createApiTokensTable()
    {
        $sql = "
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
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createNotificationsTable()
    {
        $sql = "
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
            INDEX idx_related (related_type, related_id),
            INDEX idx_notifications_unread (user_id, read_at, is_important)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }
    
    private function createUserProfilesView()
    {
        $sql = "
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
        LEFT JOIN reputation_scores r ON u.id = r.user_id";
        
        $this->pdo->exec($sql);
    }
    
    private function createFreelancerSearchView()
    {
        $sql = "
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
            COALESCE(r.overall_score, 0) as overall_score,
            COALESCE(r.total_reviews, 0) as total_reviews,
            
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
        GROUP BY f.id";
        
        $this->pdo->exec($sql);
    }
    
    private function createStoredProcedures()
    {
        // Procedure to safely delete user and all related data
        $sql1 = "
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
        END";
        
        $this->pdo->exec($sql1);
        
        // Procedure to calculate reputation score
        $sql2 = "
        CREATE PROCEDURE CalculateReputationScore(IN user_id_param BIGINT)
        BEGIN
            -- This will be implemented when review system is added
            -- For now, just ensure the record exists
            INSERT INTO reputation_scores (user_id, overall_score, calculated_at)
            VALUES (user_id_param, 0.00, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE calculated_at = CURRENT_TIMESTAMP;
        END";
        
        $this->pdo->exec($sql2);
    }
}
?>