-- ================================
-- Projects and Payments System
-- Sistema de proyectos y pagos con MercadoPago
-- ================================

USE laburemos_db;

-- Projects/Orders main table
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Participantes
    client_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    package_id BIGINT NULL,
    
    -- Información del Proyecto
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    
    -- Comercial
    total_amount DECIMAL(10,2) NOT NULL COMMENT 'Monto total en ARS',
    platform_fee DECIMAL(10,2) NOT NULL,
    freelancer_amount DECIMAL(10,2) NOT NULL,
    
    -- Timeline
    delivery_date TIMESTAMP NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Estado
    status ENUM('pending', 'active', 'in_review', 'revision_requested', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
    
    -- Archivos
    client_files JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE SET NULL,
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_status (status),
    INDEX idx_dates (created_at, delivery_date)
) ENGINE=InnoDB;

-- Project milestones
CREATE TABLE project_milestones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL COMMENT 'Monto del hito en ARS',
    due_date TIMESTAMP NOT NULL,
    
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    
    -- Entregables
    deliverables JSON,
    client_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_status (project_id, status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- Payment transactions
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Referencias
    project_id BIGINT NOT NULL,
    payer_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    
    -- MercadoPago
    mercadopago_payment_id VARCHAR(255) UNIQUE,
    mercadopago_preference_id VARCHAR(255),
    
    -- Montos en ARS
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Estado
    status ENUM('pending', 'approved', 'in_process', 'rejected', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    
    -- Fechas
    paid_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL COMMENT 'Cuándo se liberó del escrow',
    
    -- Metadatos
    metadata JSON,
    mercadopago_response JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_mercadopago (mercadopago_payment_id),
    INDEX idx_status (status),
    INDEX idx_project (project_id)
) ENGINE=InnoDB;

-- Escrow accounts for secure payments
CREATE TABLE escrow_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    payment_id BIGINT NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('locked', 'released', 'disputed') DEFAULT 'locked',
    
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_date TIMESTAMP NOT NULL,
    released_at TIMESTAMP NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    INDEX idx_project (project_id),
    INDEX idx_release_date (release_date)
) ENGINE=InnoDB;

-- Invoice system for tax compliance
CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Referencias
    project_id BIGINT NOT NULL,
    payment_id BIGINT NULL,
    issuer_id BIGINT NOT NULL COMMENT 'Quien emite la factura',
    client_id BIGINT NOT NULL COMMENT 'Quien recibe la factura',
    
    -- Datos de Facturación
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type ENUM('A', 'B', 'C', 'E') NOT NULL COMMENT 'Tipo de factura AFIP',
    fiscal_period VARCHAR(7) NOT NULL COMMENT 'YYYY-MM formato',
    
    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'IVA u otros impuestos',
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Datos del Emisor
    issuer_name VARCHAR(255) NOT NULL,
    issuer_cuit VARCHAR(13) NOT NULL,
    issuer_address TEXT NOT NULL,
    issuer_tax_condition VARCHAR(50) NOT NULL,
    
    -- Datos del Cliente
    client_name VARCHAR(255) NOT NULL,
    client_cuit VARCHAR(13),
    client_address TEXT,
    client_tax_condition VARCHAR(50),
    
    -- Items de la Factura
    items JSON NOT NULL COMMENT 'Detalle de servicios facturados',
    
    -- Estado y Fechas
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    
    -- AFIP Integration
    afip_cae VARCHAR(20) COMMENT 'Código de Autorización Electrónico',
    afip_cae_due_date DATE COMMENT 'Vencimiento del CAE',
    afip_response JSON COMMENT 'Respuesta completa de AFIP',
    
    -- Archivos
    pdf_path VARCHAR(255) COMMENT 'Ruta del PDF generado',
    xml_path VARCHAR(255) COMMENT 'XML para AFIP',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_issuer (issuer_id),
    INDEX idx_client (client_id),
    INDEX idx_fiscal_period (fiscal_period),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB;

-- MercadoPago configuration
CREATE TABLE mercadopago_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL COMMENT 'NULL para config global',
    
    -- Credenciales
    access_token VARCHAR(255) NOT NULL,
    public_key VARCHAR(255) NOT NULL,
    client_id VARCHAR(50),
    client_secret VARCHAR(255),
    
    -- Configuración
    environment ENUM('sandbox', 'production') DEFAULT 'sandbox',
    webhook_url VARCHAR(255),
    
    -- Estados
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_environment (environment)
) ENGINE=InnoDB;

-- MercadoPago webhooks
CREATE TABLE mercadopago_webhooks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Datos del Webhook
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    
    -- Referencias
    resource_id VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    payment_id BIGINT NULL,
    
    -- Payload
    raw_payload JSON NOT NULL,
    processed_at TIMESTAMP NULL,
    
    -- Estado
    status ENUM('pending', 'processed', 'failed', 'ignored') DEFAULT 'pending',
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_resource (resource_id, resource_type),
    INDEX idx_status (status),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB;

-- ================================
-- STORED PROCEDURES
-- ================================

DELIMITER //

-- Create MercadoPago payment preference
CREATE PROCEDURE CreateMercadoPagoPreference(
    IN p_project_id BIGINT,
    IN p_amount DECIMAL(10,2),
    IN p_description TEXT,
    OUT p_preference_id VARCHAR(255)
)
BEGIN
    DECLARE v_payment_id BIGINT;
    
    -- Crear registro de pago
    INSERT INTO payments (
        project_id, payer_id, recipient_id, 
        amount, platform_fee, net_amount, status
    ) SELECT 
        p_project_id, client_id, freelancer_id,
        p_amount, p_amount * 0.05, p_amount * 0.95, 'pending'
    FROM projects WHERE id = p_project_id;
    
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Generar preference_id único
    SET p_preference_id = CONCAT('LABURAR-', v_payment_id, '-', UNIX_TIMESTAMP());
    
    -- Actualizar payment con preference_id
    UPDATE payments 
    SET mercadopago_preference_id = p_preference_id 
    WHERE id = v_payment_id;
END //

-- Release escrow payment
CREATE PROCEDURE ReleaseEscrowPayment(IN p_project_id BIGINT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update escrow status
    UPDATE escrow_accounts 
    SET status = 'released', released_at = NOW()
    WHERE project_id = p_project_id AND status = 'locked';
    
    -- Update payment status
    UPDATE payments 
    SET released_at = NOW()
    WHERE project_id = p_project_id AND status = 'approved';
    
    COMMIT;
END //

DELIMITER ;

-- ================================
-- TRIGGERS
-- ================================

DELIMITER //

-- Auto-calculate project amounts
CREATE TRIGGER calculate_project_amounts 
BEFORE INSERT ON projects
FOR EACH ROW
BEGIN
    SET NEW.platform_fee = NEW.total_amount * 0.05;
    SET NEW.freelancer_amount = NEW.total_amount - NEW.platform_fee;
END //

-- Process MercadoPago webhooks automatically
CREATE TRIGGER process_payment_webhook 
AFTER INSERT ON mercadopago_webhooks
FOR EACH ROW
BEGIN
    DECLARE v_payment_status VARCHAR(50);
    
    -- Extraer status del payload
    SET v_payment_status = JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_payload, '$.data.status'));
    
    -- Actualizar estado del pago
    IF NEW.event_type = 'payment' AND NEW.action = 'payment.updated' THEN
        UPDATE payments 
        SET status = CASE 
            WHEN v_payment_status = 'approved' THEN 'approved'
            WHEN v_payment_status = 'rejected' THEN 'rejected'
            WHEN v_payment_status = 'cancelled' THEN 'cancelled'
            WHEN v_payment_status = 'refunded' THEN 'refunded'
            ELSE 'pending'
        END,
        paid_at = CASE WHEN v_payment_status = 'approved' THEN NOW() ELSE paid_at END
        WHERE mercadopago_payment_id = NEW.resource_id;
    END IF;
END //

DELIMITER ;

SELECT 'Projects and Payments System Created Successfully!' as Status;