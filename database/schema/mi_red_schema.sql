-- =============================================================================
-- MI RED SYSTEM SCHEMA - RELACIONES A LARGO PLAZO
-- Sistema único de LABUREMOS para diferenciarse de modelos transaccionales
-- =============================================================================

-- 1. Tabla red_connections - Conexiones entre usuarios
CREATE TABLE red_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    freelancer_id INT NOT NULL,
    client_id INT NOT NULL,
    connection_type ENUM('favorite', 'trusted', 'partner', 'exclusive') DEFAULT 'favorite',
    relationship_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 a 5.00
    projects_together INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    first_project_date TIMESTAMP NULL,
    last_project_date TIMESTAMP NULL,
    status ENUM('active', 'paused', 'inactive') DEFAULT 'active',
    
    -- Configuración de relación
    priority_level ENUM('low', 'medium', 'high', 'vip') DEFAULT 'medium',
    notification_preferences JSON,
    collaboration_terms JSON, -- Condiciones especiales
    preferred_communication ENUM('chat', 'email', 'videollamada', 'whatsapp') DEFAULT 'chat',
    
    -- Métricas de relación
    response_time_avg INT DEFAULT 0, -- En minutos
    satisfaction_avg DECIMAL(3,2) DEFAULT 0.00,
    referrals_made INT DEFAULT 0,
    
    -- Metadata argentina
    argentina_features JSON,
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (freelancer_id, client_id),
    
    -- Índices para performance
    INDEX idx_freelancer_connections (freelancer_id, status),
    INDEX idx_client_connections (client_id, status),
    INDEX idx_connection_score (relationship_score DESC),
    INDEX idx_priority_level (priority_level, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla red_interaction_history - Historial de interacciones
CREATE TABLE red_interaction_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL,
    interaction_type ENUM('message', 'videocall', 'project_start', 'project_complete', 'payment', 'review', 'referral') NOT NULL,
    interaction_data JSON,
    impact_score DECIMAL(2,1) DEFAULT 0.0, -- -5.0 a +5.0
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (connection_id) REFERENCES red_connections(id) ON DELETE CASCADE,
    INDEX idx_connection_history (connection_id, created_at DESC),
    INDEX idx_interaction_type (interaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla red_preferred_terms - Términos preferenciales por relación
CREATE TABLE red_preferred_terms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL,
    term_type ENUM('pricing', 'delivery', 'communication', 'payment', 'extras') NOT NULL,
    term_config JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (connection_id) REFERENCES red_connections(id) ON DELETE CASCADE,
    INDEX idx_connection_terms (connection_id, term_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla red_recommendations - Sistema de recomendaciones entre red
CREATE TABLE red_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recommender_id INT NOT NULL, -- Quien recomienda
    recommended_id INT NOT NULL, -- Quien es recomendado
    recipient_id INT NOT NULL,   -- Quien recibe la recomendación
    service_category_id INT NULL,
    recommendation_text TEXT,
    trust_level ENUM('low', 'medium', 'high', 'guaranteed') DEFAULT 'medium',
    accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP NULL,
    project_result ENUM('excellent', 'good', 'fair', 'poor') NULL,
    referral_bonus DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recommender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recommended_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recommendations (recipient_id, accepted, created_at DESC),
    INDEX idx_recommender (recommender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Vista optimizada para dashboard Mi Red
CREATE VIEW v_mi_red_dashboard AS
SELECT 
    rc.*,
    u_freelancer.username as freelancer_username,
    u_freelancer.first_name as freelancer_first_name,
    u_freelancer.last_name as freelancer_last_name,
    u_freelancer.avatar_url as freelancer_avatar,
    u_client.username as client_username,
    u_client.first_name as client_first_name,
    u_client.last_name as client_last_name,
    u_client.avatar_url as client_avatar,
    
    -- Métricas calculadas
    DATEDIFF(NOW(), rc.last_project_date) as days_since_last_project,
    (rc.total_spent / GREATEST(rc.projects_together, 1)) as avg_project_value,
    
    -- Score de actividad reciente
    CASE 
        WHEN rc.last_project_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'recent'
        WHEN rc.last_project_date >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'moderate'
        WHEN rc.last_project_date >= DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 'inactive'
        ELSE 'dormant'
    END as activity_status,
    
    -- Próxima acción recomendada
    CASE 
        WHEN rc.last_project_date < DATE_SUB(NOW(), INTERVAL 60 DAY) THEN 'reconnect'
        WHEN rc.projects_together >= 3 AND rc.connection_type = 'favorite' THEN 'upgrade_relationship'
        WHEN rc.referrals_made = 0 THEN 'ask_referral'
        ELSE 'maintain'
    END as recommended_action

FROM red_connections rc
JOIN users u_freelancer ON rc.freelancer_id = u_freelancer.id
JOIN users u_client ON rc.client_id = u_client.id
WHERE rc.status = 'active';

-- 6. Stored Procedures para Mi Red

-- SP: Actualizar score de relación automáticamente
DELIMITER $$
CREATE PROCEDURE sp_update_relationship_score(
    IN p_connection_id INT,
    IN p_interaction_type VARCHAR(50),
    IN p_impact_score DECIMAL(2,1)
)
BEGIN
    DECLARE current_score DECIMAL(3,2);
    DECLARE new_score DECIMAL(3,2);
    
    -- Obtener score actual
    SELECT relationship_score INTO current_score
    FROM red_connections 
    WHERE id = p_connection_id;
    
    -- Calcular nuevo score con ponderación
    SET new_score = GREATEST(0.00, LEAST(5.00, 
        current_score + (p_impact_score * 0.1)
    ));
    
    -- Actualizar score
    UPDATE red_connections 
    SET relationship_score = new_score,
        updated_at = NOW()
    WHERE id = p_connection_id;
    
    -- Registrar interacción
    INSERT INTO red_interaction_history 
    (connection_id, interaction_type, impact_score, created_at)
    VALUES (p_connection_id, p_interaction_type, p_impact_score, NOW());
    
END$$
DELIMITER ;

-- SP: Sugerir conexiones basadas en comportamiento
DELIMITER $$
CREATE PROCEDURE sp_suggest_mi_red_connections(
    IN p_user_id INT,
    IN p_user_type ENUM('freelancer', 'client'),
    IN p_limit INT DEFAULT 10
)
BEGIN
    IF p_user_type = 'client' THEN
        -- Sugerir freelancers para cliente
        SELECT DISTINCT
            u.id as suggested_user_id,
            u.username,
            u.first_name,
            u.last_name,
            u.avatar_url,
            u.professional_title,
            
            -- Score de compatibilidad
            (
                -- Categorías similares
                (SELECT COUNT(*) * 2 FROM services s 
                 WHERE s.user_id = u.id 
                 AND s.category_id IN (
                     SELECT DISTINCT category_id FROM projects p 
                     WHERE p.client_id = p_user_id
                 )) +
                
                -- Ubicación argentina similar
                CASE 
                    WHEN u.location LIKE CONCAT('%', (
                        SELECT location FROM users WHERE id = p_user_id
                    ), '%') THEN 3
                    ELSE 0
                END +
                
                -- Trust signals
                (SELECT COUNT(*) FROM argentina_trust_signals ats 
                 WHERE ats.user_id = u.id AND ats.verified = TRUE)
                
            ) as compatibility_score,
            
            'based_on_history' as suggestion_reason
            
        FROM users u
        WHERE u.user_type = 'freelancer'
        AND u.id NOT IN (
            SELECT freelancer_id FROM red_connections 
            WHERE client_id = p_user_id
        )
        HAVING compatibility_score > 0
        ORDER BY compatibility_score DESC
        LIMIT p_limit;
    
    ELSE
        -- Sugerir clientes para freelancer
        SELECT DISTINCT
            u.id as suggested_user_id,
            u.username,
            u.first_name,
            u.last_name,
            u.avatar_url,
            
            -- Score de compatibilidad
            (
                -- Proyectos en categorías del freelancer
                (SELECT COUNT(*) * 2 FROM projects p 
                 WHERE p.client_id = u.id 
                 AND p.category_id IN (
                     SELECT DISTINCT category_id FROM services s 
                     WHERE s.user_id = p_user_id
                 )) +
                
                -- Presupuesto compatible
                CASE 
                    WHEN (SELECT AVG(budget) FROM projects WHERE client_id = u.id) >= 
                         (SELECT AVG(price) FROM services WHERE user_id = p_user_id) * 0.8
                    THEN 2
                    ELSE 0
                END
                
            ) as compatibility_score,
            
            'based_on_projects' as suggestion_reason
            
        FROM users u
        WHERE u.user_type = 'client'
        AND u.id NOT IN (
            SELECT client_id FROM red_connections 
            WHERE freelancer_id = p_user_id
        )
        HAVING compatibility_score > 0
        ORDER BY compatibility_score DESC
        LIMIT p_limit;
    
    END IF;
END$$
DELIMITER ;

-- 7. Triggers para automatización Mi Red

-- Trigger: Crear conexión automática después de proyecto exitoso
DELIMITER $$
CREATE TRIGGER tr_auto_create_connection
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
    DECLARE connection_exists INT DEFAULT 0;
    
    -- Si proyecto se completó exitosamente
    IF NEW.status = 'completed' AND NEW.client_rating >= 4 THEN
        
        -- Verificar si ya existe conexión
        SELECT COUNT(*) INTO connection_exists
        FROM red_connections 
        WHERE freelancer_id = NEW.freelancer_id 
        AND client_id = NEW.client_id;
        
        -- Crear conexión si no existe
        IF connection_exists = 0 THEN
            INSERT INTO red_connections 
            (freelancer_id, client_id, connection_type, first_project_date, 
             last_project_date, projects_together, total_spent, relationship_score)
            VALUES 
            (NEW.freelancer_id, NEW.client_id, 'favorite', NEW.created_at,
             NOW(), 1, NEW.total_amount, 3.5);
        ELSE
            -- Actualizar conexión existente
            UPDATE red_connections 
            SET projects_together = projects_together + 1,
                total_spent = total_spent + NEW.total_amount,
                last_project_date = NOW(),
                relationship_score = LEAST(5.0, relationship_score + 0.3)
            WHERE freelancer_id = NEW.freelancer_id 
            AND client_id = NEW.client_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- 8. Índices adicionales para performance
CREATE INDEX idx_red_activity_status ON red_connections 
    ((CASE 
        WHEN last_project_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'recent'
        WHEN last_project_date >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'moderate'
        ELSE 'inactive'
    END));

CREATE INDEX idx_red_value_clients ON red_connections 
    (total_spent DESC, projects_together DESC);

-- 9. Datos semilla para testing
INSERT INTO red_connections 
(freelancer_id, client_id, connection_type, projects_together, total_spent, 
 relationship_score, first_project_date, last_project_date) 
VALUES 
(2, 1, 'trusted', 5, 125000.00, 4.8, '2024-01-15', '2024-11-20'),
(3, 1, 'partner', 12, 480000.00, 4.9, '2023-06-10', '2024-12-01'),
(4, 1, 'favorite', 2, 35000.00, 4.2, '2024-09-05', '2024-10-15');