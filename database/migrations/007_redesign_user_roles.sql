-- =====================================================
-- LABUREMOS User Roles Redesign Migration
-- Version: 2.0
-- Date: 2025-07-26
-- 
-- CAMBIOS PRINCIPALES:
-- 1. Separar usuarios públicos (clientes/freelancers) del equipo técnico
-- 2. Usar flags booleanos para is_client/is_freelancer (más flexible)
-- 3. Nueva tabla team_members para equipo técnico/administrativo
-- =====================================================

USE laburemos_db;

-- =====================================================
-- PASO 1: BACKUP DE DATOS EXISTENTES
-- =====================================================

-- Crear tabla temporal de backup
CREATE TABLE IF NOT EXISTS users_backup_20250726 AS 
SELECT * FROM users;

-- =====================================================
-- PASO 2: MODIFICAR ESTRUCTURA DE USERS
-- =====================================================

-- Agregar nuevas columnas para el sistema de flags
ALTER TABLE users 
ADD COLUMN is_client BOOLEAN DEFAULT FALSE COMMENT 'Puede contratar servicios',
ADD COLUMN is_freelancer BOOLEAN DEFAULT FALSE COMMENT 'Puede ofrecer servicios',
ADD COLUMN user_category ENUM('public', 'team') DEFAULT 'public' COMMENT 'Categoría del usuario';

-- Migrar datos existentes basado en user_type
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

-- Los admin actuales se migran como team members
UPDATE users SET 
    is_client = FALSE,
    is_freelancer = FALSE,
    user_category = 'team'
WHERE user_type = 'admin';

-- =====================================================
-- PASO 3: CREAR TABLA TEAM_MEMBERS
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
    ) NOT NULL,
    
    position VARCHAR(100) NOT NULL,
    role_level ENUM('junior', 'mid', 'senior', 'lead', 'manager', 'director', 'ceo') DEFAULT 'junior',
    
    -- Permisos y accesos
    access_level ENUM('basic', 'advanced', 'admin', 'super_admin') DEFAULT 'basic',
    permissions JSON COMMENT 'Array de permisos específicos',
    
    -- Información laboral
    hire_date DATE,
    employment_type ENUM('full_time', 'part_time', 'contractor', 'intern') DEFAULT 'full_time',
    salary_range ENUM('undisclosed', 'junior', 'mid', 'senior', 'executive') DEFAULT 'undisclosed',
    
    -- Contacto y ubicación
    work_location ENUM('remote', 'office', 'hybrid') DEFAULT 'remote',
    office_location VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    can_login BOOLEAN DEFAULT TRUE,
    last_performance_review DATE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department),
    INDEX idx_role_level (role_level),
    INDEX idx_access_level (access_level),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PASO 4: MIGRAR USUARIOS ADMIN A TEAM_MEMBERS
-- =====================================================

-- Insertar usuarios admin existentes como team members
INSERT INTO team_members (
    user_id, 
    employee_id, 
    department, 
    position, 
    role_level, 
    access_level,
    hire_date,
    employment_type,
    work_location,
    permissions
)
SELECT 
    id,
    CONCAT('EMP', LPAD(id, 4, '0')) as employee_id,
    'management' as department,
    'Platform Administrator' as position,
    'manager' as role_level,
    'super_admin' as access_level,
    created_at as hire_date,
    'full_time' as employment_type,
    'remote' as work_location,
    JSON_ARRAY(
        'user_management',
        'project_management', 
        'financial_management',
        'system_administration',
        'support_access',
        'analytics_access',
        'security_management'
    ) as permissions
FROM users 
WHERE user_type = 'admin';

-- =====================================================
-- PASO 5: ACTUALIZAR ESTRUCTURA USERS (ELIMINAR user_type)
-- =====================================================

-- Ahora que migramos los datos, podemos eliminar la columna user_type
-- NOTA: Se mantiene temporalmente para compatibilidad, se puede eliminar después
-- ALTER TABLE users DROP COLUMN user_type;

-- Agregar índices para las nuevas columnas
ALTER TABLE users 
ADD INDEX idx_is_client (is_client),
ADD INDEX idx_is_freelancer (is_freelancer),
ADD INDEX idx_user_category (user_category);

-- =====================================================
-- PASO 6: CREAR TABLA USER_ROLE_HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS user_role_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    previous_roles JSON COMMENT 'Estado anterior de roles',
    new_roles JSON COMMENT 'Nuevo estado de roles',
    change_reason TEXT,
    changed_by INT COMMENT 'ID del usuario que hizo el cambio',
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_change_date (change_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PASO 7: CREAR VISTAS PARA FACILITAR CONSULTAS
-- =====================================================

-- Vista para usuarios públicos (clientes/freelancers)
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

-- Vista para equipo técnico
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

-- Vista combinada para dashboard
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
-- PASO 8: STORED PROCEDURES PARA GESTIÓN DE ROLES
-- =====================================================

DELIMITER //

-- Procedure para asignar rol de cliente
CREATE OR REPLACE PROCEDURE AssignClientRole(
    IN user_id_param INT,
    IN changed_by_param INT,
    IN reason_param TEXT
)
BEGIN
    DECLARE current_client BOOLEAN DEFAULT FALSE;
    DECLARE current_freelancer BOOLEAN DEFAULT FALSE;
    
    -- Obtener roles actuales
    SELECT is_client, is_freelancer INTO current_client, current_freelancer
    FROM users WHERE id = user_id_param;
    
    -- Registrar cambio en historial
    INSERT INTO user_role_history (user_id, previous_roles, new_roles, change_reason, changed_by)
    VALUES (
        user_id_param,
        JSON_OBJECT('is_client', current_client, 'is_freelancer', current_freelancer),
        JSON_OBJECT('is_client', TRUE, 'is_freelancer', current_freelancer),
        reason_param,
        changed_by_param
    );
    
    -- Actualizar usuario
    UPDATE users SET 
        is_client = TRUE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id_param;
END //

-- Procedure para asignar rol de freelancer
CREATE OR REPLACE PROCEDURE AssignFreelancerRole(
    IN user_id_param INT,
    IN changed_by_param INT,
    IN reason_param TEXT
)
BEGIN
    DECLARE current_client BOOLEAN DEFAULT FALSE;
    DECLARE current_freelancer BOOLEAN DEFAULT FALSE;
    
    -- Obtener roles actuales
    SELECT is_client, is_freelancer INTO current_client, current_freelancer
    FROM users WHERE id = user_id_param;
    
    -- Registrar cambio en historial
    INSERT INTO user_role_history (user_id, previous_roles, new_roles, change_reason, changed_by)
    VALUES (
        user_id_param,
        JSON_OBJECT('is_client', current_client, 'is_freelancer', current_freelancer),
        JSON_OBJECT('is_client', current_client, 'is_freelancer', TRUE),
        reason_param,
        changed_by_param
    );
    
    -- Actualizar usuario
    UPDATE users SET 
        is_freelancer = TRUE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id_param;
    
    -- Crear perfil de freelancer si no existe
    INSERT IGNORE INTO freelancer_profiles (user_id, created_at)
    VALUES (user_id_param, CURRENT_TIMESTAMP);
END //

-- Procedure para crear miembro del equipo
CREATE OR REPLACE PROCEDURE CreateTeamMember(
    IN user_id_param INT,
    IN department_param VARCHAR(50),
    IN position_param VARCHAR(100),
    IN role_level_param VARCHAR(20),
    IN access_level_param VARCHAR(20),
    IN permissions_param JSON,
    IN created_by_param INT
)
BEGIN
    -- Actualizar categoría del usuario
    UPDATE users SET 
        user_category = 'team',
        is_client = FALSE,
        is_freelancer = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id_param;
    
    -- Crear registro de team member
    INSERT INTO team_members (
        user_id, 
        employee_id, 
        department, 
        position, 
        role_level, 
        access_level,
        permissions,
        hire_date,
        employment_type
    ) VALUES (
        user_id_param,
        CONCAT('EMP', LPAD(user_id_param, 4, '0')),
        department_param,
        position_param,
        role_level_param,
        access_level_param,
        permissions_param,
        CURDATE(),
        'full_time'
    );
    
    -- Registrar en historial
    INSERT INTO user_role_history (user_id, previous_roles, new_roles, change_reason, changed_by)
    VALUES (
        user_id_param,
        JSON_OBJECT('category', 'public'),
        JSON_OBJECT('category', 'team', 'department', department_param, 'position', position_param),
        CONCAT('Promovido a equipo técnico: ', position_param),
        created_by_param
    );
END //

DELIMITER ;

-- =====================================================
-- PASO 9: TRIGGERS PARA MANTENER INTEGRIDAD
-- =====================================================

DELIMITER //

-- Trigger para validar que un usuario no tenga roles inconsistentes
CREATE OR REPLACE TRIGGER validate_user_roles
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    -- Si es team member, no puede ser cliente ni freelancer
    IF NEW.user_category = 'team' AND (NEW.is_client = TRUE OR NEW.is_freelancer = TRUE) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Los miembros del equipo no pueden ser clientes o freelancers';
    END IF;
    
    -- Si es público, debe tener al menos un rol
    IF NEW.user_category = 'public' AND NEW.is_client = FALSE AND NEW.is_freelancer = FALSE THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Los usuarios públicos deben ser clientes o freelancers';
    END IF;
END //

-- Trigger para crear perfil de freelancer automáticamente
CREATE OR REPLACE TRIGGER create_freelancer_profile
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Si se convierte en freelancer, crear perfil
    IF NEW.is_freelancer = TRUE AND OLD.is_freelancer = FALSE THEN
        INSERT IGNORE INTO freelancer_profiles (user_id, created_at)
        VALUES (NEW.id, CURRENT_TIMESTAMP);
    END IF;
END //

DELIMITER ;

-- =====================================================
-- PASO 10: DATOS DE PRUEBA PARA EQUIPO TÉCNICO
-- =====================================================

-- Insertar roles de equipo técnico de ejemplo
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
('ceo@laburar.com', '$2y$10$dummy_hash_for_demo', 'Ana', 'Rodriguez', 'team', FALSE, FALSE, TRUE, TRUE),
-- CTO  
('cto@laburar.com', '$2y$10$dummy_hash_for_demo', 'Carlos', 'Martinez', 'team', FALSE, FALSE, TRUE, TRUE),
-- Lead Developer
('lead.dev@laburar.com', '$2y$10$dummy_hash_for_demo', 'Sofia', 'Lopez', 'team', FALSE, FALSE, TRUE, TRUE),
-- QA Manager
('qa.manager@laburar.com', '$2y$10$dummy_hash_for_demo', 'Miguel', 'Fernandez', 'team', FALSE, FALSE, TRUE, TRUE),
-- DevOps Engineer
('devops@laburar.com', '$2y$10$dummy_hash_for_demo', 'Laura', 'Garcia', 'team', FALSE, FALSE, TRUE, TRUE),
-- Senior Developer
('senior.dev@laburar.com', '$2y$10$dummy_hash_for_demo', 'Diego', 'Morales', 'team', FALSE, FALSE, TRUE, TRUE),
-- UX Designer
('ux.designer@laburar.com', '$2y$10$dummy_hash_for_demo', 'Valentina', 'Torres', 'team', FALSE, FALSE, TRUE, TRUE),
-- Data Analyst
('data.analyst@laburar.com', '$2y$10$dummy_hash_for_demo', 'Mateo', 'Silva', 'team', FALSE, FALSE, TRUE, TRUE);

-- Crear registros de team_members para los usuarios insertados
INSERT INTO team_members (
    user_id,
    employee_id,
    department,
    position,
    role_level,
    access_level,
    permissions,
    hire_date,
    employment_type,
    work_location
)
SELECT 
    u.id,
    CONCAT('EMP', LPAD(u.id, 4, '0')),
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'executive'
        WHEN u.email = 'cto@laburar.com' THEN 'development'
        WHEN u.email LIKE '%dev%' THEN 'development'
        WHEN u.email LIKE '%qa%' THEN 'qa_testing'
        WHEN u.email LIKE '%devops%' THEN 'devops'
        WHEN u.email LIKE '%designer%' THEN 'design'
        WHEN u.email LIKE '%analyst%' THEN 'data_analytics'
        ELSE 'operations'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'Chief Executive Officer'
        WHEN u.email = 'cto@laburar.com' THEN 'Chief Technology Officer'
        WHEN u.email = 'lead.dev@laburar.com' THEN 'Lead Developer'
        WHEN u.email = 'qa.manager@laburar.com' THEN 'QA Manager'
        WHEN u.email = 'devops@laburar.com' THEN 'DevOps Engineer'
        WHEN u.email = 'senior.dev@laburar.com' THEN 'Senior Developer'
        WHEN u.email = 'ux.designer@laburar.com' THEN 'UX/UI Designer'
        WHEN u.email = 'data.analyst@laburar.com' THEN 'Data Analyst'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'ceo'
        WHEN u.email = 'cto@laburar.com' THEN 'director'
        WHEN u.email LIKE '%lead%' OR u.email LIKE '%manager%' THEN 'lead'
        WHEN u.email LIKE '%senior%' THEN 'senior'
        ELSE 'mid'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN 'super_admin'
        WHEN u.email = 'cto@laburar.com' THEN 'super_admin'
        WHEN u.email LIKE '%lead%' OR u.email LIKE '%manager%' THEN 'admin'
        ELSE 'advanced'
    END,
    CASE 
        WHEN u.email = 'ceo@laburar.com' THEN JSON_ARRAY('full_access', 'financial_management', 'strategic_decisions', 'user_management', 'team_management')
        WHEN u.email = 'cto@laburar.com' THEN JSON_ARRAY('technical_leadership', 'system_architecture', 'development_oversight', 'security_management', 'user_management')
        WHEN u.email = 'lead.dev@laburar.com' THEN JSON_ARRAY('code_review', 'technical_decisions', 'team_coordination', 'deployment_management')
        WHEN u.email = 'qa.manager@laburar.com' THEN JSON_ARRAY('quality_assurance', 'testing_coordination', 'bug_management', 'release_approval')
        WHEN u.email = 'devops@laburar.com' THEN JSON_ARRAY('server_management', 'deployment_automation', 'monitoring', 'security_operations')
        WHEN u.email = 'senior.dev@laburar.com' THEN JSON_ARRAY('development', 'code_review', 'mentoring', 'technical_documentation')
        WHEN u.email = 'ux.designer@laburar.com' THEN JSON_ARRAY('ui_design', 'ux_research', 'prototyping', 'user_testing')
        WHEN u.email = 'data.analyst@laburar.com' THEN JSON_ARRAY('data_analysis', 'reporting', 'metrics_tracking', 'business_intelligence')
    END,
    CURDATE(),
    'full_time',
    'remote'
FROM users u
WHERE u.email IN (
    'ceo@laburar.com', 'cto@laburar.com', 'lead.dev@laburar.com', 
    'qa.manager@laburar.com', 'devops@laburar.com', 'senior.dev@laburar.com',
    'ux.designer@laburar.com', 'data.analyst@laburar.com'
)
AND u.user_category = 'team';

-- =====================================================
-- VERIFICACIÓN Y ESTADÍSTICAS
-- =====================================================

-- Mostrar estadísticas de la migración
SELECT 
    'RESUMEN DE MIGRACIÓN' as tipo,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_client = TRUE) as clientes,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_freelancer = TRUE) as freelancers,
    (SELECT COUNT(*) FROM users WHERE user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE) as ambos_roles,
    (SELECT COUNT(*) FROM users WHERE user_category = 'team') as equipo_tecnico,
    (SELECT COUNT(*) FROM team_members) as miembros_equipo;

-- Mostrar departamentos del equipo
SELECT 
    department as departamento,
    COUNT(*) as miembros,
    GROUP_CONCAT(DISTINCT role_level) as niveles
FROM team_members 
GROUP BY department
ORDER BY miembros DESC;

-- =====================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================

-- Índices compuestos para consultas frecuentes
ALTER TABLE users 
ADD INDEX idx_category_client (user_category, is_client),
ADD INDEX idx_category_freelancer (user_category, is_freelancer),
ADD INDEX idx_active_category (is_active, user_category);

ALTER TABLE team_members
ADD INDEX idx_dept_level (department, role_level),
ADD INDEX idx_access_active (access_level, is_active);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

ALTER TABLE users 
ADD COMMENT = 'Usuarios del sistema - Separados entre públicos (clientes/freelancers) y equipo técnico';

ALTER TABLE team_members 
ADD COMMENT = 'Miembros del equipo técnico y administrativo con roles específicos';

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

SELECT 
    '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as status,
    NOW() as timestamp,
    'Se creó nuevo sistema de roles flexible con separación de usuarios públicos y equipo técnico' as descripcion;