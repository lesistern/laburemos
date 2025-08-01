-- =====================================================
-- Badge System for LABUREMOS
-- =====================================================
-- Author: LABUREMOS Team
-- Created: 2025-01-25
-- Description: Badge system for early adopters and achievements
-- =====================================================

USE laburemos_db;

-- =====================================================
-- BADGE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS badge_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6FBFEF',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BADGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    criteria TEXT, -- JSON field for badge criteria
    icon VARCHAR(255), -- Icon file or class
    image_url VARCHAR(500), -- Badge image URL
    rarity ENUM('common', 'rare', 'epic', 'legendary', 'exclusive') DEFAULT 'common',
    points INT DEFAULT 0, -- Points/value of the badge
    max_count INT DEFAULT 1, -- How many times can be earned (NULL = unlimited)
    is_active BOOLEAN DEFAULT TRUE,
    is_automatic BOOLEAN DEFAULT TRUE, -- Auto-assigned vs manually granted
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES badge_categories(id),
    INDEX idx_category (category_id),
    INDEX idx_slug (slug),
    INDEX idx_rarity (rarity),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER BADGES TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress INT DEFAULT 0, -- For progressive badges (0-100)
    metadata JSON, -- Additional data about how badge was earned
    is_featured BOOLEAN DEFAULT FALSE, -- User can feature certain badges
    display_order INT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id),
    INDEX idx_badge (badge_id),
    INDEX idx_earned (earned_at),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BADGE MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS badge_milestones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    badge_id INT NOT NULL,
    milestone_value INT NOT NULL,
    milestone_name VARCHAR(100),
    milestone_description TEXT,
    reward_points INT DEFAULT 0,
    
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    INDEX idx_badge_milestone (badge_id, milestone_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT BADGE CATEGORIES
-- =====================================================
INSERT INTO badge_categories (name, slug, description, icon, color, display_order) VALUES
('Pioneros', 'pioneros', 'Badges para los primeros usuarios de LABUREMOS', 'rocket', '#FFD700', 1),
('Hitos de Proyectos', 'proyectos', 'Logros relacionados con completar proyectos', 'briefcase', '#4CAF50', 2),
('Reputación', 'reputacion', 'Badges por mantener alta calificación', 'star', '#FFC107', 3),
('Ingresos', 'ingresos', 'Hitos de facturación en la plataforma', 'dollar-sign', '#2196F3', 4),
('Comunidad', 'comunidad', 'Participación activa en la comunidad', 'users', '#9C27B0', 5),
('Verificación', 'verificacion', 'Badges de verificación y confianza', 'shield', '#00BCD4', 6),
('Especiales', 'especiales', 'Badges únicos y de eventos especiales', 'award', '#E91E63', 7);

-- =====================================================
-- INSERT BADGES
-- =====================================================

-- PIONEROS BADGES (First 100 users)
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Fundador #1', 'fundador-1', 'El primer usuario registrado en LABUREMOS', 
 '{"user_rank": 1}', 'trophy', 'legendary', 1000, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Top 10 Pioneros', 'top-10-pioneros', 'Entre los primeros 10 usuarios de LABUREMOS', 
 '{"user_rank_max": 10}', 'medal', 'epic', 500, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Pionero de Oro', 'pionero-oro', 'Entre los primeros 25 usuarios', 
 '{"user_rank_max": 25}', 'star', 'epic', 300, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Pionero de Plata', 'pionero-plata', 'Entre los primeros 50 usuarios', 
 '{"user_rank_max": 50}', 'star-half', 'rare', 200, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Pionero de Bronce', 'pionero-bronce', 'Entre los primeros 100 usuarios', 
 '{"user_rank_max": 100}', 'star-outline', 'rare', 100, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'pioneros'), 
 'Early Adopter', 'early-adopter', 'Registrado en el primer mes de LABUREMOS', 
 '{"days_since_launch": 30}', 'clock', 'rare', 150, TRUE);

-- HITOS DE PROYECTOS
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Primer Proyecto', 'primer-proyecto', 'Completaste tu primer proyecto exitosamente', 
 '{"projects_completed": 1}', 'check-circle', 'common', 50, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Veterano', 'veterano-5', 'Has completado 5 proyectos', 
 '{"projects_completed": 5}', 'briefcase', 'common', 100, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Profesional', 'profesional-10', 'Has completado 10 proyectos', 
 '{"projects_completed": 10}', 'briefcase', 'rare', 200, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Experto', 'experto-25', 'Has completado 25 proyectos', 
 '{"projects_completed": 25}', 'award', 'epic', 500, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Maestro', 'maestro-50', 'Has completado 50 proyectos', 
 '{"projects_completed": 50}', 'crown', 'legendary', 1000, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'proyectos'), 
 'Leyenda', 'leyenda-100', 'Has completado 100 proyectos', 
 '{"projects_completed": 100}', 'fire', 'legendary', 2000, TRUE);

-- REPUTACIÓN BADGES
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'reputacion'), 
 'Estrella Naciente', 'estrella-naciente', 'Mantené 4.5+ estrellas por 10 reviews', 
 '{"min_rating": 4.5, "min_reviews": 10}', 'star', 'common', 100, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'reputacion'), 
 'Top Rated', 'top-rated', 'Mantené 4.8+ estrellas por 25 reviews', 
 '{"min_rating": 4.8, "min_reviews": 25}', 'star', 'rare', 300, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'reputacion'), 
 'Perfeccionista', 'perfeccionista', '5 estrellas perfectas en 50+ reviews', 
 '{"min_rating": 5.0, "min_reviews": 50}', 'gem', 'epic', 750, TRUE);

-- INGRESOS BADGES
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'ingresos'), 
 'Primer Peso', 'primer-peso', 'Ganaste tu primer peso en LABUREMOS', 
 '{"earnings_min": 1}', 'dollar-sign', 'common', 25, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'ingresos'), 
 'Emprendedor', 'emprendedor-10k', 'Facturaste AR$ 10,000', 
 '{"earnings_min": 10000}', 'trending-up', 'common', 100, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'ingresos'), 
 'Profesional Exitoso', 'profesional-50k', 'Facturaste AR$ 50,000', 
 '{"earnings_min": 50000}', 'chart-line', 'rare', 250, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'ingresos'), 
 'Top Earner', 'top-earner-100k', 'Facturaste AR$ 100,000', 
 '{"earnings_min": 100000}', 'trophy', 'epic', 500, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'ingresos'), 
 'Millonario', 'millonario', 'Facturaste AR$ 1,000,000', 
 '{"earnings_min": 1000000}', 'diamond', 'legendary', 2000, TRUE);

-- COMUNIDAD BADGES
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'comunidad'), 
 'Buen Vecino', 'buen-vecino', 'Ayudaste a 5 freelancers nuevos', 
 '{"helped_newbies": 5}', 'heart', 'common', 100, FALSE),

((SELECT id FROM badge_categories WHERE slug = 'comunidad'), 
 'Mentor', 'mentor', 'Fuiste mentor de 10 freelancers', 
 '{"mentored_users": 10}', 'graduation-cap', 'rare', 300, FALSE),

((SELECT id FROM badge_categories WHERE slug = 'comunidad'), 
 'Embajador', 'embajador', 'Referiste 25 usuarios nuevos a LABUREMOS', 
 '{"referrals": 25}', 'megaphone', 'epic', 750, TRUE);

-- VERIFICACIÓN BADGES
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'verificacion'), 
 'Identidad Verificada', 'identidad-verificada', 'Verificaste tu identidad con DNI', 
 '{"verified_dni": true}', 'id-card', 'common', 50, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'verificacion'), 
 'CUIT Verificado', 'cuit-verificado', 'Verificaste tu CUIT/CUIL', 
 '{"verified_cuit": true}', 'building', 'common', 75, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'verificacion'), 
 'Profesional Certificado', 'profesional-certificado', 'Verificaste tu título universitario', 
 '{"verified_degree": true}', 'certificate', 'rare', 200, TRUE),

((SELECT id FROM badge_categories WHERE slug = 'verificacion'), 
 'Triple Verificado', 'triple-verificado', 'DNI + CUIT + Título verificados', 
 '{"verified_dni": true, "verified_cuit": true, "verified_degree": true}', 'shield-check', 'epic', 500, TRUE);

-- ESPECIALES BADGES
INSERT INTO badges (category_id, name, slug, description, criteria, icon, rarity, points, is_automatic) VALUES
((SELECT id FROM badge_categories WHERE slug = 'especiales'), 
 'LABUREMOS Beta Tester', 'beta-tester', 'Participaste en la fase beta', 
 '{"beta_tester": true}', 'flask', 'exclusive', 1000, FALSE),

((SELECT id FROM badge_categories WHERE slug = 'especiales'), 
 'Día de la Independencia 2025', 'independencia-2025', 'Activo el 9 de Julio 2025', 
 '{"event_date": "2025-07-09"}', 'flag', 'exclusive', 250, FALSE),

((SELECT id FROM badge_categories WHERE slug = 'especiales'), 
 'Navidad 2025', 'navidad-2025', 'Completaste un proyecto en Navidad 2025', 
 '{"event": "christmas-2025"}', 'gift', 'exclusive', 300, FALSE),

((SELECT id FROM badge_categories WHERE slug = 'especiales'), 
 'Freelancer del Año', 'freelancer-del-ano', 'Elegido como Freelancer del Año', 
 '{"award": "freelancer_of_year"}', 'crown', 'legendary', 5000, FALSE);

-- =====================================================
-- CREATE TRIGGER FOR FIRST 100 USERS
-- =====================================================
DELIMITER //

CREATE TRIGGER assign_pioneer_badges
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE user_count INT;
    DECLARE badge_id_to_assign INT;
    
    -- Only assign pioneer badges to regular users (freelancers/clients)
    -- Exclude admin, moderator, and system users
    IF NEW.role NOT IN ('admin', 'moderator', 'system', 'support') THEN
        
        -- Get the current user count (excluding admin/mod/system users)
        SELECT COUNT(*) INTO user_count 
        FROM users 
        WHERE id <= NEW.id 
        AND role NOT IN ('admin', 'moderator', 'system', 'support');
        
        -- Assign appropriate pioneer badge based on rank
        IF user_count = 1 THEN
            -- First user gets Fundador #1
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'fundador-1';
        ELSEIF user_count <= 10 THEN
            -- Top 10 users
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'top-10-pioneros';
        ELSEIF user_count <= 25 THEN
            -- Top 25 users
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'pionero-oro';
        ELSEIF user_count <= 50 THEN
            -- Top 50 users
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'pionero-plata';
        ELSEIF user_count <= 100 THEN
            -- Top 100 users
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'pionero-bronce';
        END IF;
        
        -- Insert the badge if one was selected
        IF badge_id_to_assign IS NOT NULL THEN
            INSERT INTO user_badges (user_id, badge_id, metadata)
            VALUES (NEW.id, badge_id_to_assign, JSON_OBJECT('user_rank', user_count));
        END IF;
        
        -- Check for early adopter (within 30 days of launch)
        IF DATEDIFF(NOW(), '2025-01-25') <= 30 THEN
            SELECT id INTO badge_id_to_assign FROM badges WHERE slug = 'early-adopter';
            INSERT IGNORE INTO user_badges (user_id, badge_id)
            VALUES (NEW.id, badge_id_to_assign);
        END IF;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- STORED PROCEDURE TO CHECK AND ASSIGN BADGES
-- =====================================================
DELIMITER //

CREATE PROCEDURE CheckAndAssignBadges(IN p_user_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE badge_id INT;
    DECLARE badge_criteria JSON;
    DECLARE cur CURSOR FOR 
        SELECT id, criteria FROM badges 
        WHERE is_active = TRUE AND is_automatic = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO badge_id, badge_criteria;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Check various badge criteria
        -- This is a simplified version - in production, you'd have more complex logic
        
        -- Projects completed badges
        IF JSON_EXTRACT(badge_criteria, '$.projects_completed') IS NOT NULL THEN
            CALL CheckProjectBadge(p_user_id, badge_id, JSON_EXTRACT(badge_criteria, '$.projects_completed'));
        END IF;
        
        -- Earnings badges
        IF JSON_EXTRACT(badge_criteria, '$.earnings_min') IS NOT NULL THEN
            CALL CheckEarningsBadge(p_user_id, badge_id, JSON_EXTRACT(badge_criteria, '$.earnings_min'));
        END IF;
        
        -- Rating badges
        IF JSON_EXTRACT(badge_criteria, '$.min_rating') IS NOT NULL THEN
            CALL CheckRatingBadge(p_user_id, badge_id, 
                JSON_EXTRACT(badge_criteria, '$.min_rating'),
                JSON_EXTRACT(badge_criteria, '$.min_reviews'));
        END IF;
        
    END LOOP;
    
    CLOSE cur;
END//

DELIMITER ;

-- =====================================================
-- HELPER PROCEDURES FOR BADGE CHECKS
-- =====================================================
DELIMITER //

CREATE PROCEDURE CheckProjectBadge(
    IN p_user_id INT, 
    IN p_badge_id INT, 
    IN p_required_projects INT
)
BEGIN
    DECLARE project_count INT;
    
    SELECT COUNT(*) INTO project_count
    FROM projects
    WHERE freelancer_id = p_user_id AND status = 'completed';
    
    IF project_count >= p_required_projects THEN
        INSERT IGNORE INTO user_badges (user_id, badge_id, metadata)
        VALUES (p_user_id, p_badge_id, JSON_OBJECT('projects_completed', project_count));
    END IF;
END//

CREATE PROCEDURE CheckEarningsBadge(
    IN p_user_id INT, 
    IN p_badge_id INT, 
    IN p_required_earnings DECIMAL(12,2)
)
BEGIN
    DECLARE total_earnings DECIMAL(12,2);
    
    SELECT COALESCE(SUM(amount), 0) INTO total_earnings
    FROM transactions
    WHERE user_id = p_user_id AND status = 'completed';
    
    IF total_earnings >= p_required_earnings THEN
        INSERT IGNORE INTO user_badges (user_id, badge_id, metadata)
        VALUES (p_user_id, p_badge_id, JSON_OBJECT('total_earnings', total_earnings));
    END IF;
END//

CREATE PROCEDURE CheckRatingBadge(
    IN p_user_id INT, 
    IN p_badge_id INT, 
    IN p_min_rating DECIMAL(3,2),
    IN p_min_reviews INT
)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE review_count INT;
    
    SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
    FROM reviews
    WHERE freelancer_id = p_user_id;
    
    IF avg_rating >= p_min_rating AND review_count >= p_min_reviews THEN
        INSERT IGNORE INTO user_badges (user_id, badge_id, metadata)
        VALUES (p_user_id, p_badge_id, JSON_OBJECT(
            'average_rating', avg_rating, 
            'review_count', review_count
        ));
    END IF;
END//

DELIMITER ;

-- =====================================================
-- VIEWS FOR EASY BADGE QUERIES
-- =====================================================
CREATE VIEW user_badge_summary AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT ub.badge_id) as total_badges,
    SUM(b.points) as total_points,
    MAX(CASE WHEN b.rarity = 'legendary' THEN 1 ELSE 0 END) as has_legendary,
    MAX(CASE WHEN b.rarity = 'epic' THEN 1 ELSE 0 END) as has_epic,
    GROUP_CONCAT(DISTINCT bc.slug) as badge_categories
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id
LEFT JOIN badge_categories bc ON b.category_id = bc.id
GROUP BY u.id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant permissions for the application user if needed
-- GRANT SELECT, INSERT, UPDATE ON laburemos_db.badges TO 'laburemos_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON laburemos_db.user_badges TO 'laburemos_user'@'localhost';
-- GRANT SELECT ON laburemos_db.badge_categories TO 'laburemos_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE laburemos_db.CheckAndAssignBadges TO 'laburemos_user'@'localhost';