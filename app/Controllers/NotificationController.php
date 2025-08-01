<?php
/**
 * Notification Controller
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles notification management, real-time events,
 * preferences, and WebSocket communication
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../models/Notification.php';

class NotificationController {
    private $db;
    private $securityHelper;
    private $validationHelper;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->securityHelper = new SecurityHelper();
        $this->validationHelper = new ValidationHelper();
    }
    
    public function handleRequest() {
        header('Content-Type: application/json');
        
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            // Authenticate user
            $user = $this->authenticateUser();
            if (!$user) {
                throw new Exception('Authentication required', 401);
            }
            
            switch ($method) {
                case 'GET':
                    return $this->handleGetRequest($action, $user);
                case 'POST':
                    return $this->handlePostRequest($action, $user);
                case 'PUT':
                    return $this->handlePutRequest($action, $user);
                case 'DELETE':
                    return $this->handleDeleteRequest($action, $user);
                default:
                    throw new Exception('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            http_response_code($statusCode);
            
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => time()
            ]);
        }
    }
    
    // ===== GET Request Handlers =====
    
    private function handleGetRequest($action, $user) {
        switch ($action) {
            case 'list':
                return $this->getUserNotifications($user);
                
            case 'unread-count':
                return $this->getUnreadCount($user);
                
            case 'summary':
                return $this->getNotificationSummary($user);
                
            case 'preferences':
                return $this->getUserPreferences($user);
                
            case 'push-tokens':
                return $this->getUserPushTokens($user);
                
            case 'delivery-log':
                return $this->getDeliveryLog($user);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function getUserNotifications($user) {
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        $unreadOnly = filter_var($_GET['unread_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $priority = $_GET['priority'] ?? null;
        
        if ($limit > 100) $limit = 100; // Max limit
        
        $options = [
            'limit' => $limit,
            'offset' => $offset,
            'unread_only' => $unreadOnly,
            'priority' => $priority
        ];
        
        $notifications = Notification::getUserNotifications($user['id'], $options);
        
        // Format notifications for frontend
        foreach ($notifications as &$notification) {
            $notification['metadata'] = $notification['metadata'] ? json_decode($notification['metadata'], true) : null;
            $notification['formatted_time_ago'] = $this->formatTimeAgo($notification['minutes_ago']);
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => count($notifications) === $limit
                ]
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getUnreadCount($user) {
        $count = Notification::getUnreadCount($user['id']);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'unread_count' => $count
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getNotificationSummary($user) {
        $summary = Notification::getNotificationSummary($user['id']);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'summary' => $summary
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getUserPreferences($user) {
        $preferences = Notification::getUserPreferences($user['id']);
        
        // Group preferences by category
        $groupedPreferences = [];
        foreach ($preferences as $pref) {
            $groupedPreferences[$pref['category']][] = $pref;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'preferences' => $groupedPreferences
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getUserPushTokens($user) {
        $platform = $_GET['platform'] ?? null;
        $tokens = Notification::getUserPushTokens($user['id'], $platform);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'tokens' => $tokens
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getDeliveryLog($user) {
        // Admin only functionality
        if ($user['user_type'] !== 'admin') {
            throw new Exception('Access denied', 403);
        }
        
        $notificationId = $_GET['notification_id'] ?? null;
        if (!$notificationId) {
            throw new Exception('Notification ID required', 400);
        }
        
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare("
            SELECT * FROM notification_delivery_log 
            WHERE notification_id = ?
            ORDER BY queued_at DESC
        ");
        $stmt->execute([$notificationId]);
        $deliveryLog = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'delivery_log' => $deliveryLog
            ],
            'timestamp' => time()
        ]);
    }
    
    // ===== POST Request Handlers =====
    
    private function handlePostRequest($action, $user) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input', 400);
        }
        
        switch ($action) {
            case 'create':
                return $this->createNotification($user, $input);
                
            case 'mark-read':
                return $this->markNotificationsRead($user, $input);
                
            case 'mark-clicked':
                return $this->markNotificationClicked($user, $input);
                
            case 'dismiss':
                return $this->dismissNotification($user, $input);
                
            case 'mark-all-read':
                return $this->markAllNotificationsRead($user, $input);
                
            case 'save-push-token':
                return $this->savePushToken($user, $input);
                
            case 'create-realtime-event':
                return $this->createRealtimeEvent($user, $input);
                
            case 'send-test-notification':
                return $this->sendTestNotification($user, $input);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function createNotification($user, $input) {
        // Admin only for manual notification creation
        if ($user['user_type'] !== 'admin') {
            throw new Exception('Access denied', 403);
        }
        
        $errors = [];
        
        if (empty($input['user_id'])) {
            $errors[] = 'User ID is required';
        }
        
        if (empty($input['title'])) {
            $errors[] = 'Title is required';
        }
        
        if (empty($input['body'])) {
            $errors[] = 'Body is required';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $notificationData = [
            'user_id' => $input['user_id'],
            'title' => $input['title'],
            'body' => $input['body'],
            'action_url' => $input['action_url'] ?? null,
            'priority' => $input['priority'] ?? 'normal',
            'related_entity_type' => $input['related_entity_type'] ?? null,
            'related_entity_id' => $input['related_entity_id'] ?? null,
            'metadata' => $input['metadata'] ?? null,
            'expires_at' => $input['expires_at'] ?? null
        ];
        
        $result = Notification::createDirect($notificationData);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'notification_id' => $result
                ],
                'message' => 'Notification created successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to create notification', 500);
        }
    }
    
    private function markNotificationsRead($user, $input) {
        if (empty($input['notification_ids'])) {
            throw new Exception('Notification IDs are required', 400);
        }
        
        $notificationIds = $input['notification_ids'];
        if (!is_array($notificationIds)) {
            $notificationIds = [$notificationIds];
        }
        
        $result = Notification::markAsRead($user['id'], $notificationIds);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'marked_count' => count($notificationIds)
                ],
                'message' => 'Notifications marked as read',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to mark notifications as read', 500);
        }
    }
    
    private function markNotificationClicked($user, $input) {
        if (empty($input['notification_id'])) {
            throw new Exception('Notification ID is required', 400);
        }
        
        $result = Notification::markAsClicked($input['notification_id'], $user['id']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification marked as clicked',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to mark notification as clicked', 500);
        }
    }
    
    private function dismissNotification($user, $input) {
        if (empty($input['notification_id'])) {
            throw new Exception('Notification ID is required', 400);
        }
        
        $result = Notification::dismiss($input['notification_id'], $user['id']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification dismissed',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to dismiss notification', 500);
        }
    }
    
    private function markAllNotificationsRead($user, $input) {
        $result = Notification::markAllAsRead($user['id']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'All notifications marked as read',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to mark all notifications as read', 500);
        }
    }
    
    private function savePushToken($user, $input) {
        $errors = [];
        
        if (empty($input['token'])) {
            $errors[] = 'Token is required';
        }
        
        if (empty($input['platform']) || !in_array($input['platform'], ['web', 'android', 'ios'])) {
            $errors[] = 'Valid platform is required (web, android, ios)';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $tokenData = [
            'endpoint' => $input['endpoint'] ?? null,
            'p256dh_key' => $input['p256dh_key'] ?? null,
            'auth_key' => $input['auth_key'] ?? null,
            'app_version' => $input['app_version'] ?? null,
            'device_model' => $input['device_model'] ?? null,
            'os_version' => $input['os_version'] ?? null
        ];
        
        $result = Notification::savePushToken(
            $user['id'], 
            $input['token'], 
            $input['platform'], 
            $tokenData
        );
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Push token saved successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to save push token', 500);
        }
    }
    
    private function createRealtimeEvent($user, $input) {
        // Admin only for manual event creation
        if ($user['user_type'] !== 'admin') {
            throw new Exception('Access denied', 403);
        }
        
        $errors = [];
        
        if (empty($input['event_type'])) {
            $errors[] = 'Event type is required';
        }
        
        if (empty($input['event_data'])) {
            $errors[] = 'Event data is required';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $result = Notification::createRealtimeEvent(
            $input['event_type'],
            $input['event_data'],
            $input['target_user_id'] ?? null,
            $input['target_room'] ?? null
        );
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'event_id' => $result
                ],
                'message' => 'Real-time event created successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to create real-time event', 500);
        }
    }
    
    private function sendTestNotification($user, $input) {
        // Admin only
        if ($user['user_type'] !== 'admin') {
            throw new Exception('Access denied', 403);
        }
        
        $targetUserId = $input['target_user_id'] ?? $user['id'];
        
        $notificationData = [
            'user_id' => $targetUserId,
            'title' => 'Notificación de Prueba',
            'body' => 'Esta es una notificación de prueba del sistema LaburAR',
            'action_url' => '/notifications',
            'priority' => 'normal',
            'metadata' => ['test' => true]
        ];
        
        $result = Notification::createDirect($notificationData);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'notification_id' => $result
                ],
                'message' => 'Test notification sent successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to send test notification', 500);
        }
    }
    
    // ===== PUT Request Handlers =====
    
    private function handlePutRequest($action, $user) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input', 400);
        }
        
        switch ($action) {
            case 'preferences':
                return $this->updatePreferences($user, $input);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function updatePreferences($user, $input) {
        if (empty($input['preferences'])) {
            throw new Exception('Preferences data is required', 400);
        }
        
        $result = Notification::updatePreferences($user['id'], $input['preferences']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification preferences updated successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to update preferences', 500);
        }
    }
    
    // ===== DELETE Request Handlers =====
    
    private function handleDeleteRequest($action, $user) {
        switch ($action) {
            case 'notification':
                return $this->deleteNotification($user);
                
            case 'push-token':
                return $this->deletePushToken($user);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function deleteNotification($user) {
        $notificationId = $_GET['notification_id'] ?? null;
        if (!$notificationId) {
            throw new Exception('Notification ID is required', 400);
        }
        
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare("
            DELETE FROM notifications 
            WHERE id = ? AND user_id = ?
        ");
        $result = $stmt->execute([$notificationId, $user['id']]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification deleted successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Notification not found or access denied', 404);
        }
    }
    
    private function deletePushToken($user) {
        $token = $_GET['token'] ?? null;
        if (!$token) {
            throw new Exception('Token is required', 400);
        }
        
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare("
            UPDATE push_tokens 
            SET is_active = FALSE 
            WHERE user_id = ? AND token = ?
        ");
        $result = $stmt->execute([$user['id'], $token]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Push token deactivated successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to deactivate push token', 500);
        }
    }
    
    // ===== Helper Methods =====
    
    private function authenticateUser() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        $payload = $this->securityHelper->validateJWT($token);
        
        if (!$payload) {
            return null;
        }
        
        return [
            'id' => $payload['user_id'],
            'email' => $payload['email'],
            'user_type' => $payload['user_type']
        ];
    }
    
    private function formatTimeAgo($minutes) {
        if ($minutes < 1) {
            return 'Ahora';
        } elseif ($minutes < 60) {
            return $minutes . ' min';
        } elseif ($minutes < 1440) { // 24 hours
            $hours = floor($minutes / 60);
            return $hours . 'h';
        } elseif ($minutes < 10080) { // 7 days
            $days = floor($minutes / 1440);
            return $days . 'd';
        } else {
            $weeks = floor($minutes / 10080);
            return $weeks . 'sem';
        }
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD']) {
    $controller = new NotificationController();
    $controller->handleRequest();
}
?>