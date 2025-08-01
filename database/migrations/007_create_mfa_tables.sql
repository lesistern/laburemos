-- MFA Tables Creation Script
-- Multi-Factor Authentication support for LABUREMOS

USE laburemos_db;

-- Table for storing MFA codes
CREATE TABLE IF NOT EXISTS mfa_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'login',
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_action (user_id, action),
    KEY idx_expires_at (expires_at),
    KEY idx_user_id (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for tracking successful MFA verifications
CREATE TABLE IF NOT EXISTS mfa_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'login',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    KEY idx_user_action (user_id, action),
    KEY idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add MFA columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS mfa_backup_codes JSON NULL;

-- Create index for MFA enabled users
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Cleanup procedure for expired codes
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanExpiredMFACodes()
BEGIN
    DELETE FROM mfa_codes WHERE expires_at < NOW();
    
    -- Clean old verifications (keep last 90 days)
    DELETE FROM mfa_verifications 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //
DELIMITER ;

-- Event scheduler to run cleanup daily
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS cleanup_mfa_codes
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL CleanExpiredMFACodes();

-- Insert sample data for testing (optional)
-- Note: Enable MFA for admin user for testing
UPDATE users 
SET mfa_enabled = TRUE, mfa_email = email 
WHERE email = 'admin@laburar.com' 
AND EXISTS (SELECT 1 FROM users WHERE email = 'admin@laburar.com');

-- MFA Statistics View
CREATE VIEW IF NOT EXISTS mfa_stats_view AS
SELECT 
    DATE(mv.created_at) as date,
    COUNT(*) as total_verifications,
    COUNT(DISTINCT mv.user_id) as unique_users,
    mv.action,
    COUNT(CASE WHEN mv.created_at IS NOT NULL THEN 1 END) as successful_verifications
FROM mfa_verifications mv
GROUP BY DATE(mv.created_at), mv.action
ORDER BY date DESC;

-- Trigger to log MFA events
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_mfa_enable 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.mfa_enabled = FALSE AND NEW.mfa_enabled = TRUE THEN
        INSERT INTO mfa_verifications (user_id, action, created_at) 
        VALUES (NEW.id, 'mfa_enabled', NOW());
    END IF;
    
    IF OLD.mfa_enabled = TRUE AND NEW.mfa_enabled = FALSE THEN
        INSERT INTO mfa_verifications (user_id, action, created_at) 
        VALUES (NEW.id, 'mfa_disabled', NOW());
    END IF;
END //
DELIMITER ;

-- Display creation status
SELECT 
    'MFA Tables Created' as Status,
    COUNT(*) as Tables_Created
FROM information_schema.tables 
WHERE table_schema = 'laburemos_db' 
AND table_name IN ('mfa_codes', 'mfa_verifications');

-- Display MFA enabled users count
SELECT 
    COUNT(*) as MFA_Enabled_Users,
    COUNT(CASE WHEN mfa_enabled = TRUE THEN 1 END) as Active_MFA_Users
FROM users;