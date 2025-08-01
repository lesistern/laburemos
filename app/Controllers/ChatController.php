<?php
/**
 * Chat Controller
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles real-time chat functionality, file uploads,
 * message management, and WebSocket communication
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../models/Chat.php';
require_once __DIR__ . '/../models/Notification.php';

class ChatController {
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
            case 'conversations':
                return $this->getUserConversations($user);
                
            case 'conversation-details':
                return $this->getConversationDetails($user);
                
            case 'messages':
                return $this->getConversationMessages($user);
                
            case 'search':
                return $this->searchMessages($user);
                
            case 'typing':
                return $this->getTypingUsers($user);
                
            case 'settings':
                return $this->getUserChatSettings($user);
                
            case 'unread-count':
                return $this->getUnreadCount($user);
                
            case 'file':
                return $this->downloadFile($user);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function getUserConversations($user) {
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        $type = $_GET['type'] ?? null;
        $hasUnread = isset($_GET['has_unread']) ? filter_var($_GET['has_unread'], FILTER_VALIDATE_BOOLEAN) : null;
        
        if ($limit > 100) $limit = 100; // Max limit
        
        $options = [
            'limit' => $limit,
            'offset' => $offset,
            'type' => $type,
            'has_unread' => $hasUnread
        ];
        
        $conversations = Chat::getUserConversations($user['id'], $options);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'conversations' => $conversations,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => count($conversations) === $limit
                ]
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getConversationDetails($user) {
        $conversationId = $_GET['conversation_id'] ?? null;
        if (!$conversationId) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $conversation = Chat::getConversationDetails($conversationId, $user['id']);
        
        if (!$conversation) {
            throw new Exception('Conversation not found or access denied', 404);
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'conversation' => $conversation
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getConversationMessages($user) {
        $conversationId = $_GET['conversation_id'] ?? null;
        if (!$conversationId) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $limit = intval($_GET['limit'] ?? 50);
        $beforeMessageId = $_GET['before_message_id'] ?? null;
        
        $options = [
            'limit' => $limit,
            'before_message_id' => $beforeMessageId
        ];
        
        $messages = Chat::getConversationMessages($conversationId, $user['id'], $options);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'messages' => $messages,
                'has_more' => count($messages) === $limit
            ],
            'timestamp' => time()
        ]);
    }
    
    private function searchMessages($user) {
        $query = $_GET['query'] ?? '';
        if (strlen($query) < 2) {
            throw new Exception('Search query must be at least 2 characters', 400);
        }
        
        $conversationId = $_GET['conversation_id'] ?? null;
        $limit = intval($_GET['limit'] ?? 20);
        
        $options = [
            'conversation_id' => $conversationId,
            'limit' => $limit
        ];
        
        $results = Chat::searchMessages($user['id'], $query, $options);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'results' => $results,
                'query' => $query
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getTypingUsers($user) {
        $conversationId = $_GET['conversation_id'] ?? null;
        if (!$conversationId) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $typingUsers = Chat::getTypingUsers($conversationId);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'typing_users' => $typingUsers
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getUserChatSettings($user) {
        $settings = Chat::getUserChatSettings($user['id']);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'settings' => $settings
            ],
            'timestamp' => time()
        ]);
    }
    
    private function getUnreadCount($user) {
        $count = Chat::getUnreadMessageCount($user['id']);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'unread_count' => $count
            ],
            'timestamp' => time()
        ]);
    }
    
    private function downloadFile($user) {
        $fileId = $_GET['file_id'] ?? null;
        if (!$fileId) {
            throw new Exception('File ID is required', 400);
        }
        
        $file = Chat::getFileById($fileId, $user['id']);
        
        if (!$file) {
            throw new Exception('File not found or access denied', 404);
        }
        
        // Serve file download
        $filePath = $file['file_path'];
        if (!file_exists($filePath)) {
            throw new Exception('File not found on server', 404);
        }
        
        header('Content-Type: ' . $file['mime_type']);
        header('Content-Disposition: attachment; filename="' . $file['original_name'] . '"');
        header('Content-Length: ' . $file['file_size']);
        
        readfile($filePath);
        exit;
    }
    
    // ===== POST Request Handlers =====
    
    private function handlePostRequest($action, $user) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input && $action !== 'upload-file') {
            throw new Exception('Invalid JSON input', 400);
        }
        
        switch ($action) {
            case 'create-conversation':
                return $this->createConversation($user, $input);
                
            case 'send-message':
                return $this->sendMessage($user, $input);
                
            case 'mark-read':
                return $this->markMessagesAsRead($user, $input);
                
            case 'add-reaction':
                return $this->addReaction($user, $input);
                
            case 'remove-reaction':
                return $this->removeReaction($user, $input);
                
            case 'set-typing':
                return $this->setTyping($user, $input);
                
            case 'upload-file':
                return $this->uploadFile($user);
                
            case 'join-conversation':
                return $this->joinConversation($user, $input);
                
            case 'leave-conversation':
                return $this->leaveConversation($user, $input);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function createConversation($user, $input) {
        $errors = [];
        
        if (empty($input['type']) || !in_array($input['type'], ['private', 'group', 'project'])) {
            $errors[] = 'Valid conversation type is required (private, group, project)';
        }
        
        if ($input['type'] === 'private' && empty($input['participant_id'])) {
            $errors[] = 'Participant ID is required for private conversations';
        }
        
        if ($input['type'] === 'group' && empty($input['participants'])) {
            $errors[] = 'Participants are required for group conversations';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $participants = [];
        $options = [];
        
        if ($input['type'] === 'private') {
            // Check if conversation already exists
            $existingId = Chat::findOrCreatePrivateConversation($user['id'], $input['participant_id']);
            if ($existingId) {
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'conversation_id' => $existingId,
                        'existing' => true
                    ],
                    'message' => 'Using existing conversation',
                    'timestamp' => time()
                ]);
                return;
            }
            
            $participants = [$input['participant_id']];
        } else {
            $participants = $input['participants'];
            $options['title'] = $input['title'] ?? null;
            $options['project_id'] = $input['project_id'] ?? null;
        }
        
        $conversationId = Chat::createConversation($input['type'], $user['id'], $participants, $options);
        
        if ($conversationId) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'conversation_id' => $conversationId
                ],
                'message' => 'Conversation created successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to create conversation', 500);
        }
    }
    
    private function sendMessage($user, $input) {
        $errors = [];
        
        if (empty($input['conversation_id'])) {
            $errors[] = 'Conversation ID is required';
        }
        
        if (empty($input['content']) && empty($input['attachment_url'])) {
            $errors[] = 'Message content or attachment is required';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $messageData = [
            'message_type' => $input['message_type'] ?? 'text',
            'content' => $input['content'] ?? null,
            'attachment_url' => $input['attachment_url'] ?? null,
            'attachment_name' => $input['attachment_name'] ?? null,
            'reply_to_message_id' => $input['reply_to_message_id'] ?? null
        ];
        
        $message = Chat::sendMessage($input['conversation_id'], $user['id'], $messageData);
        
        if ($message) {
            // Broadcast message to conversation participants
            Chat::broadcastMessageToConversation($input['conversation_id'], $message, $user['id']);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'message' => $message
                ],
                'message' => 'Message sent successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to send message', 500);
        }
    }
    
    private function markMessagesAsRead($user, $input) {
        if (empty($input['conversation_id'])) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $result = Chat::markMessagesAsRead(
            $input['conversation_id'], 
            $user['id'], 
            $input['up_to_message_id'] ?? null
        );
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Messages marked as read',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to mark messages as read', 500);
        }
    }
    
    private function addReaction($user, $input) {
        $errors = [];
        
        if (empty($input['message_id'])) {
            $errors[] = 'Message ID is required';
        }
        
        if (empty($input['emoji'])) {
            $errors[] = 'Emoji is required';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $result = Chat::addReaction($input['message_id'], $user['id'], $input['emoji']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Reaction added',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to add reaction', 500);
        }
    }
    
    private function removeReaction($user, $input) {
        $errors = [];
        
        if (empty($input['message_id'])) {
            $errors[] = 'Message ID is required';
        }
        
        if (empty($input['emoji'])) {
            $errors[] = 'Emoji is required';
        }
        
        if (!empty($errors)) {
            throw new Exception(implode(', ', $errors), 400);
        }
        
        $result = Chat::removeReaction($input['message_id'], $user['id'], $input['emoji']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Reaction removed',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to remove reaction', 500);
        }
    }
    
    private function setTyping($user, $input) {
        if (empty($input['conversation_id'])) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $isTyping = filter_var($input['is_typing'] ?? true, FILTER_VALIDATE_BOOLEAN);
        
        $result = Chat::setTyping($input['conversation_id'], $user['id'], $isTyping);
        
        if ($result) {
            // Broadcast typing indicator
            Chat::broadcastTypingIndicator($input['conversation_id'], $user['id'], $isTyping);
            
            echo json_encode([
                'success' => true,
                'message' => 'Typing indicator updated',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to update typing indicator', 500);
        }
    }
    
    private function uploadFile($user) {
        if (!isset($_FILES['file'])) {
            throw new Exception('No file uploaded', 400);
        }
        
        $conversationId = $_POST['conversation_id'] ?? null;
        if (!$conversationId) {
            throw new Exception('Conversation ID is required', 400);
        }
        
        $file = $_FILES['file'];
        
        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error', 400);
        }
        
        $maxSize = 25 * 1024 * 1024; // 25MB
        if ($file['size'] > $maxSize) {
            throw new Exception('File too large (max 25MB)', 400);
        }
        
        // Allowed file types
        $allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/zip', 'application/x-zip-compressed'
        ];
        
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('File type not allowed', 400);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $storedName = uniqid() . '_' . time() . '.' . $extension;
        $uploadDir = __DIR__ . '/../uploads/chat/';
        
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $filePath = $uploadDir . $storedName;
        
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new Exception('Failed to save file', 500);
        }
        
        // Get file dimensions for images
        $width = null;
        $height = null;
        if (strpos($file['type'], 'image/') === 0) {
            list($width, $height) = getimagesize($filePath);
        }
        
        $fileData = [
            'original_name' => $file['name'],
            'stored_name' => $storedName,
            'file_path' => $filePath,
            'file_size' => $file['size'],
            'mime_type' => $file['type'],
            'width' => $width,
            'height' => $height
        ];
        
        $fileId = Chat::uploadFile($conversationId, $user['id'], $fileData);
        
        if ($fileId) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'file_id' => $fileId,
                    'file_url' => '/api/ChatController.php?action=file&file_id=' . $fileId,
                    'original_name' => $file['name'],
                    'file_size' => $file['size'],
                    'mime_type' => $file['type']
                ],
                'message' => 'File uploaded successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to save file record', 500);
        }
    }
    
    // ===== PUT Request Handlers =====
    
    private function handlePutRequest($action, $user) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input', 400);
        }
        
        switch ($action) {
            case 'settings':
                return $this->updateChatSettings($user, $input);
                
            case 'conversation':
                return $this->updateConversation($user, $input);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function updateChatSettings($user, $input) {
        if (empty($input['settings'])) {
            throw new Exception('Settings data is required', 400);
        }
        
        $result = Chat::updateUserChatSettings($user['id'], $input['settings']);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Chat settings updated successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to update chat settings', 500);
        }
    }
    
    // ===== DELETE Request Handlers =====
    
    private function handleDeleteRequest($action, $user) {
        switch ($action) {
            case 'message':
                return $this->deleteMessage($user);
                
            case 'conversation':
                return $this->deleteConversation($user);
                
            default:
                throw new Exception('Invalid action', 400);
        }
    }
    
    private function deleteMessage($user) {
        $messageId = $_GET['message_id'] ?? null;
        if (!$messageId) {
            throw new Exception('Message ID is required', 400);
        }
        
        // Check if user owns the message
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare("
            SELECT sender_id, conversation_id 
            FROM messages 
            WHERE id = ?
        ");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$message) {
            throw new Exception('Message not found', 404);
        }
        
        if ($message['sender_id'] != $user['id']) {
            throw new Exception('Access denied', 403);
        }
        
        // Mark message as deleted
        $stmt = $pdo->prepare("
            UPDATE messages 
            SET message_type = 'deleted', content = NULL, attachment_url = NULL
            WHERE id = ?
        ");
        $result = $stmt->execute([$messageId]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Message deleted successfully',
                'timestamp' => time()
            ]);
        } else {
            throw new Exception('Failed to delete message', 500);
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
}

// Handle the request
if ($_SERVER['REQUEST_METHOD']) {
    $controller = new ChatController();
    $controller->handleRequest();
}
?>