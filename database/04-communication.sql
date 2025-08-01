-- ================================
-- Communication System
-- Chat, Notifications, Reviews
-- ================================

USE laburemos_db;

-- Conversations between users
CREATE TABLE conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Participantes
    participant_1 BIGINT NOT NULL,
    participant_2 BIGINT NOT NULL,
    project_id BIGINT NULL COMMENT 'Conversación relacionada a proyecto',
    
    -- Estado
    status ENUM('active', 'archived', 'blocked') DEFAULT 'active',
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadatos
    unread_count_p1 INT DEFAULT 0,
    unread_count_p2 INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (participant_1) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (participant_2) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_participants (participant_1, participant_2),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB;

-- Messages within conversations
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    
    -- Contenido
    message_type ENUM('text', 'file', 'image', 'system') DEFAULT 'text',
    content TEXT NOT NULL,
    attachments JSON,
    
    -- Estado
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_conversation (conversation_id, created_at),
    INDEX idx_unread (conversation_id, is_read)
) ENGINE=InnoDB;

-- Notifications system
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Contenido
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Referencias
    related_id BIGINT NULL COMMENT 'ID del objeto relacionado',
    related_type VARCHAR(50) NULL COMMENT 'Tipo: project, payment, message, etc',
    
    -- Estado
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    -- Metadatos
    data JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Reviews between users
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Participantes
    project_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewed_id BIGINT NOT NULL,
    reviewer_type ENUM('client', 'freelancer') NOT NULL,
    
    -- Contenido
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Calificaciones Específicas
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INT CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    
    -- Estado
    status ENUM('active', 'hidden', 'reported') DEFAULT 'active',
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Response
    response TEXT NULL,
    responded_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_reviewed (reviewed_id),
    INDEX idx_rating (rating),
    INDEX idx_project (project_id),
    UNIQUE KEY unique_project_reviewer (project_id, reviewer_id, reviewer_type)
) ENGINE=InnoDB;

-- Mi Red connections for long-term relationships
CREATE TABLE network_connections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    client_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    
    -- Estado de la Conexión
    status ENUM('active', 'paused', 'terminated') DEFAULT 'active',
    connection_type ENUM('preferred', 'exclusive', 'regular') DEFAULT 'regular',
    
    -- Términos Especiales
    special_rate DECIMAL(10,2) NULL COMMENT 'Tarifa especial acordada',
    priority_level INT DEFAULT 1 COMMENT '1-5, mayor número = mayor prioridad',
    
    -- Métricas
    projects_completed INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Fechas
    established_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_project_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_freelancer (freelancer_id),
    UNIQUE KEY unique_connection (client_id, freelancer_id)
) ENGINE=InnoDB;

-- Video calls log
CREATE TABLE video_calls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    conversation_id BIGINT NOT NULL,
    initiator_id BIGINT NOT NULL,
    
    -- Call Details
    room_id VARCHAR(255) UNIQUE NOT NULL,
    duration_seconds INT DEFAULT 0,
    
    -- Status
    status ENUM('scheduled', 'active', 'ended', 'failed') DEFAULT 'scheduled',
    
    -- Timestamps
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    
    -- Participants
    participants JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_conversation (conversation_id),
    INDEX idx_status (status),
    INDEX idx_room_id (room_id)
) ENGINE=InnoDB;

-- ================================
-- STORED PROCEDURES
-- ================================

DELIMITER //

-- Create or get conversation between two users
CREATE PROCEDURE GetOrCreateConversation(
    IN p_user1_id BIGINT,
    IN p_user2_id BIGINT,
    IN p_project_id BIGINT,
    OUT p_conversation_id BIGINT
)
BEGIN
    DECLARE v_conversation_exists INT DEFAULT 0;
    
    -- Normalize user order (smaller ID first)
    IF p_user1_id > p_user2_id THEN
        SET @temp = p_user1_id;
        SET p_user1_id = p_user2_id;
        SET p_user2_id = @temp;
    END IF;
    
    -- Check if conversation exists
    SELECT id INTO p_conversation_id
    FROM conversations 
    WHERE participant_1 = p_user1_id 
    AND participant_2 = p_user2_id
    AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    LIMIT 1;
    
    -- Create if doesn't exist
    IF p_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1, participant_2, project_id)
        VALUES (p_user1_id, p_user2_id, p_project_id);
        
        SET p_conversation_id = LAST_INSERT_ID();
    END IF;
END //

-- Send notification to user
CREATE PROCEDURE SendNotification(
    IN p_user_id BIGINT,
    IN p_type VARCHAR(50),
    IN p_title VARCHAR(255),
    IN p_message TEXT,
    IN p_related_id BIGINT,
    IN p_related_type VARCHAR(50),
    IN p_data JSON
)
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, 
        related_id, related_type, data
    ) VALUES (
        p_user_id, p_type, p_title, p_message,
        p_related_id, p_related_type, p_data
    );
END //

-- Mark messages as read
CREATE PROCEDURE MarkMessagesAsRead(
    IN p_conversation_id BIGINT,
    IN p_user_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Mark messages as read
    UPDATE messages 
    SET is_read = TRUE, read_at = NOW()
    WHERE conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND is_read = FALSE;
    
    -- Update unread counts
    UPDATE conversations 
    SET unread_count_p1 = CASE WHEN participant_1 = p_user_id THEN 0 ELSE unread_count_p1 END,
        unread_count_p2 = CASE WHEN participant_2 = p_user_id THEN 0 ELSE unread_count_p2 END
    WHERE id = p_conversation_id;
    
    COMMIT;
END //

DELIMITER ;

-- ================================
-- TRIGGERS
-- ================================

DELIMITER //

-- Update conversation when new message is sent
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    DECLARE v_other_user BIGINT;
    
    -- Update last message timestamp
    UPDATE conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    -- Update unread counts
    UPDATE conversations 
    SET unread_count_p1 = CASE 
            WHEN participant_1 != NEW.sender_id THEN unread_count_p1 + 1 
            ELSE unread_count_p1 
        END,
        unread_count_p2 = CASE 
            WHEN participant_2 != NEW.sender_id THEN unread_count_p2 + 1 
            ELSE unread_count_p2 
        END
    WHERE id = NEW.conversation_id;
    
    -- Send notification to recipient
    SELECT CASE 
        WHEN participant_1 = NEW.sender_id THEN participant_2 
        ELSE participant_1 
    END INTO v_other_user
    FROM conversations 
    WHERE id = NEW.conversation_id;
    
    CALL SendNotification(
        v_other_user,
        'new_message',
        'Nuevo mensaje',
        CONCAT('Tienes un nuevo mensaje de ', (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = NEW.sender_id)),
        NEW.conversation_id,
        'conversation',
        JSON_OBJECT('sender_id', NEW.sender_id, 'message_id', NEW.id)
    );
END //

-- Auto-update user reputation when review is created
CREATE TRIGGER update_reputation_on_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL CalculateUserReputation(NEW.reviewed_id);
END //

DELIMITER ;

-- ================================
-- INITIAL DATA
-- ================================

-- Insert notification types
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
(1, 'system', 'Bienvenido a LABUREMOS', 'Tu cuenta ha sido creada exitosamente', TRUE);

SELECT 'Communication System Created Successfully!' as Status;