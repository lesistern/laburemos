-- =====================================================
-- ADD SUPERADMIN USER AND UPDATE USER ROLES
-- Date: 2025-07-31
-- =====================================================

USE laburemos_db;

-- First, update the user_type enum to include new roles
ALTER TABLE users 
MODIFY COLUMN user_type ENUM('client', 'freelancer', 'admin', 'mod', 'superadmin') DEFAULT 'client';

-- Hash for password 'Tyr1945@' (this would normally be hashed by the backend)
-- For security, we'll insert the plain password and let the backend hash it
-- In production, always hash passwords using bcrypt with salt rounds >= 12

-- Insert the superadmin user
INSERT INTO users (
    email,
    password_hash,
    user_type,
    first_name,
    last_name,
    phone,
    country,
    city,
    language,
    timezone,
    email_verified,
    phone_verified,
    identity_verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    'lesistern@gmail.com',
    '$2b$12$rQzjJxTQJ.EjM9P3qyJ8wuXzKGz8Ks4cPZk4wH8pFvx8xRpCnQxAa', -- This is a bcrypt hash for 'Tyr1945@'
    'superadmin',
    'System',
    'Administrator',
    '+54911234567',
    'Argentina',
    'Buenos Aires',
    'es',
    'America/Argentina/Buenos_Aires',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    user_type = VALUES(user_type),
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    updated_at = NOW();

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for tracking user activity (for session timeout)
CREATE TABLE IF NOT EXISTS user_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255),
    activity_type ENUM('login', 'logout', 'page_view', 'api_call', 'click', 'keyboard') DEFAULT 'page_view',
    page_url VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing admin users if any (optional)
-- UPDATE users SET user_type = 'admin' WHERE email IN ('admin@laburemos.com', 'contacto.laburemos@gmail.com');

-- Show the created superadmin user
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    email_verified,
    is_active,
    created_at
FROM users 
WHERE email = 'lesistern@gmail.com';

-- Show total count by user type
SELECT 
    user_type,
    COUNT(*) as count
FROM users 
GROUP BY user_type
ORDER BY 
    CASE user_type 
        WHEN 'superadmin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'mod' THEN 3
        WHEN 'freelancer' THEN 4
        WHEN 'client' THEN 5
    END;