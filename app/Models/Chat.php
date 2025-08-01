<?php
/**
 * Chat Model
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles chat conversations, messages, file uploads,
 * real-time communication, and search functionality
 */

require_once __DIR__ . '/BaseModel.php';

class Chat extends BaseModel {
    protected static $table = 'conversations';
    
    // ===== Conversation Management =====
    
    public static function createConversation($type, $creatorId, $participants = [], $options = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                CALL create_conversation(?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $type,
                $options['title'] ?? null,
                $creatorId,
                $options['project_id'] ?? null,
                !empty($participants) ? json_encode($participants) : null
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['conversation_id'];
            
        } catch (Exception $e) {
            error_log("Error creating conversation: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getUserConversations($userId, $options = []) {
        $pdo = Database::getInstance()->getConnection();
        
        $limit = $options['limit'] ?? 50;
        $offset = $options['offset'] ?? 0;
        $type = $options['type'] ?? null;
        $hasUnread = $options['has_unread'] ?? null;
        
        $whereConditions = ['cp.user_id = ?', 'cp.status = "active"', 'c.status = "active"'];
        $params = [$userId];
        
        if ($type) {
            $whereConditions[] = 'c.type = ?';
            $params[] = $type;
        }
        
        if ($hasUnread !== null) {
            if ($hasUnread) {
                $whereConditions[] = 'unread_count > 0';
            } else {
                $whereConditions[] = 'unread_count = 0';
            }
        }
        
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("
            SELECT *,
                DATE_FORMAT(last_message_at, '%d/%m/%Y %H:%i') as formatted_last_message
            FROM user_conversations 
            {$whereClause}
            ORDER BY last_message_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function getConversationDetails($conversationId, $userId) {
        $pdo = Database::getInstance()->getConnection();
        
        // Check access first
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM conversation_participants 
            WHERE conversation_id = ? AND user_id = ? AND status = 'active'
        ");
        $stmt->execute([$conversationId, $userId]);
        
        if (!$stmt->fetchColumn()) {
            return null; // No access
        }
        
        // Get conversation details
        $stmt = $pdo->prepare("
            SELECT 
                c.*,
                cp.role,
                cp.can_add_participants,
                cp.can_remove_participants,
                cp.can_edit_conversation,
                cp.last_read_at,
                cp.last_read_message_id,
                cp.notifications_enabled,
                DATE_FORMAT(c.created_at, '%d/%m/%Y %H:%i') as formatted_created_at,
                (
                    SELECT COUNT(*) 
                    FROM conversation_participants cp2 
                    WHERE cp2.conversation_id = c.id AND cp2.status = 'active'
                ) as participant_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE c.id = ? AND cp.user_id = ?
        ");
        
        $stmt->execute([$conversationId, $userId]);
        $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($conversation) {
            // Get participants
            $conversation['participants'] = static::getConversationParticipants($conversationId);
        }
        
        return $conversation;
    }
    
    public static function getConversationParticipants($conversationId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT 
                cp.*,
                u.first_name,
                u.last_name,
                u.email,
                u.avatar_url,
                u.user_type,
                DATE_FORMAT(cp.joined_at, '%d/%m/%Y %H:%i') as formatted_joined_at,
                CASE 
                    WHEN cp.left_at IS NOT NULL THEN 'left'
                    ELSE cp.status
                END as display_status
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ?
            ORDER BY cp.role DESC, cp.joined_at ASC
        ");
        
        $stmt->execute([$conversationId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ===== Message Management =====
    
    public static function sendMessage($conversationId, $senderId, $messageData) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                CALL send_message(?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $conversationId,
                $senderId,
                $messageData['message_type'] ?? 'text',
                $messageData['content'] ?? null,
                $messageData['attachment_url'] ?? null,
                $messageData['attachment_name'] ?? null,
                $messageData['reply_to_message_id'] ?? null
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && $result['message_id']) {
                // Get the full message data
                return static::getMessageById($result['message_id']);
            }
            
            return false;
            
        } catch (Exception $e) {
            error_log("Error sending message: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getMessageById($messageId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT 
                m.*,
                u.first_name,
                u.last_name,
                u.avatar_url,
                rm.content as reply_content,
                ru.first_name as reply_author_name,
                DATE_FORMAT(m.created_at, '%d/%m/%Y %H:%i') as formatted_created_at,
                DATE_FORMAT(m.created_at, '%H:%i') as formatted_time
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
            LEFT JOIN users ru ON rm.sender_id = ru.id
            WHERE m.id = ?
        ");
        
        $stmt->execute([$messageId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public static function getConversationMessages($conversationId, $userId, $options = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                CALL get_conversation_history(?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $conversationId,
                $userId,
                $options['limit'] ?? 50,
                $options['before_message_id'] ?? null
            ]);
            
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process messages for display
            foreach ($messages as &$message) {
                $message['formatted_created_at'] = date('d/m/Y H:i', strtotime($message['created_at']));
                $message['formatted_time'] = date('H:i', strtotime($message['created_at']));
                $message['reactions'] = $message['reactions'] ? json_decode($message['reactions'], true) : [];
                $message['mentions'] = $message['mentions'] ? json_decode($message['mentions'], true) : [];
                $message['read_by'] = $message['read_by'] ? json_decode($message['read_by'], true) : [];
                
                // Check if message is from today
                $message['is_today'] = date('Y-m-d') === date('Y-m-d', strtotime($message['created_at']));
            }
            
            return array_reverse($messages); // Return in chronological order
            
        } catch (Exception $e) {
            error_log("Error getting conversation messages: " . $e->getMessage());
            return [];
        }
    }
    
    public static function markMessagesAsRead($conversationId, $userId, $upToMessageId = null) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            if ($upToMessageId === null) {
                // Get the latest message ID
                $stmt = $pdo->prepare("
                    SELECT MAX(id) FROM messages 
                    WHERE conversation_id = ?
                ");
                $stmt->execute([$conversationId]);
                $upToMessageId = $stmt->fetchColumn();
            }
            
            if ($upToMessageId) {
                $stmt = $pdo->prepare("
                    CALL mark_messages_read(?, ?, ?)
                ");
                $stmt->execute([$conversationId, $userId, $upToMessageId]);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error marking messages as read: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Message Reactions =====
    
    public static function addReaction($messageId, $userId, $emoji) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT reactions FROM messages WHERE id = ?
            ");
            $stmt->execute([$messageId]);
            $currentReactions = $stmt->fetchColumn();
            
            $reactions = $currentReactions ? json_decode($currentReactions, true) : [];
            
            // Add user to emoji reactions
            if (!isset($reactions[$emoji])) {
                $reactions[$emoji] = [];
            }
            
            if (!in_array($userId, $reactions[$emoji])) {
                $reactions[$emoji][] = $userId;
            }
            
            $stmt = $pdo->prepare("
                UPDATE messages SET reactions = ? WHERE id = ?
            ");
            $stmt->execute([json_encode($reactions), $messageId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error adding reaction: " . $e->getMessage());
            return false;
        }
    }
    
    public static function removeReaction($messageId, $userId, $emoji) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT reactions FROM messages WHERE id = ?
            ");
            $stmt->execute([$messageId]);
            $currentReactions = $stmt->fetchColumn();
            
            if (!$currentReactions) return true;
            
            $reactions = json_decode($currentReactions, true);
            
            if (isset($reactions[$emoji])) {
                $reactions[$emoji] = array_values(array_filter($reactions[$emoji], function($id) use ($userId) {
                    return $id != $userId;
                }));
                
                if (empty($reactions[$emoji])) {
                    unset($reactions[$emoji]);
                }
            }
            
            $stmt = $pdo->prepare("
                UPDATE messages SET reactions = ? WHERE id = ?
            ");
            $stmt->execute([json_encode($reactions), $messageId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error removing reaction: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Typing Indicators =====
    
    public static function setTyping($conversationId, $userId, $isTyping = true) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            if ($isTyping) {
                $stmt = $pdo->prepare("
                    INSERT INTO typing_indicators (conversation_id, user_id, expires_at)
                    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 SECOND))
                    ON DUPLICATE KEY UPDATE expires_at = DATE_ADD(NOW(), INTERVAL 10 SECOND)
                ");
                $stmt->execute([$conversationId, $userId]);
            } else {
                $stmt = $pdo->prepare("
                    DELETE FROM typing_indicators 
                    WHERE conversation_id = ? AND user_id = ?
                ");
                $stmt->execute([$conversationId, $userId]);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error setting typing indicator: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getTypingUsers($conversationId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT 
                ti.user_id,
                u.first_name,
                u.last_name
            FROM typing_indicators ti
            JOIN users u ON ti.user_id = u.id
            WHERE ti.conversation_id = ? AND ti.expires_at > NOW()
        ");
        
        $stmt->execute([$conversationId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ===== File Management =====
    
    public static function uploadFile($conversationId, $uploaderId, $fileData) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO chat_files 
                (conversation_id, uploader_id, original_name, stored_name, 
                 file_path, file_size, mime_type, width, height, duration, thumbnail_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $conversationId,
                $uploaderId,
                $fileData['original_name'],
                $fileData['stored_name'],
                $fileData['file_path'],
                $fileData['file_size'],
                $fileData['mime_type'],
                $fileData['width'] ?? null,
                $fileData['height'] ?? null,
                $fileData['duration'] ?? null,
                $fileData['thumbnail_path'] ?? null
            ]);
            
            $fileId = $pdo->lastInsertId();
            
            // Update upload status to completed
            $stmt = $pdo->prepare("
                UPDATE chat_files SET upload_status = 'completed' WHERE id = ?
            ");
            $stmt->execute([$fileId]);
            
            return $fileId;
            
        } catch (Exception $e) {
            error_log("Error uploading file: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getFileById($fileId, $userId) {
        $pdo = Database::getInstance()->getConnection();
        
        // Check if user has access to the conversation
        $stmt = $pdo->prepare("
            SELECT cf.*, c.id as conversation_id
            FROM chat_files cf
            JOIN conversations c ON cf.conversation_id = c.id
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cf.id = ? AND cp.user_id = ? AND cp.status = 'active'
        ");
        
        $stmt->execute([$fileId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // ===== Search Functionality =====
    
    public static function searchMessages($userId, $query, $options = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                CALL search_messages(?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $query,
                $options['conversation_id'] ?? null,
                $options['limit'] ?? 20
            ]);
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format results
            foreach ($results as &$result) {
                $result['formatted_created_at'] = date('d/m/Y H:i', strtotime($result['created_at']));
                $result['relevance'] = round($result['relevance'], 2);
                
                // Highlight matching text (simplified)
                if (strlen($result['content']) > 150) {
                    $result['content_preview'] = substr($result['content'], 0, 150) . '...';
                } else {
                    $result['content_preview'] = $result['content'];
                }
            }
            
            return $results;
            
        } catch (Exception $e) {
            error_log("Error searching messages: " . $e->getMessage());
            return [];
        }
    }
    
    // ===== User Settings =====
    
    public static function getUserChatSettings($userId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT * FROM chat_user_settings WHERE user_id = ?
        ");
        
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Return default settings if none exist
        if (!$settings) {
            return static::getDefaultChatSettings();
        }
        
        return $settings;
    }
    
    public static function updateUserChatSettings($userId, $settings) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $allowedFields = [
                'online_status', 'auto_away_minutes', 'desktop_notifications',
                'sound_notifications', 'notification_sound', 'enter_to_send',
                'show_typing_indicators', 'show_read_receipts', 'who_can_message',
                'auto_delete_messages_days', 'theme', 'font_size', 'compact_mode',
                'auto_download_images', 'auto_download_files', 'max_file_size_mb'
            ];
            
            $updateFields = [];
            $params = [];
            
            foreach ($settings as $field => $value) {
                if (in_array($field, $allowedFields)) {
                    $updateFields[] = "{$field} = ?";
                    $params[] = $value;
                }
            }
            
            if (empty($updateFields)) {
                return false;
            }
            
            $params[] = $userId;
            
            $stmt = $pdo->prepare("
                UPDATE chat_user_settings 
                SET " . implode(', ', $updateFields) . "
                WHERE user_id = ?
            ");
            
            return $stmt->execute($params);
            
        } catch (Exception $e) {
            error_log("Error updating chat settings: " . $e->getMessage());
            return false;
        }
    }
    
    private static function getDefaultChatSettings() {
        return [
            'online_status' => 'online',
            'auto_away_minutes' => 15,
            'desktop_notifications' => true,
            'sound_notifications' => true,
            'notification_sound' => 'default',
            'enter_to_send' => true,
            'show_typing_indicators' => true,
            'show_read_receipts' => true,
            'who_can_message' => 'everyone',
            'auto_delete_messages_days' => null,
            'theme' => 'auto',
            'font_size' => 'medium',
            'compact_mode' => false,
            'auto_download_images' => true,
            'auto_download_files' => false,
            'max_file_size_mb' => 25
        ];
    }
    
    // ===== Utility Methods =====
    
    public static function getUnreadMessageCount($userId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(unread_count), 0) as total_unread
            FROM user_conversations 
            WHERE user_id = ?
        ");
        
        $stmt->execute([$userId]);
        return intval($stmt->fetchColumn());
    }
    
    public static function findOrCreatePrivateConversation($user1Id, $user2Id) {
        $pdo = Database::getInstance()->getConnection();
        
        // Look for existing private conversation between these users
        $stmt = $pdo->prepare("
            SELECT c.id
            FROM conversations c
            JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
            JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
            WHERE c.type = 'private'
            AND cp1.user_id = ? AND cp1.status = 'active'
            AND cp2.user_id = ? AND cp2.status = 'active'
            AND (
                SELECT COUNT(*) 
                FROM conversation_participants cp3 
                WHERE cp3.conversation_id = c.id AND cp3.status = 'active'
            ) = 2
            LIMIT 1
        ");
        
        $stmt->execute([$user1Id, $user2Id]);
        $existingId = $stmt->fetchColumn();
        
        if ($existingId) {
            return $existingId;
        }
        
        // Create new conversation
        return static::createConversation('private', $user1Id, [$user2Id]);
    }
    
    public static function cleanupChatData() {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("CALL cleanup_chat_data()");
            $stmt->execute();
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error cleaning up chat data: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Real-time Event Integration =====
    
    public static function broadcastMessageToConversation($conversationId, $message, $excludeUserId = null) {
        // Get conversation participants
        $participants = static::getConversationParticipants($conversationId);
        
        foreach ($participants as $participant) {
            if ($participant['user_id'] != $excludeUserId && $participant['status'] === 'active') {
                // Create real-time event for each participant
                Notification::createRealtimeEvent('chat_message', [
                    'conversation_id' => $conversationId,
                    'message' => $message
                ], $participant['user_id']);
            }
        }
    }
    
    public static function broadcastTypingIndicator($conversationId, $userId, $isTyping = true) {
        // Get conversation participants
        $participants = static::getConversationParticipants($conversationId);
        
        foreach ($participants as $participant) {
            if ($participant['user_id'] != $userId && $participant['status'] === 'active') {
                // Create real-time event for typing indicator
                Notification::createRealtimeEvent('typing_indicator', [
                    'conversation_id' => $conversationId,
                    'user_id' => $userId,
                    'is_typing' => $isTyping
                ], $participant['user_id']);
            }
        }
    }
}
?>