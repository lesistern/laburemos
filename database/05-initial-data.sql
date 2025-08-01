-- ================================
-- Initial Data and Configuration
-- Datos iniciales del sistema
-- ================================

USE laburemos_db;

-- ================================
-- CATEGORIES BASED ON categorias.txt
-- ================================

-- Main categories (parent categories)
INSERT INTO categories (name, slug, icon, description, parent_id, is_trending, sort_order) VALUES
('Tendencias', 'tendencias', '🔥', 'Servicios en alta demanda', NULL, TRUE, 1),
('Artes Gráficas y Diseño', 'diseno', '🎨', 'Logos, ilustraciones, diseño web', NULL, FALSE, 2),
('Programación y Tecnología', 'programacion', '💻', 'Desarrollo web, apps, software', NULL, FALSE, 3),
('Marketing Digital', 'marketing', '📊', 'SEO, redes sociales, publicidad', NULL, FALSE, 4),
('Video y Animación', 'video', '🎬', 'Edición, motion graphics, 3D', NULL, FALSE, 5),
('Escritura y Traducción', 'escritura', '✍️', 'Contenido, copywriting, idiomas', NULL, FALSE, 6),
('Música y Audio', 'musica', '🎵', 'Producción, mezcla, locución', NULL, FALSE, 7),
('Negocios', 'negocios', '💼', 'Consultoría, planes, gestión', NULL, FALSE, 8),
('Finanzas', 'finanzas', '💰', 'Contabilidad, inversiones, fiscal', NULL, FALSE, 9),
('Servicios de IA', 'ia', '🤖', 'Automatización, chatbots, ML', NULL, TRUE, 10),
('Crecimiento Personal', 'crecimiento', '🌱', 'Coaching, fitness, bienestar', NULL, FALSE, 11),
('Consultoría', 'consultoria', '🎯', 'Estrategia, coaching, asesoría', NULL, FALSE, 12),
('Datos', 'datos', '📊', 'Análisis, ciencia de datos, ML', NULL, FALSE, 13),
('Fotografía', 'fotografia', '📷', 'Retratos, eventos, productos', NULL, FALSE, 14),
('Otros', 'otros', '🌟', 'Servicios diversos y especializados', NULL, FALSE, 15);

-- Subcategories for Tendencias
INSERT INTO categories (name, slug, icon, description, parent_id) VALUES
('Publica tu libro', 'publica-libro', '📚', 'Diseño, edición y marketing de libros', 1),
('Crea tu sitio web', 'crea-sitio-web', '🌐', 'E-commerce, WordPress, diseño web', 1),
('Crea tu marca', 'crea-marca', '🏷️', 'Estrategia de marca, redes sociales', 1),
('Encontrar un trabajo', 'encontrar-trabajo', '💼', 'CV, LinkedIn, preparación entrevistas', 1),
('Servicios de IA', 'servicios-ia', '🤖', 'IA, automatización, chatbots', 1);

-- Subcategories for Artes Gráficas y Diseño
INSERT INTO categories (name, slug, icon, description, parent_id) VALUES
('Logo e identidad de marca', 'logo-identidad', '🎨', 'Diseño de logos, branding', 2),
('Arte e ilustraciones', 'arte-ilustraciones', '🖼️', 'Ilustraciones, avatares, retratos', 2),
('Diseño de aplicaciones y sitios web', 'diseno-web-apps', '📱', 'UI/UX, landing pages, apps', 2),
('Producto y gaming', 'producto-gaming', '🎮', 'Game art, diseño de productos', 2),
('Diseño de impresión', 'diseno-impresion', '📄', 'Folletos, packaging, pósters', 2),
('Diseño visual', 'diseno-visual', '👁️', 'Presentaciones, infografías', 2),
('Diseño de marketing', 'diseno-marketing', '📢', 'Redes sociales, banners, email', 2),
('Diseño 3D', 'diseno-3d', '🎭', 'Modelado 3D, arquitectura, personajes', 2);

-- Subcategories for Programación y Tecnología
INSERT INTO categories (name, slug, icon, description, parent_id) VALUES
('Desarrollo de sitios web', 'desarrollo-web', '🌐', 'Sitios comerciales, e-commerce, WordPress', 3),
('Desarrollo de aplicaciones móviles', 'desarrollo-apps', '📱', 'iOS, Android, multiplataforma', 3),
('Desarrollo de IA', 'desarrollo-ia', '🤖', 'IA, automatización, chatbots', 3),
('Desarrollo de videojuegos', 'desarrollo-juegos', '🎮', 'Unity, Unreal Engine, Roblox', 3),
('Nube y ciberseguridad', 'nube-seguridad', '☁️', 'Cloud computing, DevOps, seguridad', 3),
('Desarrollo de software', 'desarrollo-software', '💻', 'Apps web, automatización, APIs', 3);

-- ================================
-- PAYMENT METHODS CONFIGURATION
-- ================================

CREATE TABLE mp_payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    method_id VARCHAR(50) NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    method_type ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash', 'digital_wallet') NOT NULL,
    
    -- Configuración específica
    min_amount DECIMAL(10,2) DEFAULT 0.00,
    max_amount DECIMAL(10,2) DEFAULT 999999.99,
    installments_available JSON COMMENT 'Cuotas disponibles',
    
    -- Estados
    is_active BOOLEAN DEFAULT TRUE,
    country_code VARCHAR(3) DEFAULT 'ARG',
    
    INDEX idx_method_type (method_type),
    INDEX idx_country (country_code)
) ENGINE=InnoDB;

-- Payment methods available in Argentina
INSERT INTO mp_payment_methods (method_id, method_name, method_type, installments_available) VALUES
('visa', 'Visa', 'credit_card', '[1,3,6,9,12,18,24]'),
('master', 'Mastercard', 'credit_card', '[1,3,6,9,12,18,24]'),
('amex', 'American Express', 'credit_card', '[1,3,6,9,12]'),
('naranja', 'Naranja', 'credit_card', '[1,3,6,9,12]'),
('cabal', 'Cabal', 'credit_card', '[1,3,6,9,12]'),
('maestro', 'Maestro', 'debit_card', '[1]'),
('visa_debit', 'Visa Débito', 'debit_card', '[1]'),
('pago_facil', 'Pago Fácil', 'cash', '[1]'),
('rapipago', 'Rapipago', 'cash', '[1]'),
('mercadopago_account', 'Dinero en cuenta', 'digital_wallet', '[1]');

-- ================================
-- PROVINCES AND CITIES
-- ================================

CREATE TABLE provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    UNIQUE KEY unique_code (code),
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Provinces of Argentina
INSERT INTO provinces (code, name) VALUES 
('CABA', 'Ciudad Autónoma de Buenos Aires'),
('BA', 'Buenos Aires'),
('CAT', 'Catamarca'),
('CHA', 'Chaco'),
('CHU', 'Chubut'),
('COR', 'Córdoba'),
('CRR', 'Corrientes'),
('ER', 'Entre Ríos'),
('FOR', 'Formosa'),
('JUJ', 'Jujuy'),
('LP', 'La Pampa'),
('LR', 'La Rioja'),
('MEN', 'Mendoza'),
('MIS', 'Misiones'),
('NEU', 'Neuquén'),
('RN', 'Río Negro'),
('SAL', 'Salta'),
('SJ', 'San Juan'),
('SL', 'San Luis'),
('SC', 'Santa Cruz'),
('SF', 'Santa Fe'),
('SE', 'Santiago del Estero'),
('TF', 'Tierra del Fuego'),
('TUC', 'Tucumán');

-- ================================
-- SYSTEM CONFIGURATION
-- ================================

CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB;

-- Initial system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_fee_percentage', '5.0', 'number', 'Porcentaje de comisión de la plataforma', FALSE),
('min_project_amount', '1000.00', 'number', 'Monto mínimo de proyecto en ARS', TRUE),
('max_project_amount', '1000000.00', 'number', 'Monto máximo de proyecto en ARS', TRUE),
('escrow_release_days', '7', 'number', 'Días para liberar fondos del escrow automáticamente', FALSE),
('maintenance_mode', 'false', 'boolean', 'Modo mantenimiento de la plataforma', TRUE),
('registration_enabled', 'true', 'boolean', 'Registro de nuevos usuarios habilitado', TRUE),
('default_timezone', 'America/Argentina/Buenos_Aires', 'string', 'Zona horaria por defecto', TRUE),
('support_email', 'soporte@laburar.com', 'string', 'Email de soporte técnico', FALSE),
('mercadopago_sandbox', 'true', 'boolean', 'Usar MercadoPago en modo sandbox', FALSE);

-- ================================
-- ADMIN USER
-- ================================

-- Insert admin user (password: LABUREMOS2025!)
INSERT INTO users (email, password_hash, first_name, last_name, status, user_type, email_verified) VALUES
('admin@laburar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Sistema', 'active', 'both', TRUE);

-- Insert admin profile
INSERT INTO user_profiles (user_id, bio, province, city, tax_condition) VALUES
(1, 'Administrador del sistema LABUREMOS', 'CABA', 'Buenos Aires', 'responsable_inscripto');

-- ================================
-- SAMPLE DATA FOR TESTING
-- ================================

-- Sample freelancer user
INSERT INTO users (email, password_hash, first_name, last_name, document_type, document_number, phone, status, user_type, email_verified) VALUES
('freelancer@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Pérez', 'CUIT-CUIL', '20-12345678-9', '+5491112345678', 'active', 'freelancer', TRUE);

-- Sample client user
INSERT INTO users (email, password_hash, first_name, last_name, document_type, document_number, phone, status, user_type, email_verified) VALUES
('cliente@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'González', 'CUIT-CUIL', '27-98765432-1', '+5491187654321', 'active', 'client', TRUE);

-- Sample profiles
INSERT INTO user_profiles (user_id, bio, province, city, skills, hourly_rate, tax_condition) VALUES
(2, 'Desarrollador web especializado en WordPress y PHP', 'CABA', 'Buenos Aires', '["PHP", "WordPress", "JavaScript", "MySQL"]', 2500.00, 'monotributo'),
(3, 'Emprendedora buscando servicios digitales para mi startup', 'CABA', 'Buenos Aires', '[]', NULL, 'monotributo');

-- Sample service
INSERT INTO services (user_id, category_id, title, slug, description, base_price, delivery_time_days, status) VALUES
(2, 3, 'Desarrollo de sitio web WordPress profesional', 'desarrollo-wordpress-profesional', 'Creo sitios web profesionales con WordPress, completamente personalizados según tus necesidades. Incluye diseño responsive, optimización SEO básica y panel de administración.', 25000.00, 7, 'active');

-- Sample service packages
INSERT INTO service_packages (service_id, package_type, name, description, price, delivery_time_days, features) VALUES
(1, 'basico', 'Paquete Básico', 'Sitio web con hasta 5 páginas', 25000.00, 7, '["5 páginas", "Diseño responsive", "Formulario de contacto"]'),
(1, 'completo', 'Paquete Completo', 'Sitio web completo con blog', 45000.00, 10, '["10 páginas", "Blog integrado", "SEO básico", "3 revisiones"]'),
(1, 'premium', 'Paquete Premium', 'Sitio web avanzado con e-commerce', 75000.00, 15, '["E-commerce completo", "Pasarela de pagos", "SEO avanzado", "Capacitación"]');

-- Sample trust signals
INSERT INTO trust_signals (user_id, signal_type, status, verification_data) VALUES
(2, 'afip_cuit', 'verified', '{"cuit": "20123456789", "condition": "monotributo", "verified_date": "2025-07-23"}');

-- Initialize user reputation
INSERT INTO user_reputation (user_id, overall_rating, total_reviews, trust_score) VALUES
(2, 4.8, 0, 75),
(3, 0.0, 0, 50);

-- ================================
-- ANALYTICS TABLES
-- ================================

CREATE TABLE daily_metrics (
    date DATE PRIMARY KEY,
    new_users INT DEFAULT 0,
    new_services INT DEFAULT 0,
    new_projects INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    active_users INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    INDEX idx_date (date)
) ENGINE=InnoDB;

CREATE TABLE user_metrics (
    user_id BIGINT PRIMARY KEY,
    total_projects INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    last_activity TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Initialize metrics for sample users
INSERT INTO user_metrics (user_id, total_projects, total_earnings, total_spent, last_activity) VALUES
(1, 0, 0.00, 0.00, NOW()),
(2, 0, 0.00, 0.00, NOW()),
(3, 0, 0.00, 0.00, NOW());

-- ================================
-- SECURITY TABLES
-- ================================

CREATE TABLE rate_limits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL COMMENT 'IP o user_id',
    action VARCHAR(50) NOT NULL,
    attempts INT DEFAULT 0,
    reset_time TIMESTAMP NOT NULL,
    
    UNIQUE KEY unique_rate_limit (identifier, action),
    INDEX idx_reset_time (reset_time)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id BIGINT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_action (user_id, action),
    INDEX idx_timestamp (created_at)
) ENGINE=InnoDB;

-- ================================
-- UPDATE CATEGORIES COUNT
-- ================================

-- Update service count for categories
UPDATE categories SET service_count = (
    SELECT COUNT(*) FROM services WHERE category_id = categories.id AND status = 'active'
);

SELECT 'Initial Data Loaded Successfully!' as Status,
       COUNT(*) as 'Total Categories' FROM categories WHERE parent_id IS NULL;

SELECT 'Database Setup Complete!' as Status;