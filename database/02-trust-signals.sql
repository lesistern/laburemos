-- ================================
-- Trust Signals System
-- Verificaciones de confianza locales
-- ================================

USE laburemos_db;

-- Trust signals for user verification
CREATE TABLE trust_signals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    signal_type ENUM('afip_cuit', 'university_degree', 'chamber_member', 'client_reference', 'bank_account') NOT NULL,
    status ENUM('pending', 'verified', 'rejected', 'expired') DEFAULT 'pending',
    
    -- Datos de Verificación
    verification_data JSON COMMENT 'Datos específicos según tipo',
    documents JSON COMMENT 'URLs de documentos subidos',
    
    -- Metadatos
    verified_by BIGINT COMMENT 'Admin que verificó',
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_type (user_id, signal_type),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- AFIP specific verifications
CREATE TABLE afip_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    document_type ENUM('DNI', 'CI', 'LE', 'LC', 'CUIT-CUIL', 'PASAPORTE') NOT NULL,
    document_number VARCHAR(15) NOT NULL,
    business_name VARCHAR(255),
    tax_condition VARCHAR(50),
    activities JSON COMMENT 'Actividades económicas registradas',
    fiscal_address TEXT,
    verification_response JSON COMMENT 'Respuesta completa de AFIP API',
    last_verified TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_document (user_id, document_type, document_number),
    INDEX idx_document_verification (document_type, document_number),
    INDEX idx_last_verified (last_verified)
) ENGINE=InnoDB;

-- User reputation system
CREATE TABLE user_reputation (
    user_id BIGINT PRIMARY KEY,
    
    -- Ratings Promedio
    overall_rating DECIMAL(3,2) DEFAULT 0.00,
    communication_rating DECIMAL(3,2) DEFAULT 0.00,
    quality_rating DECIMAL(3,2) DEFAULT 0.00,
    delivery_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Contadores
    total_reviews INT DEFAULT 0,
    positive_reviews INT DEFAULT 0,
    negative_reviews INT DEFAULT 0,
    
    -- Métricas de Performance
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    repeat_client_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Score Local
    trust_score INT DEFAULT 50 COMMENT 'Score 0-100 específico local',
    
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_overall_rating (overall_rating),
    INDEX idx_trust_score (trust_score)
) ENGINE=InnoDB;

-- Badges system
CREATE TABLE badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(7) DEFAULT '#3B82F6',
    
    -- Requirements
    requirements JSON COMMENT 'Criterios para obtener el badge',
    is_automated BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- User badges earned
CREATE TABLE user_badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    badge_id INT NOT NULL,
    
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_visible BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id),
    INDEX idx_earned_at (earned_at)
) ENGINE=InnoDB;

-- ================================
-- STORED PROCEDURES
-- ================================

DELIMITER //

-- Calculate user reputation
CREATE PROCEDURE CalculateUserReputation(IN p_user_id BIGINT)
BEGIN
    DECLARE v_total_reviews INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_completion_rate DECIMAL(5,2) DEFAULT 0.00;
    
    -- Calculate average ratings from reviews
    SELECT 
        COUNT(*),
        AVG(rating),
        AVG(communication_rating),
        AVG(quality_rating),
        AVG(delivery_rating)
    INTO v_total_reviews, v_avg_rating, @comm_rating, @qual_rating, @deliv_rating
    FROM reviews 
    WHERE reviewed_id = p_user_id AND status = 'active';
    
    -- Calculate completion rate from projects
    SELECT 
        (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
    INTO v_completion_rate
    FROM projects 
    WHERE freelancer_id = p_user_id;
    
    -- Update or insert reputation
    INSERT INTO user_reputation (
        user_id, overall_rating, communication_rating, 
        quality_rating, delivery_rating, total_reviews, 
        completion_rate, last_calculated
    ) VALUES (
        p_user_id, COALESCE(v_avg_rating, 0.00), COALESCE(@comm_rating, 0.00),
        COALESCE(@qual_rating, 0.00), COALESCE(@deliv_rating, 0.00), v_total_reviews,
        COALESCE(v_completion_rate, 0.00), NOW()
    )
    ON DUPLICATE KEY UPDATE
        overall_rating = COALESCE(v_avg_rating, 0.00),
        communication_rating = COALESCE(@comm_rating, 0.00),
        quality_rating = COALESCE(@qual_rating, 0.00),
        delivery_rating = COALESCE(@deliv_rating, 0.00),
        total_reviews = v_total_reviews,
        completion_rate = COALESCE(v_completion_rate, 0.00),
        last_calculated = NOW();
END //

DELIMITER ;

-- ================================
-- INITIAL DATA
-- ================================

-- Insert default badges
INSERT INTO badges (name, slug, description, icon, requirements, is_automated) VALUES
('Nuevo Talento', 'nuevo-talento', 'Usuario recién registrado', '🌟', '{"projects_completed": 0}', TRUE),
('Talento Verificado', 'talento-verificado', 'Cuenta verificada con AFIP', '✅', '{"afip_verified": true}', TRUE),
('Top Rated', 'top-rated', 'Rating promedio superior a 4.8', '⭐', '{"min_rating": 4.8, "min_reviews": 10}', TRUE),
('Entrega Rápida', 'entrega-rapida', 'Entrega promedio en menos de 24hs', '⚡', '{"avg_delivery_hours": 24}', TRUE),
('Cliente Frecuente', 'cliente-frecuente', 'Más de 10 proyectos completados', '🎯', '{"projects_completed": 10}', TRUE);

SELECT 'Trust Signals System Created Successfully!' as Status;