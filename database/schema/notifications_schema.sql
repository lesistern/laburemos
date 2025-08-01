-- =============================================
-- NOTIFICATIONS & REAL-TIME SYSTEM SCHEMA
-- LABUREMOS Complete Platform - Phase 6
-- =============================================

-- Notification types and templates
CREATE TABLE notification_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    category ENUM('project', 'payment', 'review', 'message', 'system', 'marketing') NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    
    -- Template configuration
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    action_url_template VARCHAR(500) DEFAULT NULL,
    
    -- Delivery settings
    enabled BOOLEAN DEFAULT TRUE,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    delivery_channels JSON DEFAULT NULL, -- ['email', 'push', 'sms', 'websocket']
    
    -- Timing and frequency
    delay_seconds INT DEFAULT 0,
    batch_with_similar BOOLEAN DEFAULT FALSE,
    max_frequency_minutes INT DEFAULT NULL, -- Rate limiting
    
    -- UI display settings
    icon VARCHAR(50) DEFAULT NULL,
    color VARCHAR(7) DEFAULT NULL, -- Hex color
    sound VARCHAR(50) DEFAULT NULL,
    requires_action BOOLEAN DEFAULT FALSE,
    
    -- Auto-expiration
    auto_expire_hours INT DEFAULT NULL,
    auto_read_hours INT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type_code (type_code),
    INDEX idx_category (category),
    INDEX idx_enabled (enabled)
);

-- User notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type_id INT NOT NULL,
    
    -- Message content (populated from templates)
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    action_url VARCHAR(500) DEFAULT NULL,
    
    -- Related entities
    related_entity_type VARCHAR(50) DEFAULT NULL, -- 'project', 'payment', 'review', etc.
    related_entity_id INT DEFAULT NULL,
    
    -- Delivery status
    status ENUM('pending', 'sent', 'delivered', 'failed', 'expired') DEFAULT 'pending',
    delivery_channels JSON DEFAULT NULL, -- Actual channels used
    
    -- User interaction
    read_at TIMESTAMP NULL DEFAULT NULL,
    clicked_at TIMESTAMP NULL DEFAULT NULL,
    dismissed_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Metadata
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    group_key VARCHAR(100) DEFAULT NULL, -- For grouping similar notifications
    metadata JSON DEFAULT NULL,
    
    -- Delivery tracking
    email_sent_at TIMESTAMP NULL DEFAULT NULL,
    push_sent_at TIMESTAMP NULL DEFAULT NULL,
    websocket_sent_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Expiration
    expires_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Timestamps
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_read (user_id, read_at),
    INDEX idx_related_entity (related_entity_type, related_entity_id),
    INDEX idx_group_key (group_key),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at DESC),
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id) ON DELETE CASCADE
);

-- User notification preferences
CREATE TABLE notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type_id INT NOT NULL,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    websocket_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT NULL, -- e.g., '22:00'
    quiet_hours_end TIME DEFAULT NULL,   -- e.g., '08:00'
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    
    -- Frequency preferences
    frequency ENUM('immediately', 'hourly', 'daily', 'weekly', 'never') DEFAULT 'immediately',
    digest_time TIME DEFAULT '09:00', -- For digest notifications
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_user_type (user_id, notification_type_id),
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id) ON DELETE CASCADE
);

-- Real-time connections (WebSocket sessions)
CREATE TABLE realtime_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    connection_id VARCHAR(255) NOT NULL UNIQUE,
    socket_id VARCHAR(255) DEFAULT NULL,
    
    -- Connection details
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    
    -- Session info
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status ENUM('connected', 'disconnected', 'timeout') DEFAULT 'connected',
    disconnect_reason VARCHAR(100) DEFAULT NULL,
    disconnected_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Metadata
    metadata JSON DEFAULT NULL,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_connection_id (connection_id),
    INDEX idx_last_activity (last_activity_at),
    INDEX idx_connected_at (connected_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Push notification tokens (for mobile/web push)
CREATE TABLE push_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    platform ENUM('web', 'android', 'ios') NOT NULL,
    
    -- Token details
    endpoint VARCHAR(500) DEFAULT NULL, -- For web push
    p256dh_key TEXT DEFAULT NULL,       -- For web push
    auth_key TEXT DEFAULT NULL,         -- For web push
    
    -- App details
    app_version VARCHAR(20) DEFAULT NULL,
    device_model VARCHAR(100) DEFAULT NULL,
    os_version VARCHAR(50) DEFAULT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Registration
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_user_token (user_id, token),
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_platform (platform),
    INDEX idx_last_used (last_used_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification delivery log
CREATE TABLE notification_delivery_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    channel ENUM('email', 'push', 'websocket', 'sms') NOT NULL,
    
    -- Delivery details
    status ENUM('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced') NOT NULL,
    provider VARCHAR(50) DEFAULT NULL, -- e.g., 'sendgrid', 'firebase', 'websocket'
    provider_message_id VARCHAR(255) DEFAULT NULL,
    
    -- Attempt tracking
    attempt_number INT DEFAULT 1,
    max_attempts INT DEFAULT 3,
    retry_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Response details
    response_code VARCHAR(10) DEFAULT NULL,
    response_message TEXT DEFAULT NULL,
    error_details JSON DEFAULT NULL,
    
    -- Timing
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    failed_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Metrics
    processing_time_ms INT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_notification_channel (notification_id, channel),
    INDEX idx_status (status),
    INDEX idx_retry_at (retry_at),
    INDEX idx_sent_at (sent_at),
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Real-time events (for WebSocket broadcasting)
CREATE TABLE realtime_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    target_user_id INT DEFAULT NULL,
    target_room VARCHAR(100) DEFAULT NULL, -- For room-based events
    
    -- Event data
    event_data JSON NOT NULL,
    
    -- Broadcasting details
    broadcast_status ENUM('pending', 'broadcasting', 'completed', 'failed') DEFAULT 'pending',
    target_connections JSON DEFAULT NULL, -- Connection IDs to broadcast to
    
    -- Delivery tracking
    total_targets INT DEFAULT 0,
    successful_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    
    -- Timing
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    broadcast_started_at TIMESTAMP NULL DEFAULT NULL,
    broadcast_completed_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Expiration
    expires_at TIMESTAMP NULL DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_target_user (target_user_id),
    INDEX idx_target_room (target_room),
    INDEX idx_event_type (event_type),
    INDEX idx_broadcast_status (broadcast_status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification digest queue (for batched notifications)
CREATE TABLE notification_digests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    digest_type ENUM('hourly', 'daily', 'weekly') NOT NULL,
    
    -- Content
    notification_count INT DEFAULT 0,
    digest_content JSON DEFAULT NULL, -- Grouped notifications
    
    -- Delivery
    status ENUM('pending', 'generated', 'sent', 'failed') DEFAULT 'pending',
    generated_at TIMESTAMP NULL DEFAULT NULL,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_type (user_id, digest_type),
    INDEX idx_status (status),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_period (period_start, period_end),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TRIGGERS FOR AUTOMATION
-- =============================================

DELIMITER //

-- Trigger to create default notification preferences for new users
CREATE TRIGGER create_default_notification_preferences 
AFTER INSERT ON users 
FOR EACH ROW
BEGIN
    INSERT INTO notification_preferences (user_id, notification_type_id)
    SELECT NEW.id, id FROM notification_types WHERE enabled = TRUE;
END//

-- Trigger to automatically expire old notifications
CREATE TRIGGER expire_old_notifications 
AFTER UPDATE ON notifications 
FOR EACH ROW
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.status != 'expired' THEN
        UPDATE notifications 
        SET status = 'expired' 
        WHERE id = NEW.id;
    END IF;
END//

-- Trigger to update connection activity
CREATE TRIGGER update_connection_activity 
BEFORE UPDATE ON realtime_connections 
FOR EACH ROW
BEGIN
    IF NEW.last_ping_at > OLD.last_ping_at THEN
        SET NEW.last_activity_at = NEW.last_ping_at;
    END IF;
END//

-- Trigger to create real-time event for new notifications
CREATE TRIGGER create_realtime_event_for_notification 
AFTER INSERT ON notifications 
FOR EACH ROW
BEGIN
    INSERT INTO realtime_events (event_type, target_user_id, event_data)
    VALUES (
        'notification_created',
        NEW.user_id,
        JSON_OBJECT(
            'notification_id', NEW.id,
            'title', NEW.title,
            'body', NEW.body,
            'priority', NEW.priority,
            'action_url', NEW.action_url
        )
    );
END//

DELIMITER ;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to create notification from template
CREATE PROCEDURE create_notification(
    IN p_user_id INT,
    IN p_type_code VARCHAR(50),
    IN p_variables JSON,
    IN p_related_entity_type VARCHAR(50),
    IN p_related_entity_id INT
)
BEGIN
    DECLARE v_type_id INT;
    DECLARE v_title_template VARCHAR(255);
    DECLARE v_body_template TEXT;
    DECLARE v_action_url_template VARCHAR(500);
    DECLARE v_priority VARCHAR(10);
    DECLARE v_auto_expire_hours INT;
    DECLARE v_final_title VARCHAR(255);
    DECLARE v_final_body TEXT;
    DECLARE v_final_action_url VARCHAR(500);
    DECLARE v_expires_at TIMESTAMP DEFAULT NULL;
    
    -- Get notification type details
    SELECT id, title_template, body_template, action_url_template, priority, auto_expire_hours
    INTO v_type_id, v_title_template, v_body_template, v_action_url_template, v_priority, v_auto_expire_hours
    FROM notification_types 
    WHERE type_code = p_type_code AND enabled = TRUE;
    
    IF v_type_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Notification type not found or disabled';
    END IF;
    
    -- Process templates (simplified - in real implementation would use template engine)
    SET v_final_title = v_title_template;
    SET v_final_body = v_body_template;
    SET v_final_action_url = v_action_url_template;
    
    -- Calculate expiration
    IF v_auto_expire_hours IS NOT NULL THEN
        SET v_expires_at = DATE_ADD(NOW(), INTERVAL v_auto_expire_hours HOUR);
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        user_id, notification_type_id, title, body, action_url,
        related_entity_type, related_entity_id, priority, expires_at, metadata
    ) VALUES (
        p_user_id, v_type_id, v_final_title, v_final_body, v_final_action_url,
        p_related_entity_type, p_related_entity_id, v_priority, v_expires_at, p_variables
    );
    
END//

-- Procedure to mark notifications as read
CREATE PROCEDURE mark_notifications_read(
    IN p_user_id INT,
    IN p_notification_ids JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE notification_count INT;
    DECLARE current_id INT;
    
    SET notification_count = JSON_LENGTH(p_notification_ids);
    
    WHILE i < notification_count DO
        SET current_id = JSON_UNQUOTE(JSON_EXTRACT(p_notification_ids, CONCAT('$[', i, ']')));
        
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE id = current_id AND user_id = p_user_id AND read_at IS NULL;
        
        SET i = i + 1;
    END WHILE;
    
END//

-- Procedure to clean up old connections
CREATE PROCEDURE cleanup_old_connections()
BEGIN
    -- Mark connections as disconnected if no ping in last 5 minutes
    UPDATE realtime_connections 
    SET status = 'timeout', 
        disconnect_reason = 'No ping received',
        disconnected_at = NOW()
    WHERE status = 'connected' 
    AND last_ping_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
    
    -- Delete old disconnected connections (older than 1 day)
    DELETE FROM realtime_connections 
    WHERE status IN ('disconnected', 'timeout') 
    AND disconnected_at < DATE_SUB(NOW(), INTERVAL 1 DAY);
    
END//

-- Procedure to generate notification digest
CREATE PROCEDURE generate_notification_digest(
    IN p_user_id INT,
    IN p_digest_type VARCHAR(10)
)
BEGIN
    DECLARE v_period_start TIMESTAMP;
    DECLARE v_period_end TIMESTAMP;
    DECLARE v_notification_count INT;
    DECLARE v_digest_content JSON;
    
    -- Calculate period
    SET v_period_end = NOW();
    
    CASE p_digest_type
        WHEN 'hourly' THEN SET v_period_start = DATE_SUB(v_period_end, INTERVAL 1 HOUR);
        WHEN 'daily' THEN SET v_period_start = DATE_SUB(v_period_end, INTERVAL 1 DAY);
        WHEN 'weekly' THEN SET v_period_start = DATE_SUB(v_period_end, INTERVAL 1 WEEK);
    END CASE;
    
    -- Get unread notifications in period
    SELECT COUNT(*), 
           JSON_ARRAYAGG(
               JSON_OBJECT(
                   'id', id,
                   'title', title,
                   'body', body,
                   'action_url', action_url,
                   'priority', priority,
                   'created_at', created_at
               )
           )
    INTO v_notification_count, v_digest_content
    FROM notifications 
    WHERE user_id = p_user_id 
    AND created_at BETWEEN v_period_start AND v_period_end
    AND read_at IS NULL;
    
    -- Create digest if there are notifications
    IF v_notification_count > 0 THEN
        INSERT INTO notification_digests (
            user_id, digest_type, notification_count, digest_content,
            scheduled_for, period_start, period_end, status
        ) VALUES (
            p_user_id, p_digest_type, v_notification_count, v_digest_content,
            NOW(), v_period_start, v_period_end, 'generated'
        );
    END IF;
    
END//

DELIMITER ;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user notification summary
CREATE VIEW user_notification_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    COUNT(n.id) as total_notifications,
    COUNT(CASE WHEN n.read_at IS NULL THEN 1 END) as unread_count,
    COUNT(CASE WHEN n.priority = 'urgent' AND n.read_at IS NULL THEN 1 END) as urgent_unread,
    MAX(n.created_at) as last_notification_at
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id AND n.status = 'sent'
GROUP BY u.id, u.first_name, u.last_name;

-- View for active real-time connections
CREATE VIEW active_connections AS
SELECT 
    rc.*,
    u.first_name,
    u.last_name,
    u.email,
    TIMESTAMPDIFF(MINUTE, rc.last_activity_at, NOW()) as minutes_idle
FROM realtime_connections rc
JOIN users u ON rc.user_id = u.id
WHERE rc.status = 'connected'
AND rc.last_ping_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert default notification types
INSERT INTO notification_types (type_code, category, name, title_template, body_template, action_url_template, delivery_channels, priority, icon, color) VALUES
-- Project notifications
('project_created', 'project', 'Proyecto Creado', 'Nuevo proyecto: {{project_title}}', 'Se ha creado un nuevo proyecto que coincide con tus habilidades', '/projects/{{project_id}}', '["push", "websocket"]', 'normal', 'fas fa-project-diagram', '#0078D4'),
('project_proposal_received', 'project', 'Propuesta Recibida', 'Nueva propuesta para: {{project_title}}', '{{freelancer_name}} ha enviado una propuesta para tu proyecto', '/projects/{{project_id}}/proposals', '["email", "push", "websocket"]', 'high', 'fas fa-file-contract', '#00a650'),
('project_proposal_accepted', 'project', 'Propuesta Aceptada', '¡Tu propuesta fue aceptada!', 'Tu propuesta para "{{project_title}}" ha sido aceptada', '/projects/{{project_id}}', '["email", "push", "websocket"]', 'high', 'fas fa-check-circle', '#00a650'),
('project_completed', 'project', 'Proyecto Completado', 'Proyecto completado: {{project_title}}', 'El proyecto ha sido marcado como completado', '/projects/{{project_id}}', '["email", "push", "websocket"]', 'normal', 'fas fa-flag-checkered', '#00a650'),
('project_milestone_completed', 'project', 'Milestone Completado', 'Milestone completado en {{project_title}}', 'Se ha completado el milestone "{{milestone_title}}"', '/projects/{{project_id}}', '["push", "websocket"]', 'normal', 'fas fa-trophy', '#FFD700'),

-- Payment notifications  
('payment_received', 'payment', 'Pago Recibido', 'Pago recibido: {{amount}}', 'Has recibido un pago de {{amount}} por "{{project_title}}"', '/payments', '["email", "push", "websocket"]', 'high', 'fas fa-money-bill-wave', '#00a650'),
('payment_sent', 'payment', 'Pago Enviado', 'Pago enviado: {{amount}}', 'Tu pago de {{amount}} para "{{project_title}}" ha sido procesado', '/payments', '["email", "push", "websocket"]', 'normal', 'fas fa-credit-card', '#0078D4'),
('escrow_released', 'payment', 'Fondos Liberados', 'Fondos liberados: {{amount}}', 'Los fondos en escrow de {{amount}} han sido liberados', '/payments', '["email", "push", "websocket"]', 'high', 'fas fa-unlock', '#00a650'),
('withdrawal_processed', 'payment', 'Retiro Procesado', 'Retiro procesado: {{amount}}', 'Tu solicitud de retiro de {{amount}} ha sido procesada', '/payments', '["email", "push", "websocket"]', 'normal', 'fas fa-bank', '#0078D4'),

-- Review notifications
('review_received', 'review', 'Nueva Review', 'Recibiste una nueva review', '{{reviewer_name}} dejó una review de {{rating}} estrellas', '/reviews', '["email", "push", "websocket"]', 'normal', 'fas fa-star', '#FFD700'),
('review_response_received', 'review', 'Respuesta a Review', 'Respuesta a tu review', '{{reviewee_name}} respondió a tu review', '/reviews', '["push", "websocket"]', 'normal', 'fas fa-reply', '#0078D4'),

-- Message notifications
('message_received', 'message', 'Nuevo Mensaje', 'Mensaje de {{sender_name}}', '{{sender_name}}: {{message_preview}}', '/messages/{{conversation_id}}', '["push", "websocket"]', 'normal', 'fas fa-envelope', '#0078D4'),

-- System notifications
('account_verified', 'system', 'Cuenta Verificada', '¡Cuenta verificada exitosamente!', 'Tu cuenta ha sido verificada. Ya podés usar todas las funciones de LABUREMOS', '/profile', '["email", "push", "websocket"]', 'normal', 'fas fa-check-circle', '#00a650'),
('security_alert', 'system', 'Alerta de Seguridad', 'Actividad inusual detectada', 'Se detectó un inicio de sesión desde una ubicación nueva', '/settings/security', '["email", "push", "websocket"]', 'urgent', 'fas fa-shield-alt', '#dc3545'),
('maintenance_scheduled', 'system', 'Mantenimiento Programado', 'Mantenimiento programado', 'LABUREMOS estará en mantenimiento el {{date}} de {{start_time}} a {{end_time}}', '/', '["email", "push", "websocket"]', 'low', 'fas fa-tools', '#f57c00');

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX idx_realtime_events_pending ON realtime_events(broadcast_status, scheduled_at);

-- Add comments to tables
ALTER TABLE notification_types COMMENT = 'Notification type definitions and templates';
ALTER TABLE notifications COMMENT = 'User notifications with delivery tracking';
ALTER TABLE notification_preferences COMMENT = 'User notification preferences and settings';
ALTER TABLE realtime_connections COMMENT = 'Active WebSocket connections for real-time features';
ALTER TABLE push_tokens COMMENT = 'Push notification tokens for mobile and web';
ALTER TABLE notification_delivery_log COMMENT = 'Delivery tracking and retry logic';
ALTER TABLE realtime_events COMMENT = 'Real-time events for WebSocket broadcasting';
ALTER TABLE notification_digests COMMENT = 'Batched notification digests';