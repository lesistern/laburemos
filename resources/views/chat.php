<?php
/**
 * LaburAR - Chat Page
 * Real-time messaging with WebSocket integration and file sharing
 * 
 * @author LaburAR Team
 * @version 2.0
 * @features Real-time messaging, file upload, message history, typing indicators
 * @since 2025-07-24
 */

// Security headers and initialization
require_once __DIR__ . '/bootstrap.php';

// Check if user is authenticated
if (!isset($_SESSION['user_id']) || !isset($_SESSION['auth_token'])) {
    header('Location: /Laburar/login.php');
    exit;
}

// Get chat parameters
$chat_with_user = filter_input(INPUT_GET, 'user', FILTER_VALIDATE_INT);
$project_id = filter_input(INPUT_GET, 'project', FILTER_VALIDATE_INT);

// Get user's conversations
try {
    $chatController = new \LaburAR\Controllers\ChatController();
    $conversations = $chatController->getUserConversations($_SESSION['user_id']);
    
    // If specific user or project, load that conversation
    $active_conversation = null;
    if ($chat_with_user || $project_id) {
        $active_conversation = $chatController->getOrCreateConversation([
            'user_id' => $_SESSION['user_id'],
            'with_user_id' => $chat_with_user,
            'project_id' => $project_id
        ]);
    }
    
} catch (Exception $e) {
    error_log('Chat page error: ' . $e->getMessage());
    $conversations = [];
    $active_conversation = null;
}

// Generate CSRF token
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// WebSocket configuration
$websocket_config = [
    'url' => $_ENV['WEBSOCKET_URL'] ?? 'ws://localhost:8080',
    'token' => $_SESSION['auth_token'],
    'user_id' => $_SESSION['user_id']
];
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Chat profesional en LaburAR - Comunicación segura con clientes y freelancers">
    <meta name="keywords" content="chat, mensajería, comunicación, freelancer, cliente, argentina">
    <title>Chat - LaburAR | Comunicación Profesional</title>
    
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; connect-src 'self' ws: wss:; img-src 'self' data: https:;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend+Giga:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Professional Stylesheets -->
    <link rel="stylesheet" href="/Laburar/public/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/main.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/chat.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/notifications.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/micro-interactions.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/mobile-optimization.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/Laburar/public/assets/img/icons/logo-32.ico">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Chat - LaburAR">
    <meta property="og:description" content="Comunicación profesional y segura en LaburAR">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://laburar.com.ar/chat">
    <meta property="og:image" content="/Laburar/public/assets/img/og-chat.jpg">

    <style>
        .chat-container {
            display: flex;
            height: calc(100vh - 80px);
            background: var(--glass-bg);
            border-radius: 16px;
            overflow: hidden;
            margin: 20px;
            box-shadow: var(--glass-shadow);
            backdrop-filter: blur(20px);
        }

        .chat-sidebar {
            width: 350px;
            background: rgba(255, 255, 255, 0.1);
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            flex-direction: column;
        }

        .chat-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--neutral-900);
            margin-bottom: 8px;
        }

        .chat-search {
            position: relative;
            margin-top: 16px;
        }

        .chat-search input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: var(--neutral-900);
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .chat-search svg {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--neutral-500);
        }

        .conversations-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .conversation-item {
            display: flex;
            align-items: center;
            padding: 16px 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 4px;
            position: relative;
        }

        .conversation-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .conversation-item.active {
            background: var(--primary-100);
            border-left: 4px solid var(--primary-600);
        }

        .conversation-avatar {
            position: relative;
            margin-right: 12px;
        }

        .conversation-avatar img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
        }

        .online-status {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            background: var(--success-500);
            border: 2px solid white;
            border-radius: 50%;
        }

        .conversation-info {
            flex: 1;
            min-width: 0;
        }

        .conversation-name {
            font-weight: 600;
            color: var(--neutral-900);
            margin-bottom: 4px;
        }

        .conversation-preview {
            font-size: 14px;
            color: var(--neutral-600);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .conversation-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }

        .conversation-time {
            font-size: 12px;
            color: var(--neutral-500);
        }

        .unread-badge {
            background: var(--primary-600);
            color: white;
            border-radius: 10px;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 600;
            min-width: 20px;
            text-align: center;
        }

        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .chat-main-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .chat-user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chat-user-avatar img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }

        .chat-user-details h3 {
            font-weight: 600;
            color: var(--neutral-900);
        }

        .chat-user-status {
            font-size: 14px;
            color: var(--success-600);
        }

        .chat-actions {
            display: flex;
            gap: 8px;
        }

        .chat-actions button {
            padding: 8px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: var(--neutral-700);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .chat-actions button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .message {
            display: flex;
            gap: 12px;
            max-width: 70%;
            animation: fadeInUp 0.3s ease;
        }

        .message.own {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .message-avatar img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
        }

        .message-content {
            background: rgba(255, 255, 255, 0.9);
            padding: 12px 16px;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .message.own .message-content {
            background: var(--primary-600);
            color: white;
        }

        .message-text {
            line-height: 1.5;
            word-wrap: break-word;
        }

        .message-time {
            font-size: 12px;
            color: var(--neutral-500);
            margin-top: 4px;
        }

        .message.own .message-time {
            color: rgba(255, 255, 255, 0.8);
        }

        .message-input-container {
            padding: 20px 24px;
            background: rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .typing-indicator {
            padding: 0 24px 12px;
            font-size: 14px;
            color: var(--neutral-600);
            font-style: italic;
        }

        .message-input-form {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .message-input {
            flex: 1;
            min-height: 44px;
            max-height: 120px;
            padding: 12px 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.9);
            color: var(--neutral-900);
            font-size: 14px;
            resize: none;
            transition: all 0.3s ease;
        }

        .message-input:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .message-actions {
            display: flex;
            gap: 8px;
        }

        .file-upload-btn, .send-btn {
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .file-upload-btn {
            background: rgba(255, 255, 255, 0.1);
            color: var(--neutral-700);
        }

        .file-upload-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .send-btn {
            background: var(--primary-600);
            color: white;
        }

        .send-btn:hover {
            background: var(--primary-700);
        }

        .send-btn:disabled {
            background: var(--neutral-300);
            cursor: not-allowed;
        }

        .empty-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
        }

        .empty-chat-icon {
            width: 80px;
            height: 80px;
            background: var(--primary-100);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }

        .empty-chat-icon svg {
            width: 40px;
            height: 40px;
            color: var(--primary-600);
        }

        @media (max-width: 768px) {
            .chat-container {
                margin: 10px;
                height: calc(100vh - 100px);
            }

            .chat-sidebar {
                width: 100%;
                position: absolute;
                z-index: 10;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }

            .chat-sidebar.show {
                transform: translateX(0);
            }

            .message {
                max-width: 85%;
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>

<body class="chat-page">
    <!-- Professional Navigation -->
    <nav class="navbar navbar-professional glass-navigation">
        <div class="nav-container">
            <div class="nav-brand">
                <a href="/Laburar/" class="brand-link">
                    <img src="/Laburar/public/assets/img/icons/logo-64.png" alt="LaburAR" class="brand-logo">
                    <span class="brand-text">LABUR.AR</span>
                </a>
            </div>
            
            <div class="nav-menu" id="navMenu">
                <a href="/Laburar/dashboard.php" class="nav-link">Dashboard</a>
                <a href="/Laburar/marketplace.php" class="nav-link">Marketplace</a>
                <a href="/Laburar/projects.php" class="nav-link">Proyectos</a>
                <a href="/Laburar/chat.php" class="nav-link active">Mensajes</a>
                <a href="/Laburar/profile.php" class="nav-link">Perfil</a>
            </div>
            
            <div class="nav-auth">
                <div class="user-menu">
                    <button class="user-avatar" onclick="toggleUserMenu()">
                        <img src="<?= htmlspecialchars($_SESSION['user_avatar'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" alt="Usuario">
                        <span><?= htmlspecialchars($_SESSION['user_name'] ?? 'Usuario') ?></span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="/Laburar/profile.php" class="dropdown-item">Mi Perfil</a>
                        <a href="/Laburar/settings.php" class="dropdown-item">Configuración</a>
                        <hr class="dropdown-divider">
                        <a href="/Laburar/logout.php" class="dropdown-item">Cerrar Sesión</a>
                    </div>
                </div>
            </div>
            
            <div class="nav-toggle" id="navToggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Loading Indicator -->
    <div id="chatLoadingIndicator" class="loading-overlay" style="display: none;">
        <div class="loading-spinner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="2"/>
            </svg>
        </div>
        <p>Conectando al chat...</p>
    </div>

    <!-- Chat Container -->
    <div class="chat-container">
        <!-- Chat Sidebar -->
        <div class="chat-sidebar" id="chatSidebar">
            <div class="chat-header">
                <h2>Mensajes</h2>
                <div class="chat-search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input type="text" id="chatSearch" placeholder="Buscar conversaciones...">
                </div>
            </div>

            <div class="conversations-list" id="conversationsList">
                <!-- Conversations will be loaded here -->
                <?php if (!empty($conversations)): ?>
                    <?php foreach ($conversations as $conversation): ?>
                        <div class="conversation-item <?= $active_conversation && $active_conversation['id'] == $conversation['id'] ? 'active' : '' ?>" 
                             data-conversation-id="<?= $conversation['id'] ?>"
                             onclick="loadConversation(<?= $conversation['id'] ?>)">
                            <div class="conversation-avatar">
                                <img src="<?= htmlspecialchars($conversation['other_user']['avatar_url'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" 
                                     alt="<?= htmlspecialchars($conversation['other_user']['name']) ?>">
                                <?php if ($conversation['other_user']['is_online']): ?>
                                    <div class="online-status"></div>
                                <?php endif; ?>
                            </div>
                            <div class="conversation-info">
                                <div class="conversation-name"><?= htmlspecialchars($conversation['other_user']['name']) ?></div>
                                <div class="conversation-preview"><?= htmlspecialchars($conversation['last_message']['content'] ?? 'Sin mensajes') ?></div>
                            </div>
                            <div class="conversation-meta">
                                <div class="conversation-time"><?= $conversation['last_message'] ? date('H:i', strtotime($conversation['last_message']['created_at'])) : '' ?></div>
                                <?php if ($conversation['unread_count'] > 0): ?>
                                    <div class="unread-badge"><?= $conversation['unread_count'] ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="empty-conversations">
                        <div class="empty-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM18 14H6V12H18V14ZM18 11H6V9H18V11ZM18 8H6V6H18V8Z"/>
                            </svg>
                        </div>
                        <h3>Sin conversaciones</h3>
                        <p>Comenzá a chatear con otros usuarios desde sus perfiles o proyectos.</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Chat Main -->
        <div class="chat-main" id="chatMain">
            <?php if ($active_conversation): ?>
                <!-- Active Chat Header -->
                <div class="chat-main-header">
                    <div class="chat-user-info">
                        <button class="mobile-back-btn" onclick="closeMobileChat()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"/>
                            </svg>
                        </button>
                        <div class="chat-user-avatar">
                            <img src="<?= htmlspecialchars($active_conversation['other_user']['avatar_url'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" 
                                 alt="<?= htmlspecialchars($active_conversation['other_user']['name']) ?>">
                        </div>
                        <div class="chat-user-details">
                            <h3><?= htmlspecialchars($active_conversation['other_user']['name']) ?></h3>
                            <div class="chat-user-status" id="userStatus">
                                <?= $active_conversation['other_user']['is_online'] ? 'En línea' : 'Desconectado' ?>
                            </div>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button onclick="startVideoCall()" title="Videollamada">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z"/>
                            </svg>
                        </button>
                        <button onclick="showChatSettings()" title="Configuración">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12S19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12S4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.72 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Messages Container -->
                <div class="messages-container" id="messagesContainer">
                    <!-- Messages will be loaded here dynamically -->
                </div>

                <!-- Typing Indicator -->
                <div class="typing-indicator" id="typingIndicator" style="display: none;">
                    <span id="typingText"></span>
                </div>

                <!-- Message Input -->
                <div class="message-input-container">
                    <form class="message-input-form" id="messageForm" onsubmit="sendMessage(event)">
                        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
                        <input type="hidden" name="conversation_id" value="<?= $active_conversation['id'] ?>">
                        
                        <div class="message-actions">
                            <input type="file" id="fileInput" multiple accept="image/*,application/pdf,.doc,.docx" style="display: none;">
                            <button type="button" class="file-upload-btn" onclick="document.getElementById('fileInput').click()" title="Adjuntar archivo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5S8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5S13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5S11.5 16.05 11.5 15.5V6H10V15.5C10 16.88 11.12 18 12.5 18S15 16.88 15 15.5V5C15 2.79 13.21 1 11 1S7 2.79 7 5V17.5C7 20.54 9.46 23 12.5 23S18 20.54 18 17.5V6H16.5Z"/>
                                </svg>
                            </button>
                        </div>

                        <textarea 
                            class="message-input" 
                            id="messageInput" 
                            name="message" 
                            placeholder="Escribí tu mensaje..." 
                            rows="1"
                            required
                        ></textarea>

                        <button type="submit" class="send-btn" id="sendBtn" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"/>
                            </svg>
                        </button>
                    </form>
                </div>
            <?php else: ?>
                <!-- Empty Chat State -->
                <div class="empty-chat">
                    <div class="empty-chat-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM18 14H6V12H18V14ZM18 11H6V9H18V11ZM18 8H6V6H18V8Z"/>
                        </svg>
                    </div>
                    <h3>Seleccioná una conversación</h3>
                    <p>Elegí una conversación de la lista para comenzar a chatear.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="/Laburar/public/assets/js/chat.js"></script>
    <script src="/Laburar/public/assets/js/micro-interactions.js"></script>
    <script>
        // WebSocket configuration
        const websocketConfig = <?= json_encode($websocket_config) ?>;
        let websocket = null;
        let currentConversationId = <?= $active_conversation ? $active_conversation['id'] : 'null' ?>;
        let typingTimer = null;
        let isTyping = false;

        class ChatManager {
            constructor() {
                this.initializeWebSocket();
                this.setupEventListeners();
                this.loadActiveConversation();
            }

            initializeWebSocket() {
                if (!websocketConfig.url) return;

                try {
                    websocket = new WebSocket(`${websocketConfig.url}?token=${websocketConfig.token}`);
                    
                    websocket.onopen = () => {
                        console.log('WebSocket connected');
                        this.hideLoadingIndicator();
                    };

                    websocket.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    };

                    websocket.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        this.showConnectionError();
                    };

                    websocket.onclose = () => {
                        console.log('WebSocket closed, attempting to reconnect...');
                        setTimeout(() => this.initializeWebSocket(), 3000);
                    };

                } catch (error) {
                    console.error('Failed to initialize WebSocket:', error);
                    this.showConnectionError();
                }
            }

            handleWebSocketMessage(data) {
                switch (data.type) {
                    case 'new_message':
                        this.addMessage(data.message);
                        this.updateConversationPreview(data.message);
                        break;
                    case 'typing_start':
                        this.showTypingIndicator(data.user_name);
                        break;
                    case 'typing_stop':
                        this.hideTypingIndicator();
                        break;
                    case 'user_online':
                        this.updateUserStatus(data.user_id, true);
                        break;
                    case 'user_offline':
                        this.updateUserStatus(data.user_id, false);
                        break;
                }
            }

            setupEventListeners() {
                // Message input auto-resize and send button enable/disable
                const messageInput = document.getElementById('messageInput');
                const sendBtn = document.getElementById('sendBtn');

                if (messageInput) {
                    messageInput.addEventListener('input', (e) => {
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

                        // Enable/disable send button
                        sendBtn.disabled = !e.target.value.trim();

                        // Handle typing indicator
                        this.handleTyping();
                    });

                    messageInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (messageInput.value.trim()) {
                                document.getElementById('messageForm').dispatchEvent(new Event('submit'));
                            }
                        }
                    });
                }

                // File upload handling
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => {
                        this.handleFileUpload(e.target.files);
                    });
                }

                // Search conversations
                const chatSearch = document.getElementById('chatSearch');
                if (chatSearch) {
                    chatSearch.addEventListener('input', (e) => {
                        this.filterConversations(e.target.value);
                    });
                }

                // Mobile navigation
                document.getElementById('navToggle').addEventListener('click', function() {
                    document.getElementById('navMenu').classList.toggle('show');
                });
            }

            handleTyping() {
                if (websocket && websocket.readyState === WebSocket.OPEN && currentConversationId) {
                    if (!isTyping) {
                        websocket.send(JSON.stringify({
                            type: 'typing_start',
                            conversation_id: currentConversationId
                        }));
                        isTyping = true;
                    }

                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(() => {
                        if (websocket && websocket.readyState === WebSocket.OPEN) {
                            websocket.send(JSON.stringify({
                                type: 'typing_stop',
                                conversation_id: currentConversationId
                            }));
                        }
                        isTyping = false;
                    }, 1000);
                }
            }

            loadActiveConversation() {
                if (currentConversationId) {
                    this.loadMessages(currentConversationId);
                }
            }

            async loadMessages(conversationId) {
                try {
                    const response = await fetch(`/Laburar/api/chat/messages.php?conversation_id=${conversationId}`, {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        const messagesContainer = document.getElementById('messagesContainer');
                        messagesContainer.innerHTML = '';
                        
                        data.messages.forEach(message => {
                            this.addMessage(message, false);
                        });

                        this.scrollToBottom();
                    }
                } catch (error) {
                    console.error('Error loading messages:', error);
                }
            }

            addMessage(message, animate = true) {
                const messagesContainer = document.getElementById('messagesContainer');
                const messageEl = this.createMessageElement(message);
                
                if (animate) {
                    messageEl.style.opacity = '0';
                    messageEl.style.transform = 'translateY(20px)';
                }

                messagesContainer.appendChild(messageEl);

                if (animate) {
                    requestAnimationFrame(() => {
                        messageEl.style.transition = 'all 0.3s ease';
                        messageEl.style.opacity = '1';
                        messageEl.style.transform = 'translateY(0)';
                    });
                }

                this.scrollToBottom();
            }

            createMessageElement(message) {
                const isOwn = message.sender_id == websocketConfig.user_id;
                const messageEl = document.createElement('div');
                messageEl.className = `message ${isOwn ? 'own' : ''}`;
                
                messageEl.innerHTML = `
                    <div class="message-avatar">
                        <img src="${message.sender_avatar}" alt="${message.sender_name}">
                    </div>
                    <div class="message-content">
                        <div class="message-text">${this.formatMessage(message.content)}</div>
                        <div class="message-time">${this.formatTime(message.created_at)}</div>
                    </div>
                `;

                return messageEl;
            }

            formatMessage(content) {
                // Basic formatting: convert URLs to links, handle line breaks
                return content
                    .replace(/\n/g, '<br>')
                    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
            }

            formatTime(timestamp) {
                const date = new Date(timestamp);
                const now = new Date();
                const diff = now - date;
                
                if (diff < 24 * 60 * 60 * 1000) { // Less than 24 hours
                    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                } else {
                    return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
                }
            }

            scrollToBottom() {
                const messagesContainer = document.getElementById('messagesContainer');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            showTypingIndicator(userName) {
                const indicator = document.getElementById('typingIndicator');
                const text = document.getElementById('typingText');
                
                if (indicator && text) {
                    text.textContent = `${userName} está escribiendo...`;
                    indicator.style.display = 'block';
                    this.scrollToBottom();
                }
            }

            hideTypingIndicator() {
                const indicator = document.getElementById('typingIndicator');
                if (indicator) {
                    indicator.style.display = 'none';
                }
            }

            updateUserStatus(userId, isOnline) {
                // Update conversation list status indicators
                const conversationItems = document.querySelectorAll('.conversation-item');
                conversationItems.forEach(item => {
                    const avatar = item.querySelector('.conversation-avatar');
                    const onlineStatus = avatar.querySelector('.online-status');
                    
                    if (item.dataset.userId == userId) {
                        if (isOnline && !onlineStatus) {
                            avatar.innerHTML += '<div class="online-status"></div>';
                        } else if (!isOnline && onlineStatus) {
                            onlineStatus.remove();
                        }
                    }
                });

                // Update main chat header if it's the current conversation
                const userStatus = document.getElementById('userStatus');
                if (userStatus && currentConversationId) {
                    userStatus.textContent = isOnline ? 'En línea' : 'Desconectado';
                }
            }

            async handleFileUpload(files) {
                if (!files.length || !currentConversationId) return;

                const formData = new FormData();
                formData.append('conversation_id', currentConversationId);
                formData.append('csrf_token', '<?= $_SESSION['csrf_token'] ?>');
                
                Array.from(files).forEach(file => {
                    formData.append('files[]', file);
                });

                try {
                    const response = await fetch('/Laburar/api/chat/upload.php', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        // Files uploaded successfully, messages will be received via WebSocket
                        console.log('Files uploaded successfully');
                    } else {
                        alert('Error al subir archivos: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error uploading files:', error);
                    alert('Error al subir archivos');
                }

                // Clear file input
                document.getElementById('fileInput').value = '';
            }

            filterConversations(query) {
                const conversations = document.querySelectorAll('.conversation-item');
                conversations.forEach(item => {
                    const name = item.querySelector('.conversation-name').textContent.toLowerCase();
                    const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
                    
                    if (name.includes(query.toLowerCase()) || preview.includes(query.toLowerCase())) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }

            showLoadingIndicator() {
                document.getElementById('chatLoadingIndicator').style.display = 'flex';
            }

            hideLoadingIndicator() {
                document.getElementById('chatLoadingIndicator').style.display = 'none';
            }

            showConnectionError() {
                // Show user-friendly connection error
                console.warn('Chat connection failed, using fallback mode');
            }
        }

        // Global functions
        function sendMessage(event) {
            event.preventDefault();
            
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message || !currentConversationId) return;

            // Send via WebSocket if available, otherwise fallback to HTTP
            if (websocket && websocket.readyState === WebSocket.OPEN) {
                websocket.send(JSON.stringify({
                    type: 'send_message',
                    conversation_id: currentConversationId,
                    content: message
                }));
            } else {
                // HTTP fallback
                sendMessageHTTP(message);
            }

            messageInput.value = '';
            messageInput.style.height = 'auto';
            document.getElementById('sendBtn').disabled = true;
        }

        async function sendMessageHTTP(message) {
            try {
                const response = await fetch('/Laburar/api/chat/send.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        conversation_id: currentConversationId,
                        message: message,
                        csrf_token: '<?= $_SESSION['csrf_token'] ?>'
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    chatManager.addMessage(data.message);
                } else {
                    alert('Error al enviar mensaje: ' + data.message);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Error al enviar mensaje');
            }
        }

        function loadConversation(conversationId) {
            currentConversationId = conversationId;
            
            // Update active conversation in sidebar
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.add('active');
            
            // Load conversation messages
            chatManager.loadMessages(conversationId);
            
            // Show chat main on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('chatSidebar').classList.remove('show');
            }
        }

        function toggleUserMenu() {
            document.getElementById('userDropdown').classList.toggle('show');
        }

        function closeMobileChat() {
            if (window.innerWidth <= 768) {
                document.getElementById('chatSidebar').classList.add('show');
            }
        }

        function startVideoCall() {
            // Implementation for video call feature
            alert('Función de videollamada próximamente disponible');
        }

        function showChatSettings() {
            // Implementation for chat settings
            alert('Configuración de chat próximamente disponible');
        }

        // Initialize chat when page loads
        let chatManager;
        document.addEventListener('DOMContentLoaded', function() {
            chatManager = new ChatManager();
        });

        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            const userMenu = document.querySelector('.user-menu');
            if (!userMenu.contains(e.target)) {
                document.getElementById('userDropdown').classList.remove('show');
            }
        });
    </script>
</body>
</html>