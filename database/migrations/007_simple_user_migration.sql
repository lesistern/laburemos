-- =====================================================
-- LABUREMOS User Roles Migration - Simplified Version
-- Version: 2.0 Simple
-- Date: 2025-07-26
-- Compatible with XAMPP/MariaDB
-- =====================================================

USE laburemos_db;

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS users_backup_20250726 AS 
SELECT * FROM users;

-- =====================================================
-- ADD NEW COLUMNS TO USERS TABLE
-- =====================================================

-- Add new role columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE COMMENT 'Can hire services',
ADD COLUMN IF NOT EXISTS is_freelancer BOOLEAN DEFAULT FALSE COMMENT 'Can offer services',
ADD COLUMN IF NOT EXISTS user_category ENUM('public', 'team') DEFAULT 'public' COMMENT 'User category';

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================

-- Update existing users based on user_type
UPDATE users SET 
    is_client = TRUE,
    is_freelancer = FALSE,
    user_category = 'public'
WHERE user_type = 'client';

UPDATE users SET 
    is_client = FALSE, 
    is_freelancer = TRUE,
    user_category = 'public'
WHERE user_type = 'freelancer';

-- Admin users become team members
UPDATE users SET 
    is_client = FALSE,
    is_freelancer = FALSE,
    user_category = 'team'
WHERE user_type = 'admin';

-- =====================================================
-- CREATE TEAM_MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE,
    department ENUM(
        'development', 
        'design', 
        'qa_testing', 
        'devops', 
        'marketing', 
        'sales', 
        'support', 
        'management', 
        'executive',
        'operations',
        'security',
        'data_analytics'
    ) NOT NULL DEFAULT 'management',
    
    position VARCHAR(100) NOT NULL DEFAULT 'Administrator',
    role_level ENUM('junior', 'mid', 'senior', 'lead', 'manager', 'director', 'ceo') DEFAULT 'manager',
    
    -- Access and permissions
    access_level ENUM('basic', 'advanced', 'admin', 'super_admin') DEFAULT 'admin',
    permissions JSON,
    
    -- Employment info
    hire_date DATE DEFAULT (CURDATE()),
    employment_type ENUM('full_time', 'part_time', 'contractor', 'intern') DEFAULT 'full_time',
    
    -- Contact and location
    work_location ENUM('remote', 'office', 'hybrid') DEFAULT 'remote',
    office_location VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    can_login BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department),
    INDEX idx_role_level (role_level),
    INDEX idx_access_level (access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MIGRATE ADMIN USERS TO TEAM_MEMBERS
-- =====================================================

INSERT INTO team_members (
    user_id, 
    employee_id, 
    department, 
    position, 
    role_level, 
    access_level,
    permissions,
    hire_date
)
SELECT 
    id,
    CONCAT('EMP', LPAD(id, 4, '0')) as employee_id,
    'management' as department,
    'Platform Administrator' as position,
    'manager' as role_level,
    'super_admin' as access_level,
    JSON_ARRAY(
        'user_management',
        'project_management', 
        'financial_management',
        'system_administration',
        'support_access',
        'analytics_access'
    ) as permissions,
    created_at as hire_date
FROM users 
WHERE user_type = 'admin'
AND user_category = 'team';

-- =====================================================
-- CREATE ROLE HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_role_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    previous_roles JSON COMMENT 'Previous role state',
    new_roles JSON COMMENT 'New role state',
    change_reason TEXT,
    changed_by INT COMMENT 'User ID who made the change',
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_change_date (change_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View for public users (clients/freelancers)
CREATE OR REPLACE VIEW public_users AS
SELECT 
    u.*,
    fp.title as freelancer_title,
    fp.rating_average,
    fp.total_projects,
    CASE 
        WHEN u.is_client AND u.is_freelancer THEN 'both'
        WHEN u.is_client THEN 'client'
        WHEN u.is_freelancer THEN 'freelancer'
        ELSE 'inactive'
    END as user_role
FROM users u
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
WHERE u.user_category = 'public'
AND u.is_active = TRUE;

-- View for team members
CREATE OR REPLACE VIEW team_users AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.profile_image,
    u.is_active,
    u.last_login,
    u.created_at,
    tm.employee_id,
    tm.department,
    tm.position,
    tm.role_level,
    tm.access_level,
    tm.employment_type,
    tm.work_location,
    tm.permissions,
    tm.hire_date
FROM users u
INNER JOIN team_members tm ON u.id = tm.user_id
WHERE u.user_category = 'team'
AND u.is_active = TRUE
AND tm.is_active = TRUE;

-- Combined view for dashboard
CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.user_category,
    u.is_client,
    u.is_freelancer,
    u.is_active,
    u.created_at,
    CASE 
        WHEN u.user_category = 'team' THEN tm.position
        WHEN u.is_freelancer THEN fp.title
        ELSE 'Cliente'
    END as display_title,
    CASE 
        WHEN u.user_category = 'team' THEN tm.access_level
        ELSE 'user'
    END as access_level
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_is_client (is_client),
ADD INDEX IF NOT EXISTS idx_is_freelancer (is_freelancer),
ADD INDEX IF NOT EXISTS idx_user_category (user_category);

-- =====================================================
-- INSERT DEMO TEAM MEMBERS
-- =====================================================

-- Create demo team members
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    user_category,
    is_client,
    is_freelancer,
    email_verified,
    is_active
) VALUES 
-- CEO
('ceo@laburar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'Rodriguez', 'team', FALSE, FALSE, TRUE, TRUE),
-- Lead Developer  
('lead.dev@laburar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'Martinez', 'team', FALSE, FALSE, TRUE, TRUE),
-- QA Manager
('qa.manager@laburar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sofia', 'Lopez', 'team', FALSE, FALSE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE email = email;

-- Create team member records for new users
INSERT INTO team_members (
    user_id,
    employee_id,
    department,
    position,
    role_level,
    access_level,
    permissions,
    hire_date
)
SELECT 
    u.id,
    CONCAT('EMP', LPAD(u.id, 4, '0')),
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'executive'
        WHEN u.email = 'lead.dev@laburar.com' THEN 'development'
        WHEN u.email = 'qa.manager@laburar.com' THEN 'qa_testing'
        ELSE 'management'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'Chief Executive Officer'
        WHEN u.email = 'lead.dev@laburar.com' THEN 'Lead Developer'
        WHEN u.email = 'qa.manager@laburar.com' THEN 'QA Manager'
        ELSE 'Administrator'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'ceo'
        WHEN u.email LIKE '%lead%' OR u.email LIKE '%manager%' THEN 'lead'
        ELSE 'manager'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'super_admin'
        WHEN u.email LIKE '%lead%' OR u.email LIKE '%manager%' THEN 'admin'
        ELSE 'admin'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN JSON_ARRAY('full_access', 'financial_management', 'strategic_decisions', 'user_management')
        WHEN u.email = 'lead.dev@laburar.com' THEN JSON_ARRAY('development', 'code_review', 'technical_decisions', 'deployment_management')
        WHEN u.email = 'qa.manager@laburar.com' THEN JSON_ARRAY('quality_assurance', 'testing_coordination', 'bug_management', 'release_approval')
        ELSE JSON_ARRAY('user_management', 'support_access')
    END,
    CURDATE()
FROM users u
WHERE u.email IN ('ceo@laburar.com', 'lead.dev@laburar.com', 'qa.manager@laburar.com')
AND u.user_category = 'team'
ON DUPLICATE KEY UPDATE employee_id = employee_id;

-- =====================================================
-- CREATE DEMO PUBLIC USER
-- =====================================================

INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    country,
    city,
    user_category,
    is_client,
    is_freelancer,
    email_verified,
    is_active
) VALUES (
    'demo.user@laburar.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'Juan',
    'Pérez',
    '+54 11 1234-5678',
    'Argentina',
    'Buenos Aires',
    'public',
    TRUE,  -- is_client
    TRUE,  -- is_freelancer (dual role)
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE email = email;

-- Create freelancer profile for demo user
INSERT INTO freelancer_profiles (
    user_id,
    title,
    professional_overview,
    skills,
    availability,
    created_at
)
SELECT 
    u.id,
    'Desarrollador Full Stack',
    'Desarrollador experimentado con 5+ años en desarrollo web. Especializado en PHP, JavaScript, MySQL y frameworks modernos.',
    JSON_ARRAY('PHP', 'JavaScript', 'MySQL', 'Laravel', 'React', 'Vue.js', 'Bootstrap'),
    'full_time',
    NOW()
FROM users u
WHERE u.email = 'demo.user@laburar.com'
AND u.is_freelancer = TRUE
ON DUPLICATE KEY UPDATE title = title;

-- =====================================================
-- SHOW MIGRATION RESULTS
-- =====================================================

SELECT 
    'MIGRATION COMPLETED SUCCESSFULLY' as status,
    NOW() as timestamp;

-- Show user statistics
SELECT 
    'USER STATISTICS' as type,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_client = TRUE) as clients,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_freelancer = TRUE) as freelancers,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE) as dual_role_users,
    (SELECT COUNT(*) FROM users WHERE user_category = 'team') as team_members,
    (SELECT COUNT(*) FROM team_members WHERE is_active = TRUE) as active_team_members;

-- Show team departments
SELECT 
    department,
    COUNT(*) as members,
    GROUP_CONCAT(CONCAT(u.first_name, ' ', u.last_name, ' (', tm.position, ')') SEPARATOR '; ') as team_list
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.is_active = TRUE
GROUP BY department
ORDER BY members DESC;

SELECT '✅ MIGRATION AND DEMO DATA CREATED SUCCESSFULLY!' as final_status;