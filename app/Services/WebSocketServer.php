<?php
/**
 * WebSocket Server for Real-time Notifications
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles real-time WebSocket connections for instant notifications,
 * live updates, and real-time collaboration features
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/SecurityHelper.php';

class WebSocketServer {
    private $server;
    private $clients = [];
    private $userConnections = [];
    private $rooms = [];
    private $db;
    private $securityHelper;
    
    private $host = '0.0.0.0';
    private $port = 8080;
    private $maxConnections = 1000;
    
    public function __construct($host = null, $port = null) {
        if ($host) $this->host = $host;
        if ($port) $this->port = $port;
        
        $this->db = Database::getInstance();
        $this->securityHelper = new SecurityHelper();
        
        $this->setupServer();
    }
    
    // ===== Server Setup =====
    
    private function setupServer() {
        $context = stream_context_create([
            'socket' => [
                'so_reuseport' => 1,
                'tcp_nodelay' => 1
            ]
        ]);
        
        $this->server = stream_socket_server(
            "tcp://{$this->host}:{$this->port}",
            $errno, $errstr, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN, $context
        );
        
        if (!$this->server) {
            throw new Exception("WebSocket server failed to start: $errstr ($errno)");
        }
        
        stream_set_blocking($this->server, false);
        
        echo "[WebSocket] Server started on {$this->host}:{$this->port}\n";
    }
    
    // ===== Main Server Loop =====
    
    public function run() {
        echo "[WebSocket] Server running... Press Ctrl+C to stop\n";
        
        while (true) {
            $this->processConnections();
            $this->processPendingEvents();
            $this->cleanupConnections();
            
            usleep(10000); // 10ms sleep to prevent high CPU usage
        }
    }
    
    private function processConnections() {
        // Accept new connections
        $newSocket = @stream_socket_accept($this->server, 0);
        if ($newSocket) {
            $this->handleNewConnection($newSocket);
        }
        
        // Process existing connections
        foreach ($this->clients as $clientId => $client) {
            if (!$this->isSocketAlive($client['socket'])) {
                $this->disconnectClient($clientId, 'Socket closed');
                continue;
            }
            
            $data = $this->readFromSocket($client['socket']);
            if ($data !== false && $data !== '') {
                $this->handleClientMessage($clientId, $data);
            }
        }
    }
    
    // ===== Connection Management =====
    
    private function handleNewConnection($socket) {
        if (count($this->clients) >= $this->maxConnections) {
            $this->sendToSocket($socket, $this->createFrame('Server full', 'close'));
            fclose($socket);
            return;
        }
        
        $headers = $this->readHeaders($socket);
        if (!$this->validateWebSocketHandshake($headers)) {
            fclose($socket);
            return;
        }
        
        $this->performHandshake($socket, $headers);
        
        $clientId = uniqid('client_');
        $this->clients[$clientId] = [
            'id' => $clientId,
            'socket' => $socket,
            'user_id' => null,
            'authenticated' => false,
            'connected_at' => time(),
            'last_ping' => time(),
            'rooms' => [],
            'metadata' => []
        ];
        
        echo "[WebSocket] New connection: {$clientId}\n";
        
        // Send welcome message
        $this->sendToClient($clientId, [
            'type' => 'connection_established',
            'client_id' => $clientId,
            'timestamp' => time()
        ]);
    }
    
    private function disconnectClient($clientId, $reason = 'Unknown') {
        if (!isset($this->clients[$clientId])) return;
        
        $client = $this->clients[$clientId];
        
        // Update database
        if ($client['authenticated'] && $client['user_id']) {
            $this->updateConnectionStatus($clientId, 'disconnected', $reason);
            
            // Remove from user connections
            if (isset($this->userConnections[$client['user_id']])) {
                unset($this->userConnections[$client['user_id']][$clientId]);
                if (empty($this->userConnections[$client['user_id']])) {
                    unset($this->userConnections[$client['user_id']]);
                }
            }
            
            // Leave all rooms
            foreach ($client['rooms'] as $room) {
                $this->leaveRoom($clientId, $room);
            }
        }
        
        // Close socket
        if (is_resource($client['socket'])) {
            fclose($client['socket']);
        }
        
        unset($this->clients[$clientId]);
        
        echo "[WebSocket] Client disconnected: {$clientId} (Reason: {$reason})\n";
    }
    
    // ===== Message Handling =====
    
    private function handleClientMessage($clientId, $data) {
        try {
            $message = json_decode($data, true);
            if (!$message || !isset($message['type'])) {
                $this->sendError($clientId, 'Invalid message format');
                return;
            }
            
            // Update last activity
            $this->clients[$clientId]['last_ping'] = time();
            
            switch ($message['type']) {
                case 'authenticate':
                    $this->handleAuthentication($clientId, $message);
                    break;
                    
                case 'ping':
                    $this->handlePing($clientId);
                    break;
                    
                case 'join_room':
                    $this->handleJoinRoom($clientId, $message);
                    break;
                    
                case 'leave_room':
                    $this->handleLeaveRoom($clientId, $message);
                    break;
                    
                case 'mark_notification_read':
                    $this->handleMarkNotificationRead($clientId, $message);
                    break;
                    
                case 'get_unread_count':
                    $this->handleGetUnreadCount($clientId);
                    break;
                    
                case 'subscribe_to_user_updates':
                    $this->handleUserUpdatesSubscription($clientId, $message);
                    break;
                    
                default:
                    $this->sendError($clientId, 'Unknown message type: ' . $message['type']);
            }
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error handling message from {$clientId}: " . $e->getMessage());
            $this->sendError($clientId, 'Internal server error');
        }
    }
    
    private function handleAuthentication($clientId, $message) {
        if (!isset($message['token'])) {
            $this->sendError($clientId, 'Authentication token required');
            return;
        }
        
        try {
            $payload = $this->securityHelper->validateJWT($message['token']);
            $userId = $payload['user_id'];
            
            // Update client info
            $this->clients[$clientId]['user_id'] = $userId;
            $this->clients[$clientId]['authenticated'] = true;
            $this->clients[$clientId]['metadata'] = [
                'user_type' => $payload['user_type'],
                'email' => $payload['email']
            ];
            
            // Add to user connections
            if (!isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = [];
            }
            $this->userConnections[$userId][$clientId] = $clientId;
            
            // Store in database
            $this->createConnectionRecord($clientId, $userId);
            
            // Send authentication success
            $this->sendToClient($clientId, [
                'type' => 'authenticated',
                'user_id' => $userId,
                'timestamp' => time()
            ]);
            
            // Send pending notifications
            $this->sendPendingNotifications($clientId, $userId);
            
            echo "[WebSocket] User {$userId} authenticated on connection {$clientId}\n";
            
        } catch (Exception $e) {
            $this->sendError($clientId, 'Authentication failed');
            echo "[WebSocket] Authentication failed for {$clientId}: " . $e->getMessage() . "\n";
        }
    }
    
    private function handlePing($clientId) {
        $this->sendToClient($clientId, [
            'type' => 'pong',
            'timestamp' => time()
        ]);
        
        // Update ping in database
        if ($this->clients[$clientId]['authenticated']) {
            $this->updateConnectionPing($clientId);
        }
    }
    
    private function handleJoinRoom($clientId, $message) {
        if (!$this->clients[$clientId]['authenticated']) {
            $this->sendError($clientId, 'Authentication required');
            return;
        }
        
        $room = $message['room'] ?? null;
        if (!$room) {
            $this->sendError($clientId, 'Room name required');
            return;
        }
        
        $this->joinRoom($clientId, $room);
    }
    
    private function handleLeaveRoom($clientId, $message) {
        $room = $message['room'] ?? null;
        if (!$room) {
            $this->sendError($clientId, 'Room name required');
            return;
        }
        
        $this->leaveRoom($clientId, $room);
    }
    
    private function handleMarkNotificationRead($clientId, $message) {
        if (!$this->clients[$clientId]['authenticated']) {
            $this->sendError($clientId, 'Authentication required');
            return;
        }
        
        $notificationIds = $message['notification_ids'] ?? [];
        $userId = $this->clients[$clientId]['user_id'];
        
        if (empty($notificationIds)) {
            $this->sendError($clientId, 'Notification IDs required');
            return;
        }
        
        try {
            $this->markNotificationsAsRead($userId, $notificationIds);
            
            $this->sendToClient($clientId, [
                'type' => 'notifications_marked_read',
                'notification_ids' => $notificationIds,
                'timestamp' => time()
            ]);
            
        } catch (Exception $e) {
            $this->sendError($clientId, 'Failed to mark notifications as read');
        }
    }
    
    private function handleGetUnreadCount($clientId) {
        if (!$this->clients[$clientId]['authenticated']) {
            $this->sendError($clientId, 'Authentication required');
            return;
        }
        
        $userId = $this->clients[$clientId]['user_id'];
        $unreadCount = $this->getUnreadNotificationCount($userId);
        
        $this->sendToClient($clientId, [
            'type' => 'unread_count',
            'count' => $unreadCount,
            'timestamp' => time()
        ]);
    }
    
    // ===== Room Management =====
    
    private function joinRoom($clientId, $room) {
        if (!isset($this->rooms[$room])) {
            $this->rooms[$room] = [];
        }
        
        $this->rooms[$room][$clientId] = $clientId;
        $this->clients[$clientId]['rooms'][] = $room;
        
        $this->sendToClient($clientId, [
            'type' => 'room_joined',
            'room' => $room,
            'timestamp' => time()
        ]);
        
        echo "[WebSocket] Client {$clientId} joined room {$room}\n";
    }
    
    private function leaveRoom($clientId, $room) {
        if (isset($this->rooms[$room][$clientId])) {
            unset($this->rooms[$room][$clientId]);
            
            if (empty($this->rooms[$room])) {
                unset($this->rooms[$room]);
            }
        }
        
        $clientRooms = array_search($room, $this->clients[$clientId]['rooms']);
        if ($clientRooms !== false) {
            unset($this->clients[$clientId]['rooms'][$clientRooms]);
        }
        
        $this->sendToClient($clientId, [
            'type' => 'room_left',
            'room' => $room,
            'timestamp' => time()
        ]);
        
        echo "[WebSocket] Client {$clientId} left room {$room}\n";
    }
    
    // ===== Broadcasting =====
    
    public function broadcastToUser($userId, $message) {
        if (!isset($this->userConnections[$userId])) {
            return false; // User not connected
        }
        
        $sent = 0;
        foreach ($this->userConnections[$userId] as $clientId) {
            if (isset($this->clients[$clientId])) {
                $this->sendToClient($clientId, $message);
                $sent++;
            }
        }
        
        return $sent;
    }
    
    public function broadcastToRoom($room, $message, $excludeClient = null) {
        if (!isset($this->rooms[$room])) {
            return 0;
        }
        
        $sent = 0;
        foreach ($this->rooms[$room] as $clientId) {
            if ($clientId !== $excludeClient && isset($this->clients[$clientId])) {
                $this->sendToClient($clientId, $message);
                $sent++;
            }
        }
        
        return $sent;
    }
    
    public function broadcastToAll($message, $excludeClient = null) {
        $sent = 0;
        foreach ($this->clients as $clientId => $client) {
            if ($clientId !== $excludeClient) {
                $this->sendToClient($clientId, $message);
                $sent++;
            }
        }
        
        return $sent;
    }
    
    // ===== Notification Processing =====
    
    private function processPendingEvents() {
        try {
            $pdo = $this->db->getConnection();
            
            // Get pending real-time events
            $stmt = $pdo->prepare("
                SELECT * FROM realtime_events 
                WHERE broadcast_status = 'pending' 
                AND (scheduled_at <= NOW() OR scheduled_at IS NULL)
                AND (expires_at > NOW() OR expires_at IS NULL)
                ORDER BY scheduled_at ASC 
                LIMIT 100
            ");
            $stmt->execute();
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($events as $event) {
                $this->processRealtimeEvent($event);
            }
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error processing pending events: " . $e->getMessage());
        }
    }
    
    private function processRealtimeEvent($event) {
        try {
            $pdo = $this->db->getConnection();
            
            // Mark as broadcasting
            $stmt = $pdo->prepare("
                UPDATE realtime_events 
                SET broadcast_status = 'broadcasting', broadcast_started_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$event['id']]);
            
            $eventData = json_decode($event['event_data'], true);
            $totalTargets = 0;
            $successfulDeliveries = 0;
            
            // Broadcast based on target type
            if ($event['target_user_id']) {
                // User-specific event
                $sent = $this->broadcastToUser($event['target_user_id'], [
                    'type' => $event['event_type'],
                    'data' => $eventData,
                    'timestamp' => time()
                ]);
                
                $totalTargets = 1;
                $successfulDeliveries = $sent > 0 ? 1 : 0;
                
            } elseif ($event['target_room']) {
                // Room-specific event
                $sent = $this->broadcastToRoom($event['target_room'], [
                    'type' => $event['event_type'],
                    'data' => $eventData,
                    'timestamp' => time()
                ]);
                
                $totalTargets = isset($this->rooms[$event['target_room']]) ? count($this->rooms[$event['target_room']]) : 0;
                $successfulDeliveries = $sent;
                
            } else {
                // Global event
                $sent = $this->broadcastToAll([
                    'type' => $event['event_type'],
                    'data' => $eventData,
                    'timestamp' => time()
                ]);
                
                $totalTargets = count($this->clients);
                $successfulDeliveries = $sent;
            }
            
            // Update event status
            $stmt = $pdo->prepare("
                UPDATE realtime_events 
                SET broadcast_status = 'completed', 
                    broadcast_completed_at = NOW(),
                    total_targets = ?,
                    successful_deliveries = ?,
                    failed_deliveries = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $totalTargets, 
                $successfulDeliveries, 
                $totalTargets - $successfulDeliveries,
                $event['id']
            ]);
            
            echo "[WebSocket] Processed event {$event['id']}: {$event['event_type']} -> {$successfulDeliveries}/{$totalTargets} delivered\n";
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error processing event {$event['id']}: " . $e->getMessage());
            
            // Mark event as failed
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare("
                UPDATE realtime_events 
                SET broadcast_status = 'failed' 
                WHERE id = ?
            ");
            $stmt->execute([$event['id']]);
        }
    }
    
    private function sendPendingNotifications($clientId, $userId) {
        try {
            $pdo = $this->db->getConnection();
            
            // Get recent unread notifications
            $stmt = $pdo->prepare("
                SELECT * FROM notifications 
                WHERE user_id = ? AND read_at IS NULL AND status = 'sent'
                ORDER BY created_at DESC 
                LIMIT 10
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($notifications)) {
                $this->sendToClient($clientId, [
                    'type' => 'pending_notifications',
                    'notifications' => $notifications,
                    'count' => count($notifications),
                    'timestamp' => time()
                ]);
            }
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error sending pending notifications: " . $e->getMessage());
        }
    }
    
    // ===== Database Operations =====
    
    private function createConnectionRecord($clientId, $userId) {
        try {
            $pdo = $this->db->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO realtime_connections 
                (user_id, connection_id, ip_address, user_agent, connected_at, last_ping_at) 
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $userId,
                $clientId,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error creating connection record: " . $e->getMessage());
        }
    }
    
    private function updateConnectionStatus($clientId, $status, $reason = null) {
        try {
            $pdo = $this->db->getConnection();
            
            $stmt = $pdo->prepare("
                UPDATE realtime_connections 
                SET status = ?, disconnect_reason = ?, disconnected_at = NOW() 
                WHERE connection_id = ?
            ");
            $stmt->execute([$status, $reason, $clientId]);
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error updating connection status: " . $e->getMessage());
        }
    }
    
    private function updateConnectionPing($clientId) {
        try {
            $pdo = $this->db->getConnection();
            
            $stmt = $pdo->prepare("
                UPDATE realtime_connections 
                SET last_ping_at = NOW() 
                WHERE connection_id = ?
            ");
            $stmt->execute([$clientId]);
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error updating connection ping: " . $e->getMessage());
        }
    }
    
    private function markNotificationsAsRead($userId, $notificationIds) {
        $pdo = $this->db->getConnection();
        
        $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
        $stmt = $pdo->prepare("
            UPDATE notifications 
            SET read_at = NOW() 
            WHERE user_id = ? AND id IN ({$placeholders}) AND read_at IS NULL
        ");
        
        $params = array_merge([$userId], $notificationIds);
        $stmt->execute($params);
    }
    
    private function getUnreadNotificationCount($userId) {
        try {
            $pdo = $this->db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = ? AND read_at IS NULL AND status = 'sent'
            ");
            $stmt->execute([$userId]);
            
            return intval($stmt->fetchColumn());
            
        } catch (Exception $e) {
            error_log("[WebSocket] Error getting unread count: " . $e->getMessage());
            return 0;
        }
    }
    
    // ===== Utility Methods =====
    
    private function cleanupConnections() {
        $now = time();
        
        foreach ($this->clients as $clientId => $client) {
            // Disconnect inactive connections (no ping for 2 minutes)
            if ($now - $client['last_ping'] > 120) {
                $this->disconnectClient($clientId, 'Ping timeout');
            }
        }
    }
    
    private function sendToClient($clientId, $message) {
        if (!isset($this->clients[$clientId])) {
            return false;
        }
        
        $jsonMessage = json_encode($message);
        $frame = $this->createFrame($jsonMessage, 'text');
        
        return $this->sendToSocket($this->clients[$clientId]['socket'], $frame);
    }
    
    private function sendError($clientId, $error) {
        $this->sendToClient($clientId, [
            'type' => 'error',
            'error' => $error,
            'timestamp' => time()
        ]);
    }
    
    private function sendToSocket($socket, $data) {
        if (!is_resource($socket)) {
            return false;
        }
        
        $written = @fwrite($socket, $data);
        return $written !== false;
    }
    
    private function readFromSocket($socket) {
        if (!is_resource($socket)) {
            return false;
        }
        
        $data = @fread($socket, 4096);
        if ($data === false || $data === '') {
            return false;
        }
        
        return $this->decodeFrame($data);
    }
    
    private function isSocketAlive($socket) {
        if (!is_resource($socket)) {
            return false;
        }
        
        $read = [$socket];
        $write = null;
        $except = null;
        
        $result = @stream_select($read, $write, $except, 0);
        
        if ($result === false) {
            return false;
        }
        
        if ($result > 0) {
            $data = @fread($socket, 1);
            if ($data === false || feof($socket)) {
                return false;
            }
            // Put the byte back
            if ($data !== '') {
                // This is a simplified check - in real implementation we'd handle this better
            }
        }
        
        return true;
    }
    
    // ===== WebSocket Protocol Implementation =====
    
    private function readHeaders($socket) {
        $headers = [];
        while (($line = trim(fgets($socket))) !== '') {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
        }
        return $headers;
    }
    
    private function validateWebSocketHandshake($headers) {
        return isset($headers['upgrade']) && 
               strtolower($headers['upgrade']) === 'websocket' &&
               isset($headers['connection']) && 
               stripos($headers['connection'], 'upgrade') !== false &&
               isset($headers['sec-websocket-key']);
    }
    
    private function performHandshake($socket, $headers) {
        $key = $headers['sec-websocket-key'];
        $acceptKey = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        
        $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Accept: {$acceptKey}\r\n\r\n";
        
        fwrite($socket, $response);
    }
    
    private function createFrame($data, $type = 'text') {
        $opcode = $type === 'text' ? 1 : ($type === 'close' ? 8 : 2);
        $length = strlen($data);
        
        $header = chr(0x80 | $opcode); // FIN bit + opcode
        
        if ($length < 126) {
            $header .= chr($length);
        } elseif ($length < 65536) {
            $header .= chr(126) . pack('n', $length);
        } else {
            $header .= chr(127) . pack('J', $length);
        }
        
        return $header . $data;
    }
    
    private function decodeFrame($data) {
        if (strlen($data) < 2) {
            return false;
        }
        
        $firstByte = ord($data[0]);
        $secondByte = ord($data[1]);
        
        $fin = ($firstByte & 0x80) === 0x80;
        $opcode = $firstByte & 0x0F;
        $masked = ($secondByte & 0x80) === 0x80;
        $payloadLength = $secondByte & 0x7F;
        
        $offset = 2;
        
        if ($payloadLength === 126) {
            $payloadLength = unpack('n', substr($data, $offset, 2))[1];
            $offset += 2;
        } elseif ($payloadLength === 127) {
            $payloadLength = unpack('J', substr($data, $offset, 8))[1];
            $offset += 8;
        }
        
        if ($masked) {
            $maskingKey = substr($data, $offset, 4);
            $offset += 4;
        }
        
        $payload = substr($data, $offset, $payloadLength);
        
        if ($masked) {
            for ($i = 0; $i < strlen($payload); $i++) {
                $payload[$i] = chr(ord($payload[$i]) ^ ord($maskingKey[$i % 4]));
            }
        }
        
        return $payload;
    }
}

// Command line usage
if (php_sapi_name() === 'cli') {
    $host = $argv[1] ?? '0.0.0.0';
    $port = isset($argv[2]) ? intval($argv[2]) : 8080;
    
    $server = new WebSocketServer($host, $port);
    $server->run();
}
?>