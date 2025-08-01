-- =============================================
-- CHAT & MESSAGING SYSTEM SCHEMA
-- LABUREMOS Complete Platform - Phase 6
-- =============================================

-- Chat conversations (private and group)
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('private', 'group', 'project') NOT NULL DEFAULT 'private',
    title VARCHAR(255) DEFAULT NULL, -- For group chats and project chats
    
    -- Project association
    project_id INT DEFAULT NULL,
    
    -- Group settings
    max_participants INT DEFAULT 2, -- 2 for private, unlimited for group
    is_encrypted BOOLEAN DEFAULT FALSE,
    
    -- Status and moderation
    status ENUM('active', 'archived', 'blocked', 'deleted') DEFAULT 'active',
    created_by INT NOT NULL,
    
    -- Metadata
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_preview TEXT DEFAULT NULL,
    
    -- Settings
    settings JSON DEFAULT NULL, -- Auto-delete, notifications, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_last_message_at (last_message_at DESC),
    INDEX idx_created_by (created_by),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversation participants
CREATE TABLE conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Participant role and permissions
    role ENUM('member', 'admin', 'moderator') DEFAULT 'member',
    can_add_participants BOOLEAN DEFAULT FALSE,
    can_remove_participants BOOLEAN DEFAULT FALSE,
    can_edit_conversation BOOLEAN DEFAULT FALSE,
    
    -- Join/leave tracking
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Read tracking
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INT DEFAULT NULL,
    
    -- Notification settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_sound BOOLEAN DEFAULT TRUE,
    
    -- Status
    status ENUM('active', 'left', 'removed', 'blocked') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_conversation_user (conversation_id, user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_last_read_at (last_read_at),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Chat messages
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    
    -- Message content
    message_type ENUM('text', 'image', 'file', 'audio', 'video', 'system', 'deleted') DEFAULT 'text',
    content TEXT DEFAULT NULL,
    
    -- File attachments
    attachment_url VARCHAR(500) DEFAULT NULL,
    attachment_name VARCHAR(255) DEFAULT NULL,
    attachment_size INT DEFAULT NULL, -- in bytes
    attachment_type VARCHAR(50) DEFAULT NULL, -- mime type
    
    -- Message metadata
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Reply/thread functionality
    reply_to_message_id INT DEFAULT NULL,
    thread_count INT DEFAULT 0,
    
    -- Delivery and read tracking
    delivery_status ENUM('sending', 'sent', 'delivered', 'failed') DEFAULT 'sending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Message reactions and interactions
    reactions JSON DEFAULT NULL, -- {emoji: [user_ids]}
    mentions JSON DEFAULT NULL, -- [user_ids] for @mentions
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason VARCHAR(255) DEFAULT NULL,
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    
    -- Auto-deletion
    expires_at TIMESTAMP NULL DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_message_type (message_type),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_reply_to_message_id (reply_to_message_id),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Message read receipts
CREATE TABLE message_read_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY unique_message_user (message_id, user_id),
    INDEX idx_message_id (message_id),
    INDEX idx_user_id (user_id),
    INDEX idx_read_at (read_at),
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- File uploads for chat
CREATE TABLE chat_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    message_id INT DEFAULT NULL, -- NULL if upload failed
    uploader_id INT NOT NULL,
    
    -- File details
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Image/video metadata
    width INT DEFAULT NULL,
    height INT DEFAULT NULL,
    duration INT DEFAULT NULL, -- For audio/video in seconds
    
    -- Thumbnail for images/videos
    thumbnail_path VARCHAR(500) DEFAULT NULL,
    
    -- Status
    upload_status ENUM('uploading', 'completed', 'failed', 'deleted') DEFAULT 'uploading',
    
    -- Security
    virus_scan_status ENUM('pending', 'clean', 'infected', 'error') DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_message_id (message_id),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_upload_status (upload_status),
    INDEX idx_created_at (created_at DESC),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat settings and preferences
CREATE TABLE chat_user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- General settings
    online_status ENUM('online', 'away', 'busy', 'invisible') DEFAULT 'online',
    auto_away_minutes INT DEFAULT 15,
    
    -- Notification settings
    desktop_notifications BOOLEAN DEFAULT TRUE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    notification_sound VARCHAR(50) DEFAULT 'default',
    
    -- Message settings
    enter_to_send BOOLEAN DEFAULT TRUE,
    show_typing_indicators BOOLEAN DEFAULT TRUE,
    show_read_receipts BOOLEAN DEFAULT TRUE,
    
    -- Privacy settings
    who_can_message ENUM('everyone', 'contacts', 'nobody') DEFAULT 'everyone',
    auto_delete_messages_days INT DEFAULT NULL, -- NULL = never
    
    -- Appearance
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    font_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
    compact_mode BOOLEAN DEFAULT FALSE,
    
    -- File sharing
    auto_download_images BOOLEAN DEFAULT TRUE,
    auto_download_files BOOLEAN DEFAULT FALSE,
    max_file_size_mb INT DEFAULT 25,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Typing indicators
CREATE TABLE typing_indicators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Constraints
    UNIQUE KEY unique_conversation_user (conversation_id, user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Message search index (for full-text search)
CREATE TABLE message_search_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL UNIQUE,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content_searchable TEXT NOT NULL, -- Processed content for search
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FULLTEXT INDEX ft_content (content_searchable),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TRIGGERS FOR AUTOMATION
-- =============================================

DELIMITER //

-- Trigger to update conversation last_message_at
CREATE TRIGGER update_conversation_last_message 
AFTER INSERT ON messages 
FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN NEW.message_type = 'text' THEN LEFT(NEW.content, 100)
            WHEN NEW.message_type = 'image' THEN '📷 Imagen'
            WHEN NEW.message_type = 'file' THEN CONCAT('📎 ', NEW.attachment_name)
            WHEN NEW.message_type = 'audio' THEN '🎵 Audio'
            WHEN NEW.message_type = 'video' THEN '🎥 Video'
            WHEN NEW.message_type = 'system' THEN NEW.content
            ELSE 'Mensaje'
        END
    WHERE id = NEW.conversation_id;
END//

-- Trigger to create search index entry for new messages
CREATE TRIGGER create_message_search_index 
AFTER INSERT ON messages 
FOR EACH ROW
BEGIN
    IF NEW.message_type = 'text' AND NEW.content IS NOT NULL THEN
        INSERT INTO message_search_index (message_id, conversation_id, sender_id, content_searchable)
        VALUES (NEW.id, NEW.conversation_id, NEW.sender_id, NEW.content);
    END IF;
END//

-- Trigger to update search index when message is edited
CREATE TRIGGER update_message_search_index 
AFTER UPDATE ON messages 
FOR EACH ROW
BEGIN
    IF NEW.message_type = 'text' AND NEW.content != OLD.content THEN
        UPDATE message_search_index 
        SET content_searchable = NEW.content 
        WHERE message_id = NEW.id;
    END IF;
END//

-- Trigger to create default chat settings for new users
CREATE TRIGGER create_default_chat_settings 
AFTER INSERT ON users 
FOR EACH ROW
BEGIN
    INSERT INTO chat_user_settings (user_id) VALUES (NEW.id);
END//

-- Trigger to clean up expired typing indicators
CREATE TRIGGER cleanup_expired_typing 
BEFORE INSERT ON typing_indicators 
FOR EACH ROW
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END//

DELIMITER ;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to create a new conversation
CREATE PROCEDURE create_conversation(
    IN p_type VARCHAR(10),
    IN p_title VARCHAR(255),
    IN p_creator_id INT,
    IN p_project_id INT,
    IN p_participant_ids JSON
)
BEGIN
    DECLARE v_conversation_id INT;
    DECLARE v_participant_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_participant_id INT;
    
    -- Create conversation
    INSERT INTO conversations (type, title, created_by, project_id, max_participants)
    VALUES (
        p_type, 
        p_title, 
        p_creator_id, 
        p_project_id,
        CASE WHEN p_type = 'private' THEN 2 ELSE 100 END
    );
    
    SET v_conversation_id = LAST_INSERT_ID();
    
    -- Add creator as admin
    INSERT INTO conversation_participants (
        conversation_id, user_id, role, 
        can_add_participants, can_remove_participants, can_edit_conversation
    ) VALUES (
        v_conversation_id, p_creator_id, 'admin', TRUE, TRUE, TRUE
    );
    
    -- Add other participants
    IF p_participant_ids IS NOT NULL THEN
        SET v_participant_count = JSON_LENGTH(p_participant_ids);
        
        WHILE i < v_participant_count DO
            SET v_participant_id = JSON_UNQUOTE(JSON_EXTRACT(p_participant_ids, CONCAT('$[', i, ']')));
            
            INSERT INTO conversation_participants (conversation_id, user_id, role)
            VALUES (v_conversation_id, v_participant_id, 'member');
            
            SET i = i + 1;
        END WHILE;
    END IF;
    
    SELECT v_conversation_id as conversation_id;
    
END//

-- Procedure to send a message
CREATE PROCEDURE send_message(
    IN p_conversation_id INT,
    IN p_sender_id INT,
    IN p_message_type VARCHAR(20),
    IN p_content TEXT,
    IN p_attachment_url VARCHAR(500),
    IN p_attachment_name VARCHAR(255),
    IN p_reply_to_message_id INT
)
BEGIN
    DECLARE v_message_id INT;
    DECLARE v_can_send BOOLEAN DEFAULT FALSE;
    
    -- Check if user can send messages to this conversation
    SELECT COUNT(*) > 0 INTO v_can_send
    FROM conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = p_sender_id 
    AND status = 'active';
    
    IF NOT v_can_send THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User cannot send messages to this conversation';
    END IF;
    
    -- Insert message
    INSERT INTO messages (
        conversation_id, sender_id, message_type, content,
        attachment_url, attachment_name, reply_to_message_id,
        delivery_status, sent_at
    ) VALUES (
        p_conversation_id, p_sender_id, p_message_type, p_content,
        p_attachment_url, p_attachment_name, p_reply_to_message_id,
        'sent', NOW()
    );
    
    SET v_message_id = LAST_INSERT_ID();
    
    -- Update thread count if this is a reply
    IF p_reply_to_message_id IS NOT NULL THEN
        UPDATE messages 
        SET thread_count = thread_count + 1 
        WHERE id = p_reply_to_message_id;
    END IF;
    
    SELECT v_message_id as message_id;
    
END//

-- Procedure to mark messages as read
CREATE PROCEDURE mark_messages_read(
    IN p_conversation_id INT,
    IN p_user_id INT,
    IN p_up_to_message_id INT
)
BEGIN
    -- Insert read receipts for unread messages
    INSERT IGNORE INTO message_read_receipts (message_id, user_id, read_at)
    SELECT m.id, p_user_id, NOW()
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    AND m.id <= p_up_to_message_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
        SELECT 1 FROM message_read_receipts r 
        WHERE r.message_id = m.id AND r.user_id = p_user_id
    );
    
    -- Update participant's last read info
    UPDATE conversation_participants 
    SET last_read_at = NOW(), last_read_message_id = p_up_to_message_id
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
    
END//

-- Procedure to get conversation history
CREATE PROCEDURE get_conversation_history(
    IN p_conversation_id INT,
    IN p_user_id INT,
    IN p_limit INT,
    IN p_before_message_id INT
)
BEGIN
    DECLARE v_can_access BOOLEAN DEFAULT FALSE;
    
    -- Check if user has access to conversation
    SELECT COUNT(*) > 0 INTO v_can_access
    FROM conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = p_user_id 
    AND status = 'active';
    
    IF NOT v_can_access THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied to conversation';
    END IF;
    
    -- Get messages
    SELECT 
        m.*,
        u.first_name,
        u.last_name,
        u.avatar_url,
        rm.content as reply_content,
        ru.first_name as reply_author_name,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT('user_id', r.user_id, 'read_at', r.read_at)
            )
            FROM message_read_receipts r 
            WHERE r.message_id = m.id
        ) as read_by
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
    LEFT JOIN users ru ON rm.sender_id = ru.id
    WHERE m.conversation_id = p_conversation_id
    AND (p_before_message_id IS NULL OR m.id < p_before_message_id)
    AND m.message_type != 'deleted'
    ORDER BY m.created_at DESC
    LIMIT p_limit;
    
END//

-- Procedure to search messages
CREATE PROCEDURE search_messages(
    IN p_user_id INT,
    IN p_query TEXT,
    IN p_conversation_id INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        m.*,
        u.first_name,
        u.last_name,
        c.title as conversation_title,
        c.type as conversation_type,
        MATCH(msi.content_searchable) AGAINST(p_query IN NATURAL LANGUAGE MODE) as relevance
    FROM message_search_index msi
    JOIN messages m ON msi.message_id = m.id
    JOIN users u ON m.sender_id = u.id
    JOIN conversations c ON m.conversation_id = c.id
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = p_user_id 
    AND cp.status = 'active'
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
    AND MATCH(msi.content_searchable) AGAINST(p_query IN NATURAL LANGUAGE MODE)
    ORDER BY relevance DESC
    LIMIT p_limit;
    
END//

-- Procedure to cleanup old data
CREATE PROCEDURE cleanup_chat_data()
BEGIN
    -- Delete expired typing indicators
    DELETE FROM typing_indicators WHERE expires_at < NOW();
    
    -- Delete expired messages (if auto-delete is enabled)
    DELETE m FROM messages m
    WHERE m.expires_at IS NOT NULL AND m.expires_at < NOW();
    
    -- Archive old conversations with no activity (1 year)
    UPDATE conversations 
    SET status = 'archived' 
    WHERE status = 'active' 
    AND last_message_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
END//

DELIMITER ;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user's active conversations
CREATE VIEW user_conversations AS
SELECT 
    c.*,
    cp.last_read_at,
    cp.last_read_message_id,
    cp.notifications_enabled,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.created_at > cp.last_read_at THEN 1 END) as unread_count,
    (
        SELECT GROUP_CONCAT(
            CONCAT(u.first_name, ' ', u.last_name) 
            ORDER BY u.first_name 
            SEPARATOR ', '
        )
        FROM conversation_participants cp2
        JOIN users u ON cp2.user_id = u.id
        WHERE cp2.conversation_id = c.id 
        AND cp2.status = 'active'
        AND cp2.user_id != cp.user_id
        LIMIT 5
    ) as other_participants,
    (
        SELECT COUNT(*)
        FROM conversation_participants cp3
        WHERE cp3.conversation_id = c.id 
        AND cp3.status = 'active'
    ) as participant_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE cp.status = 'active'
AND c.status = 'active'
GROUP BY c.id, cp.user_id, cp.last_read_at, cp.last_read_message_id, cp.notifications_enabled;

-- =============================================
-- INITIAL DATA AND SETTINGS
-- =============================================

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_participants_user_status ON conversation_participants(user_id, status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Add comments to tables
ALTER TABLE conversations COMMENT = 'Chat conversations (private, group, project)';
ALTER TABLE conversation_participants COMMENT = 'Users participating in conversations';
ALTER TABLE messages COMMENT = 'Chat messages with rich content support';
ALTER TABLE message_read_receipts COMMENT = 'Read receipts for messages';
ALTER TABLE chat_files COMMENT = 'File uploads in chat conversations';
ALTER TABLE chat_user_settings COMMENT = 'User chat preferences and settings';
ALTER TABLE typing_indicators COMMENT = 'Real-time typing indicators';
ALTER TABLE message_search_index COMMENT = 'Full-text search index for messages';