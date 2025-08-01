-- =============================================================================
-- LABURAR SERVICIOS ARGENTINOS SCHEMA
-- Extensión para sistema ServicioLaR con mecánicas argentinas
-- =============================================================================

-- 1. Tabla service_packages - Sistema de paquetes argentinos
CREATE TABLE service_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    package_type ENUM('basico', 'completo', 'premium', 'colaborativo') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency ENUM('ARS', 'USD') DEFAULT 'ARS',
    delivery_days INT NOT NULL,
    revisions_included INT DEFAULT 1,
    videollamadas_included INT DEFAULT 0,
    features JSON,
    cuotas_disponibles BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    
    -- Índices optimizados
    INDEX idx_service_package (service_id, package_type),
    INDEX idx_package_type (package_type),
    INDEX idx_price_currency (price, currency),
    INDEX idx_active_packages (is_active, service_id),
    
    -- Constraint único: un solo paquete de cada tipo por servicio
    UNIQUE KEY unique_service_package_type (service_id, package_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla argentina_trust_signals - Badges y verificaciones argentinas
CREATE TABLE argentina_trust_signals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    signal_type ENUM('monotributo', 'camara_comercio', 'universidad', 'referencias_locales', 'identidad_verificada') NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    expiry_date TIMESTAMP NULL,
    verification_method ENUM('automatico', 'manual', 'api_afip', 'documento') DEFAULT 'manual',
    metadata JSON,
    verifier_user_id INT NULL, -- Admin que verificó
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_user_verified (user_id, verified),
    INDEX idx_signal_type (signal_type),
    INDEX idx_expiry_date (expiry_date),
    
    -- Constraint único: un solo signal de cada tipo por usuario
    UNIQUE KEY unique_user_signal (user_id, signal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Extensiones a tabla services existente
ALTER TABLE services 
ADD COLUMN service_type ENUM('gig', 'custom', 'hybrid') DEFAULT 'gig' AFTER category_id,
ADD COLUMN argentina_features JSON AFTER service_type,
ADD COLUMN monotributo_verified BOOLEAN DEFAULT FALSE AFTER argentina_features,
ADD COLUMN videollamada_available BOOLEAN DEFAULT FALSE AFTER monotributo_verified,
ADD COLUMN cuotas_disponibles BOOLEAN DEFAULT FALSE AFTER videollamada_available,
ADD COLUMN talento_argentino_badge BOOLEAN DEFAULT FALSE AFTER cuotas_disponibles,
ADD COLUMN ubicacion_argentina VARCHAR(100) AFTER talento_argentino_badge;

-- Índices para las nuevas columnas
ALTER TABLE services 
ADD INDEX idx_service_type (service_type),
ADD INDEX idx_monotributo (monotributo_verified),
ADD INDEX idx_videollamada (videollamada_available),
ADD INDEX idx_ubicacion (ubicacion_argentina);

-- 4. Vista optimizada para servicios con paquetes
CREATE VIEW v_servicios_argentinos AS
SELECT 
    s.*,
    u.username,
    u.avatar_url,
    u.first_name,
    u.last_name,
    COUNT(sp.id) as packages_count,
    MIN(sp.price) as price_from,
    MAX(sp.price) as price_to,
    GROUP_CONCAT(sp.package_type ORDER BY 
        FIELD(sp.package_type, 'basico', 'completo', 'premium', 'colaborativo')
    ) as available_packages,
    -- Trust score calculado
    (
        SELECT COUNT(*) * 20 
        FROM argentina_trust_signals ats 
        WHERE ats.user_id = s.user_id AND ats.verified = TRUE
    ) as trust_score
FROM services s
JOIN users u ON s.user_id = u.id
LEFT JOIN service_packages sp ON s.id = sp.service_id AND sp.is_active = TRUE
WHERE s.status = 'active'
GROUP BY s.id;

-- 5. Tabla service_package_features - Features específicos de paquetes
CREATE TABLE service_package_features (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    feature_type ENUM('inclusion', 'delivery', 'communication', 'revision', 'extra') NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    feature_value VARCHAR(500),
    is_highlighted BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    INDEX idx_package_features (package_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Triggers para mantener consistencia

-- Trigger: Actualizar trust badge cuando se verifican signals
DELIMITER $$
CREATE TRIGGER tr_update_talento_argentino
AFTER UPDATE ON argentina_trust_signals
FOR EACH ROW
BEGIN
    DECLARE trust_count INT;
    
    IF NEW.verified = TRUE AND OLD.verified = FALSE THEN
        SELECT COUNT(*) INTO trust_count
        FROM argentina_trust_signals 
        WHERE user_id = NEW.user_id AND verified = TRUE;
        
        -- Si tiene 3+ verificaciones, otorgar badge Talento Argentino
        IF trust_count >= 3 THEN
            UPDATE services 
            SET talento_argentino_badge = TRUE 
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- Trigger: Validar paquetes por servicio
DELIMITER $$
CREATE TRIGGER tr_validate_service_packages
BEFORE INSERT ON service_packages
FOR EACH ROW
BEGIN
    DECLARE package_count INT;
    
    SELECT COUNT(*) INTO package_count
    FROM service_packages 
    WHERE service_id = NEW.service_id AND is_active = TRUE;
    
    -- Máximo 4 paquetes por servicio
    IF package_count >= 4 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Máximo 4 paquetes permitidos por servicio';
    END IF;
    
    -- Validar precios progresivos
    IF NEW.package_type = 'completo' THEN
        IF EXISTS (
            SELECT 1 FROM service_packages sp 
            WHERE sp.service_id = NEW.service_id 
            AND sp.package_type = 'basico' 
            AND sp.price >= NEW.price
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Precio completo debe ser mayor al básico';
        END IF;
    END IF;
END$$
DELIMITER ;

-- 7. Datos semilla para testing
INSERT INTO service_package_features (package_id, feature_type, feature_name, feature_value, is_highlighted, display_order) VALUES
(1, 'inclusion', 'Revisiones incluidas', '2', TRUE, 1),
(1, 'delivery', 'Entrega', '3 días', TRUE, 2),
(1, 'communication', 'Soporte', 'Chat', FALSE, 3);

-- 8. Procedimientos almacenados para operaciones comunes

-- SP: Crear servicio argentino completo
DELIMITER $$
CREATE PROCEDURE sp_create_servicio_argentino(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_service_type ENUM('gig', 'custom', 'hybrid'),
    IN p_categoria VARCHAR(100),
    IN p_ubicacion VARCHAR(100),
    IN p_videollamada BOOLEAN,
    IN p_packages JSON
)
BEGIN
    DECLARE v_service_id INT;
    DECLARE v_package_data JSON;
    DECLARE v_package_type VARCHAR(50);
    DECLARE v_package_price DECIMAL(10,2);
    DECLARE v_package_name VARCHAR(255);
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_package_count INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Crear servicio base
    INSERT INTO services (
        user_id, title, description, service_type, 
        ubicacion_argentina, videollamada_available, status
    ) VALUES (
        p_user_id, p_title, p_description, p_service_type,
        p_ubicacion, p_videollamada, 'active'
    );
    
    SET v_service_id = LAST_INSERT_ID();
    
    -- Crear paquetes
    SET v_package_count = JSON_LENGTH(p_packages);
    
    WHILE v_counter < v_package_count DO
        SET v_package_data = JSON_EXTRACT(p_packages, CONCAT('$[', v_counter, ']'));
        SET v_package_type = JSON_UNQUOTE(JSON_EXTRACT(v_package_data, '$.type'));
        SET v_package_price = JSON_EXTRACT(v_package_data, '$.price');
        SET v_package_name = JSON_UNQUOTE(JSON_EXTRACT(v_package_data, '$.name'));
        
        INSERT INTO service_packages (
            service_id, package_type, name, price, 
            delivery_days, revisions_included
        ) VALUES (
            v_service_id, v_package_type, v_package_name, v_package_price,
            JSON_EXTRACT(v_package_data, '$.delivery_days'),
            JSON_EXTRACT(v_package_data, '$.revisions')
        );
        
        SET v_counter = v_counter + 1;
    END WHILE;
    
    COMMIT;
    
    SELECT v_service_id as service_id;
END$$
DELIMITER ;