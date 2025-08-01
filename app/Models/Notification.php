<?php
/**
 * Notification Model
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles notification creation, delivery tracking,
 * preferences, and real-time event processing
 */

require_once __DIR__ . '/BaseModel.php';

class Notification extends BaseModel {
    protected static $table = 'notifications';
    
    // ===== Notification Creation =====
    
    public static function createFromTemplate($userId, $typeCode, $variables = [], $relatedEntityType = null, $relatedEntityId = null) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                CALL create_notification(?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $typeCode,
                json_encode($variables),
                $relatedEntityType,
                $relatedEntityId
            ]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error creating notification: " . $e->getMessage());
            return false;
        }
    }
    
    public static function createDirect($data) {
        $notification = new static();
        
        $notification->user_id = $data['user_id'];
        $notification->notification_type_id = $data['notification_type_id'] ?? null;
        $notification->title = $data['title'];
        $notification->body = $data['body'];
        $notification->action_url = $data['action_url'] ?? null;
        $notification->related_entity_type = $data['related_entity_type'] ?? null;
        $notification->related_entity_id = $data['related_entity_id'] ?? null;
        $notification->priority = $data['priority'] ?? 'normal';
        $notification->group_key = $data['group_key'] ?? null;
        $notification->metadata = isset($data['metadata']) ? json_encode($data['metadata']) : null;
        $notification->expires_at = $data['expires_at'] ?? null;
        $notification->scheduled_at = $data['scheduled_at'] ?? date('Y-m-d H:i:s');
        
        return $notification->save();
    }
    
    // ===== Notification Retrieval =====
    
    public static function getUserNotifications($userId, $options = []) {
        $pdo = Database::getInstance()->getConnection();
        
        $limit = $options['limit'] ?? 50;
        $offset = $options['offset'] ?? 0;
        $unreadOnly = $options['unread_only'] ?? false;
        $priority = $options['priority'] ?? null;
        
        $whereConditions = ['n.user_id = ?'];
        $params = [$userId];
        
        if ($unreadOnly) {
            $whereConditions[] = 'n.read_at IS NULL';
        }
        
        if ($priority) {
            $whereConditions[] = 'n.priority = ?';
            $params[] = $priority;
        }
        
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("
            SELECT 
                n.*,
                nt.type_code,
                nt.category,
                nt.icon,
                nt.color,
                nt.sound,
                nt.requires_action,
                DATE_FORMAT(n.created_at, '%d/%m/%Y %H:%i') as formatted_created_at,
                CASE 
                    WHEN n.read_at IS NULL THEN 'unread'
                    WHEN n.clicked_at IS NULL THEN 'read'
                    ELSE 'clicked'
                END as interaction_status,
                TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) as minutes_ago
            FROM notifications n
            LEFT JOIN notification_types nt ON n.notification_type_id = nt.id
            {$whereClause}
            AND n.status = 'sent'
            AND (n.expires_at IS NULL OR n.expires_at > NOW())
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function getUnreadCount($userId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM notifications 
            WHERE user_id = ? 
            AND read_at IS NULL 
            AND status = 'sent'
            AND (expires_at IS NULL OR expires_at > NOW())
        ");
        
        $stmt->execute([$userId]);
        return intval($stmt->fetchColumn());
    }
    
    public static function getNotificationSummary($userId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
                COUNT(CASE WHEN priority = 'urgent' AND read_at IS NULL THEN 1 END) as urgent_unread,
                COUNT(CASE WHEN priority = 'high' AND read_at IS NULL THEN 1 END) as high_unread,
                MAX(created_at) as last_notification_at
            FROM notifications 
            WHERE user_id = ? 
            AND status = 'sent'
            AND (expires_at IS NULL OR expires_at > NOW())
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // ===== Notification Actions =====
    
    public static function markAsRead($userId, $notificationIds) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            if (is_array($notificationIds)) {
                $stmt = $pdo->prepare("
                    CALL mark_notifications_read(?, ?)
                ");
                $stmt->execute([$userId, json_encode($notificationIds)]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE notifications 
                    SET read_at = NOW() 
                    WHERE id = ? AND user_id = ? AND read_at IS NULL
                ");
                $stmt->execute([$notificationIds, $userId]);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error marking notifications as read: " . $e->getMessage());
            return false;
        }
    }
    
    public static function markAsClicked($notificationId, $userId) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                UPDATE notifications 
                SET clicked_at = NOW(), read_at = COALESCE(read_at, NOW())
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$notificationId, $userId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error marking notification as clicked: " . $e->getMessage());
            return false;
        }
    }
    
    public static function dismiss($notificationId, $userId) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                UPDATE notifications 
                SET dismissed_at = NOW(), read_at = COALESCE(read_at, NOW())
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$notificationId, $userId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error dismissing notification: " . $e->getMessage());
            return false;
        }
    }
    
    public static function markAllAsRead($userId) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                UPDATE notifications 
                SET read_at = NOW() 
                WHERE user_id = ? AND read_at IS NULL
            ");
            $stmt->execute([$userId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error marking all notifications as read: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Notification Preferences =====
    
    public static function getUserPreferences($userId) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT 
                np.*,
                nt.type_code,
                nt.category,
                nt.name,
                nt.description
            FROM notification_preferences np
            JOIN notification_types nt ON np.notification_type_id = nt.id
            WHERE np.user_id = ?
            ORDER BY nt.category, nt.name
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function updatePreferences($userId, $preferences) {
        try {
            $pdo = Database::getInstance()->getConnection();
            $pdo->beginTransaction();
            
            foreach ($preferences as $typeId => $settings) {
                $stmt = $pdo->prepare("
                    UPDATE notification_preferences 
                    SET email_enabled = ?, push_enabled = ?, websocket_enabled = ?, 
                        sms_enabled = ?, frequency = ?, quiet_hours_start = ?, 
                        quiet_hours_end = ?, timezone = ?
                    WHERE user_id = ? AND notification_type_id = ?
                ");
                
                $stmt->execute([
                    $settings['email_enabled'] ?? true,
                    $settings['push_enabled'] ?? true,
                    $settings['websocket_enabled'] ?? true,
                    $settings['sms_enabled'] ?? false,
                    $settings['frequency'] ?? 'immediately',
                    $settings['quiet_hours_start'] ?? null,
                    $settings['quiet_hours_end'] ?? null,
                    $settings['timezone'] ?? 'America/Argentina/Buenos_Aires',
                    $userId,
                    $typeId
                ]);
            }
            
            $pdo->commit();
            return true;
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Error updating notification preferences: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Real-time Events =====
    
    public static function createRealtimeEvent($eventType, $eventData, $targetUserId = null, $targetRoom = null) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO realtime_events 
                (event_type, target_user_id, target_room, event_data, scheduled_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $eventType,
                $targetUserId,
                $targetRoom,
                json_encode($eventData)
            ]);
            
            return $pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Error creating realtime event: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getPendingRealtimeEvents($limit = 100) {
        $pdo = Database::getInstance()->getConnection();
        
        $stmt = $pdo->prepare("
            SELECT * FROM realtime_events 
            WHERE broadcast_status = 'pending' 
            AND (scheduled_at <= NOW() OR scheduled_at IS NULL)
            AND (expires_at > NOW() OR expires_at IS NULL)
            ORDER BY scheduled_at ASC 
            LIMIT ?
        ");
        
        $stmt->execute([$limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ===== Push Notification Tokens =====
    
    public static function savePushToken($userId, $token, $platform, $tokenData = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO push_tokens 
                (user_id, token, platform, endpoint, p256dh_key, auth_key, 
                 app_version, device_model, os_version, last_used_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                endpoint = VALUES(endpoint),
                p256dh_key = VALUES(p256dh_key),
                auth_key = VALUES(auth_key),
                last_used_at = NOW(),
                is_active = TRUE
            ");
            
            $stmt->execute([
                $userId,
                $token,
                $platform,
                $tokenData['endpoint'] ?? null,
                $tokenData['p256dh_key'] ?? null,
                $tokenData['auth_key'] ?? null,
                $tokenData['app_version'] ?? null,
                $tokenData['device_model'] ?? null,
                $tokenData['os_version'] ?? null
            ]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error saving push token: " . $e->getMessage());
            return false;
        }
    }
    
    public static function getUserPushTokens($userId, $platform = null) {
        $pdo = Database::getInstance()->getConnection();
        
        $whereClause = 'WHERE user_id = ? AND is_active = TRUE';
        $params = [$userId];
        
        if ($platform) {
            $whereClause .= ' AND platform = ?';
            $params[] = $platform;
        }
        
        $stmt = $pdo->prepare("
            SELECT * FROM push_tokens 
            {$whereClause}
            ORDER BY last_used_at DESC
        ");
        
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ===== Delivery Tracking =====
    
    public static function logDelivery($notificationId, $channel, $status, $provider = null, $details = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO notification_delivery_log 
                (notification_id, channel, status, provider, provider_message_id, 
                 response_code, response_message, error_details, queued_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $notificationId,
                $channel,
                $status,
                $provider,
                $details['provider_message_id'] ?? null,
                $details['response_code'] ?? null,
                $details['response_message'] ?? null,
                isset($details['error_details']) ? json_encode($details['error_details']) : null
            ]);
            
            return $pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Error logging delivery: " . $e->getMessage());
            return false;
        }
    }
    
    public static function updateDeliveryStatus($deliveryLogId, $status, $details = []) {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            $setClause = 'status = ?';
            $params = [$status];
            
            if ($status === 'sent') {
                $setClause .= ', sent_at = NOW()';
            } elseif ($status === 'delivered') {
                $setClause .= ', delivered_at = NOW()';
            } elseif ($status === 'failed') {
                $setClause .= ', failed_at = NOW()';
            }
            
            if (isset($details['response_code'])) {
                $setClause .= ', response_code = ?';
                $params[] = $details['response_code'];
            }
            
            if (isset($details['response_message'])) {
                $setClause .= ', response_message = ?';
                $params[] = $details['response_message'];
            }
            
            if (isset($details['processing_time_ms'])) {
                $setClause .= ', processing_time_ms = ?';
                $params[] = $details['processing_time_ms'];
            }
            
            $params[] = $deliveryLogId;
            
            $stmt = $pdo->prepare("
                UPDATE notification_delivery_log 
                SET {$setClause}
                WHERE id = ?
            ");
            
            $stmt->execute($params);
            return true;
            
        } catch (Exception $e) {
            error_log("Error updating delivery status: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Cleanup and Maintenance =====
    
    public static function cleanupExpiredNotifications() {
        try {
            $pdo = Database::getInstance()->getConnection();
            
            // Mark expired notifications
            $stmt = $pdo->prepare("
                UPDATE notifications 
                SET status = 'expired' 
                WHERE expires_at <= NOW() AND status != 'expired'
            ");
            $stmt->execute();
            
            // Delete old read notifications (older than 30 days)
            $stmt = $pdo->prepare("
                DELETE FROM notifications 
                WHERE read_at IS NOT NULL 
                AND read_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
            ");
            $stmt->execute();
            
            // Delete old unread notifications (older than 90 days)
            $stmt = $pdo->prepare("
                DELETE FROM notifications 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
            ");
            $stmt->execute();
            
            return true;
            
        } catch (Exception $e) {
            error_log("Error cleaning up notifications: " . $e->getMessage());
            return false;
        }
    }
    
    // ===== Quick Notification Helpers =====
    
    public static function notifyProjectUpdate($projectId, $message, $excludeUserId = null) {
        $pdo = Database::getInstance()->getConnection();
        
        // Get project participants
        $stmt = $pdo->prepare("
            SELECT DISTINCT user_id FROM (
                SELECT client_id as user_id FROM projects WHERE id = ?
                UNION
                SELECT freelancer_id as user_id FROM projects WHERE id = ? AND freelancer_id IS NOT NULL
                UNION
                SELECT user_id FROM project_proposals WHERE project_id = ?
            ) as participants
            WHERE user_id != ? OR ? IS NULL
        ");
        
        $stmt->execute([$projectId, $projectId, $projectId, $excludeUserId, $excludeUserId]);
        $participants = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($participants as $userId) {
            static::createRealtimeEvent('project_update', [
                'project_id' => $projectId,
                'message' => $message
            ], $userId);
        }
        
        return count($participants);
    }
    
    public static function notifyPaymentUpdate($userId, $message, $paymentData = []) {
        return static::createRealtimeEvent('payment_update', array_merge([
            'message' => $message
        ], $paymentData), $userId);
    }
    
    public static function notifySystemMessage($message, $priority = 'normal', $targetUsers = null) {
        if ($targetUsers === null) {
            // Broadcast to all active users
            return static::createRealtimeEvent('system_message', [
                'message' => $message,
                'priority' => $priority
            ]);
        } else {
            // Send to specific users
            $sentCount = 0;
            foreach ($targetUsers as $userId) {
                if (static::createRealtimeEvent('system_message', [
                    'message' => $message,
                    'priority' => $priority
                ], $userId)) {
                    $sentCount++;
                }
            }
            return $sentCount;
        }
    }
}
?>