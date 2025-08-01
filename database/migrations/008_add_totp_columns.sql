-- Add TOTP columns to users table
-- Time-based One-Time Password (Google Authenticator) support

USE laburemos_db;

-- Add TOTP columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS totp_secret TEXT NULL COMMENT 'Encrypted TOTP secret key',
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE COMMENT 'Whether TOTP is enabled for user',
ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP NULL COMMENT 'When TOTP was first verified',
ADD COLUMN IF NOT EXISTS totp_backup_codes JSON NULL COMMENT 'Backup codes for TOTP recovery';

-- Create index for TOTP enabled users
CREATE INDEX IF NOT EXISTS idx_users_totp_enabled ON users(totp_enabled);

-- Create index for TOTP verification timestamp
CREATE INDEX IF NOT EXISTS idx_users_totp_verified ON users(totp_verified_at);

-- Update MFA columns description
ALTER TABLE users MODIFY COLUMN mfa_enabled BOOLEAN DEFAULT FALSE COMMENT 'Whether email MFA is enabled';
ALTER TABLE users MODIFY COLUMN mfa_email VARCHAR(255) NULL COMMENT 'Email for MFA codes';

-- Create view for MFA/TOTP statistics
CREATE OR REPLACE VIEW user_2fa_stats AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN mfa_enabled = 1 THEN 1 ELSE 0 END) as email_mfa_users,
    SUM(CASE WHEN totp_enabled = 1 THEN 1 ELSE 0 END) as totp_users,
    SUM(CASE WHEN mfa_enabled = 1 OR totp_enabled = 1 THEN 1 ELSE 0 END) as total_2fa_users,
    SUM(CASE WHEN mfa_enabled = 1 AND totp_enabled = 1 THEN 1 ELSE 0 END) as dual_2fa_users,
    ROUND((SUM(CASE WHEN mfa_enabled = 1 OR totp_enabled = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as two_factor_adoption_rate
FROM users;

-- Add sample TOTP data for admin user (for testing)
UPDATE users 
SET totp_enabled = FALSE, 
    totp_secret = NULL,
    totp_verified_at = NULL,
    totp_backup_codes = NULL
WHERE email = 'admin@laburar.com';

-- Create procedure to clean up unused TOTP secrets
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanUnverifiedTOTP()
BEGIN
    -- Remove TOTP secrets that haven't been verified in 24 hours
    UPDATE users 
    SET totp_secret = NULL, 
        totp_backup_codes = NULL 
    WHERE totp_secret IS NOT NULL 
      AND totp_enabled = 0 
      AND (totp_verified_at IS NULL OR totp_verified_at < DATE_SUB(NOW(), INTERVAL 24 HOUR));
      
    SELECT ROW_COUNT() as cleaned_secrets;
END //
DELIMITER ;

-- Create event to run cleanup daily
CREATE EVENT IF NOT EXISTS cleanup_unverified_totp
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL CleanUnverifiedTOTP();

-- Create trigger to log TOTP changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_totp_changes 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Log when TOTP is enabled
    IF OLD.totp_enabled = 0 AND NEW.totp_enabled = 1 THEN
        INSERT INTO mfa_verifications (user_id, action, created_at) 
        VALUES (NEW.id, 'totp_enabled', NOW());
    END IF;
    
    -- Log when TOTP is disabled
    IF OLD.totp_enabled = 1 AND NEW.totp_enabled = 0 THEN
        INSERT INTO mfa_verifications (user_id, action, created_at) 
        VALUES (NEW.id, 'totp_disabled', NOW());
    END IF;
    
    -- Log when backup codes are regenerated
    IF OLD.totp_backup_codes IS NOT NULL 
       AND NEW.totp_backup_codes IS NOT NULL 
       AND OLD.totp_backup_codes != NEW.totp_backup_codes THEN
        INSERT INTO mfa_verifications (user_id, action, created_at) 
        VALUES (NEW.id, 'totp_backup_codes_regenerated', NOW());
    END IF;
END //
DELIMITER ;

-- Display current 2FA statistics
SELECT 
    'TOTP Migration Completed' as Status,
    NOW() as Timestamp;

-- Show updated table structure
DESCRIBE users;

-- Show 2FA statistics
SELECT * FROM user_2fa_stats;

-- Verify indexes were created
SHOW INDEX FROM users WHERE Key_name LIKE '%totp%';