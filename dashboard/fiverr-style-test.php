<?php
/**
 * LaburAR Dashboard Test - Inspirado en Fiverr Dashboard
 * Página de prueba implementando features modernas de dashboard
 * 
 * @package LaburAR
 * @version 2.0
 * @author Claude Code Integration
 */

session_start();

// Mock data para testing
$userData = [
    'id' => 1,
    'first_name' => 'María',
    'last_name' => 'González',
    'email' => 'maria@laburar.com',
    'profile_image' => '../public/assets/img/avatars/default-female.png',
    'seller_level' => 'Nivel 2',
    'success_score' => 87,
    'rating' => 4.9,
    'response_rate' => 95,
    'response_time' => '2 horas',
    'total_orders' => 156,
    'active_orders' => 3,
    'completed_orders' => 148,
    'cancelled_orders' => 5
];

$earnings = [
    'total_earnings' => 45750.00,
    'this_month' => 3420.50,
    'pending_earnings' => 1250.00,
    'available_earnings' => 2170.50,
    'avg_order_value' => 293.59
];

$gigs = [
    [
        'id' => 1,
        'title' => 'Diseño de Logo Profesional',
        'image' => '../public/assets/img/gigs/logo-design.jpg',
        'price' => 2500,
        'orders_in_queue' => 2,
        'impressions' => 1250,
        'clicks' => 89,
        'views' => 567,
        'status' => 'active',
        'rating' => 5.0,
        'reviews' => 42
    ],
    [
        'id' => 2,
        'title' => 'Desarrollo Web Frontend',
        'image' => '../public/assets/img/gigs/web-dev.jpg',
        'price' => 15000,
        'orders_in_queue' => 1,
        'impressions' => 890,
        'clicks' => 45,
        'views' => 234,
        'status' => 'active',
        'rating' => 4.8,
        'reviews' => 28
    ],
    [
        'id' => 3,
        'title' => 'Marketing Digital Completo',
        'image' => '../public/assets/img/gigs/marketing.jpg',
        'price' => 8500,
        'orders_in_queue' => 0,
        'impressions' => 567,
        'clicks' => 23,
        'views' => 123,
        'status' => 'paused',
        'rating' => 4.7,
        'reviews' => 15
    ]
];

$messages = [
    [
        'from' => 'Carlos Mendoza',
        'subject' => 'Consulta sobre diseño de logo',
        'preview' => 'Hola María, me interesa tu servicio de diseño...',
        'time' => '2 min',
        'unread' => true,
        'avatar' => '../public/assets/img/avatars/user1.jpg'
    ],
    [
        'from' => 'Ana Ruiz',
        'subject' => 'Entrega del proyecto web',
        'preview' => 'Perfecto el trabajo, muchas gracias por...',
        'time' => '1 hora',
        'unread' => false,
        'avatar' => '../public/assets/img/avatars/user2.jpg'
    ]
];

$todos = [
    ['task' => 'Responder a 3 mensajes pendientes', 'priority' => 'high', 'due' => 'Hoy'],
    ['task' => 'Entregar diseño de logo - Proyecto #156', 'priority' => 'high', 'due' => 'Mañana'],
    ['task' => 'Actualizar portfolio con nuevos trabajos', 'priority' => 'medium', 'due' => 'Esta semana'],
    ['task' => 'Crear nuevo gig de diseño UI/UX', 'priority' => 'low', 'due' => 'Próxima semana']
];
?>

<!DOCTYPE html>
<html lang="es-AR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Estilo Fiverr - LaburAR Test</title>
    
    <!-- LaburAR Core Styles -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Lexend+Giga:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- LaburAR Custom Styles -->
    <link href="../public/assets/css/main.css" rel="stylesheet">
    <link href="../public/assets/css/landing.css" rel="stylesheet">
    <link href="../public/assets/css/glass-effects-advanced.css" rel="stylesheet">
    <link href="../public/assets/css/badge-micro.css" rel="stylesheet">
    
    <style>
        :root {
            /* Fiverr-inspired colors with LaburAR identity */
            --fiverr-green: #1dbf73;
            --fiverr-dark: #404145;
            --fiverr-gray: #74767e;
            --fiverr-light-gray: #f7f7f7;
            --fiverr-white: #ffffff;
            
            /* LaburAR colors override */
            --dashboard-primary: var(--color-primary-blue, #6FBFEF);
            --dashboard-secondary: var(--color-primary-white, #ffffff);
            --dashboard-accent: var(--color-accent-gold, #FFD700);
            --dashboard-success: var(--fiverr-green);
            --dashboard-dark: var(--fiverr-dark);
            --dashboard-text: var(--fiverr-dark);
            
            /* Ultra frost effects */
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(111, 191, 239, 0.3);
            --glass-shadow: 0 20px 70px rgba(111, 191, 239, 0.3);
            --frost-blur: blur(50px);
            --frost-saturate: saturate(200%);
        }
        
        body {
            background: linear-gradient(135deg, var(--dashboard-primary) 0%, var(--dashboard-secondary) 50%, #f0f9ff 100%);
            min-height: 100vh;
            font-family: var(--font-family, 'Inter', system-ui, sans-serif);
            color: var(--dashboard-text);
            font-size: 14px;
        }
        
        /* Fiverr-style layout */
        .fiverr-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .sidebar-fiverr {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            width: 280px;
            background: var(--glass-bg);
            backdrop-filter: var(--frost-blur) var(--frost-saturate);
            -webkit-backdrop-filter: var(--frost-blur) var(--frost-saturate);
            border-right: 2px solid var(--glass-border);
            z-index: 1000;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-content {
            margin-left: 280px;
            padding: 20px;
            min-height: 100vh;
        }
        
        /* Profile header */
        .profile-header {
            background: var(--glass-bg);
            backdrop-filter: var(--frost-blur) var(--frost-saturate);
            -webkit-backdrop-filter: var(--frost-blur) var(--frost-saturate);
            border: 2px solid var(--glass-border);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: var(--glass-shadow);
            position: relative;
            overflow: hidden;
        }
        
        .profile-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--dashboard-primary), var(--dashboard-accent), var(--dashboard-success));
        }
        
        .profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid var(--dashboard-primary);
            object-fit: cover;
        }
        
        .level-badge {
            background: var(--dashboard-success);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .success-score {
            font-size: 24px;
            font-weight: 700;
            color: var(--dashboard-success);
        }
        
        /* Fiverr-style cards */
        .fiverr-card {
            background: var(--glass-bg);
            backdrop-filter: var(--frost-blur) var(--frost-saturate);
            -webkit-backdrop-filter: var(--frost-blur) var(--frost-saturate);
            border: 2px solid var(--glass-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: var(--glass-shadow);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .fiverr-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
        }
        
        .fiverr-card:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 25px 60px rgba(111, 191, 239, 0.4);
            border-color: var(--dashboard-primary);
        }
        
        /* Gig cards */
        .gig-card {
            background: var(--glass-bg);
            backdrop-filter: var(--frost-blur) var(--frost-saturate);
            -webkit-backdrop-filter: var(--frost-blur) var(--frost-saturate);
            border: 2px solid var(--glass-border);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: var(--glass-shadow);
        }
        
        .gig-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 30px 70px rgba(111, 191, 239, 0.5);
        }
        
        .gig-image {
            width: 100%;
            height: 160px;
            object-fit: cover;
        }
        
        .gig-content {
            padding: 16px;
        }
        
        .gig-price {
            font-size: 18px;
            font-weight: 700;
            color: var(--dashboard-success);
        }
        
        .gig-stats {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--dashboard-gray);
            margin-top: 8px;
        }
        
        /* Messages */
        .message-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .message-item:hover {
            background: rgba(111, 191, 239, 0.1);
        }
        
        .message-item.unread {
            background: rgba(29, 191, 115, 0.1);
            border-left: 3px solid var(--dashboard-success);
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        /* Todo items */
        .todo-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(111, 191, 239, 0.2);
        }
        
        .todo-priority {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .todo-priority.high { background: #ff4757; }
        .todo-priority.medium { background: #ffa502; }
        .todo-priority.low { background: #2ed573; }
        
        /* Dropdown styles for messages and notifications */
        .dropdown-menu {
            background: var(--glass-bg);
            backdrop-filter: var(--frost-blur) var(--frost-saturate);
            -webkit-backdrop-filter: var(--frost-blur) var(--frost-saturate);
            border: 2px solid var(--glass-border);
            border-radius: 12px;
            box-shadow: var(--glass-shadow);
            padding: 0;
            margin: 8px 0;
        }
        
        .dropdown-header {
            background: rgba(111, 191, 239, 0.1);
            padding: 12px 16px;
            border-bottom: 1px solid var(--glass-border);
            margin: 0;
            border-radius: 12px 12px 0 0;
        }
        
        .dropdown-divider {
            border-top: 1px solid rgba(111, 191, 239, 0.2);
            margin: 0;
        }
        
        .message-dropdown-item,
        .notification-dropdown-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            border: none;
            background: transparent;
        }
        
        .message-dropdown-item:hover,
        .notification-dropdown-item:hover {
            background: rgba(111, 191, 239, 0.1);
        }
        
        .message-dropdown-item.unread,
        .notification-dropdown-item.unread {
            background: rgba(111, 191, 239, 0.05);
            border-left: 3px solid var(--dashboard-primary);
        }
        
        .message-dropdown-item.unread:hover,
        .notification-dropdown-item.unread:hover {
            background: rgba(111, 191, 239, 0.15);
        }
        
        .dropdown-item {
            color: var(--dashboard-text);
            padding: 8px 16px;
        }
        
        .dropdown-item:hover {
            background: rgba(111, 191, 239, 0.1);
            color: var(--dashboard-text);
        }
        
        /* Badge positioning adjustments */
        .nav-link .badge {
            font-size: 10px;
            padding: 4px 6px;
            min-width: 18px;
        }
        
        .nav-link .badge[style*="display: none"] {
            display: none !important;
        }
        
        /* Stats widgets */
        .stat-widget {
            text-align: center;
            padding: 16px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--dashboard-primary);
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--dashboard-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Navigation styles */
        .nav-item {
            margin-bottom: 8px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: var(--dashboard-dark);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        
        .nav-link:hover,
        .nav-link.active {
            background: var(--dashboard-primary);
            color: white;
            transform: translateX(4px);
        }
        
        .nav-section {
            margin-bottom: 32px;
        }
        
        .nav-section h6 {
            color: var(--dashboard-gray);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .sidebar-fiverr {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .sidebar-fiverr.open {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
        }
        
        /* Quick actions */
        .quick-action {
            background: var(--dashboard-primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .quick-action:hover {
            background: var(--dashboard-success);
            transform: translateY(-2px);
        }
        
        .quick-action.secondary {
            background: transparent;
            color: var(--dashboard-primary);
            border: 2px solid var(--dashboard-primary);
        }
        
        .quick-action.secondary:hover {
            background: var(--dashboard-primary);
            color: white;
        }
    </style>
</head>
<body>
    <!-- Sidebar Navigation -->
    <div class="sidebar-fiverr">
        <!-- Brand -->
        <div class="mb-4">
            <a href="../index.php" class="d-flex align-items-center gap-2 text-decoration-none">
                <img src="../public/assets/img/icons/logo 64.png" alt="LaburAR" style="width: 32px; height: 32px;">
                <span style="font-family: 'Lexend Giga', sans-serif; font-weight: 700; color: #000; font-size: 1.2rem;">LABUR.AR</span>
            </a>
        </div>
        
        <!-- Main Navigation -->
        <div class="nav-section">
            <h6>Dashboard</h6>
            <div class="nav-item">
                <a href="#" class="nav-link active">
                    <i class="fas fa-home"></i>
                    <span>Resumen</span>
                </a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-chart-bar"></i>
                    <span>Analytics</span>
                </a>
            </div>
        </div>
        
        <!-- Selling -->
        <div class="nav-section">
            <h6>Vendiendo</h6>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-briefcase"></i>
                    <span>Mis Servicios</span>
                    <span class="ms-auto badge bg-primary"><?= count($gigs) ?></span>
                </a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Órdenes Activas</span>
                    <span class="ms-auto badge bg-success"><?= $userData['active_orders'] ?></span>
                </a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-dollar-sign"></i>
                    <span>Ganancias</span>
                </a>
            </div>
        </div>
        
        <!-- Communication -->
        <div class="nav-section">
            <h6>Comunicación</h6>
            <!-- Messages Dropdown -->
            <div class="nav-item dropdown">
                <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-envelope"></i>
                    <span>Mensajes</span>
                    <span class="ms-auto badge bg-danger">2</span>
                </a>
                <div class="dropdown-menu dropdown-menu-end" style="width: 320px; max-height: 400px; overflow-y: auto;">
                    <div class="dropdown-header">
                        <h6 class="mb-0">Mensajes Recientes</h6>
                    </div>
                    <div class="dropdown-divider"></div>
                    <?php foreach ($messages as $index => $message): ?>
                    <div class="dropdown-item-text message-dropdown-item <?= $message['unread'] ? 'unread' : '' ?>" data-message-id="<?= $index ?>">
                        <div class="d-flex align-items-start">
                            <img src="<?= $message['avatar'] ?>" alt="Avatar" class="rounded-circle me-2" style="width: 40px; height: 40px;" onerror="this.src='../public/assets/img/avatars/default.png'">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <strong style="font-size: 13px;"><?= $message['from'] ?></strong>
                                    <small class="text-muted"><?= $message['time'] ?></small>
                                </div>
                                <div style="font-size: 12px;" class="text-muted mb-1"><?= $message['subject'] ?></div>
                                <div style="font-size: 11px;" class="text-muted"><?= substr($message['preview'], 0, 60) ?>...</div>
                            </div>
                        </div>
                    </div>
                    <?php if ($index < count($messages) - 1): ?>
                    <div class="dropdown-divider"></div>
                    <?php endif; ?>
                    <?php endforeach; ?>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item text-center" onclick="markAllMessagesAsRead()">
                        <i class="fas fa-check-double me-2 text-success"></i>Marcar como visto
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item text-center">
                        <a href="#" class="text-primary">Ver todos los mensajes</a>
                    </div>
                </div>
            </div>
            
            <!-- Notifications Dropdown -->
            <div class="nav-item dropdown">
                <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-bell"></i>
                    <span>Notificaciones</span>
                    <span class="ms-auto badge bg-info">3</span>
                </a>
                <div class="dropdown-menu dropdown-menu-end" style="width: 320px; max-height: 400px; overflow-y: auto;">
                    <div class="dropdown-header">
                        <h6 class="mb-0">Notificaciones</h6>
                    </div>
                    <div class="dropdown-divider"></div>
                    
                    <!-- Sample notifications -->
                    <div class="dropdown-item-text notification-dropdown-item unread" data-notification-id="1">
                        <div class="d-flex align-items-start">
                            <div class="notification-icon bg-success text-white rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px; font-size: 14px;">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <strong style="font-size: 13px;">Proyecto completado</strong>
                                    <small class="text-muted">2 min</small>
                                </div>
                                <div style="font-size: 12px;" class="text-muted">Tu proyecto "Diseño de Logo" ha sido marcado como completado</div>
                            </div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    
                    <div class="dropdown-item-text notification-dropdown-item unread" data-notification-id="2">
                        <div class="d-flex align-items-start">
                            <div class="notification-icon bg-warning text-white rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px; font-size: 14px;">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <strong style="font-size: 13px;">Nueva reseña recibida</strong>
                                    <small class="text-muted">15 min</small>
                                </div>
                                <div style="font-size: 12px;" class="text-muted">Carlos M. te ha dejado una reseña de 5 estrellas</div>
                            </div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    
                    <div class="dropdown-item-text notification-dropdown-item unread" data-notification-id="3">
                        <div class="d-flex align-items-start">
                            <div class="notification-icon bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 35px; height: 35px; font-size: 14px;">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <strong style="font-size: 13px;">Nuevo pedido</strong>
                                    <small class="text-muted">1 hora</small>
                                </div>
                                <div style="font-size: 12px;" class="text-muted">Ana R. ha solicitado tu servicio de desarrollo web</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item text-center" onclick="markAllNotificationsAsRead()">
                        <i class="fas fa-check-double me-2 text-success"></i>Marcar como visto
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item text-center">
                        <a href="#" class="text-primary">Ver todas las notificaciones</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Account -->
        <div class="nav-section">
            <h6>Cuenta</h6>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-user"></i>
                    <span>Mi Perfil</span>
                </a>
            </div>
            <div class="nav-item">
                <a href="#" class="nav-link">
                    <i class="fas fa-cog"></i>
                    <span>Configuración</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Mobile menu toggle -->
        <button class="btn btn-primary d-md-none mb-3" onclick="toggleSidebar()">
            <i class="fas fa-bars"></i> Menú
        </button>
        
        <!-- Profile Header -->
        <div class="profile-header">
            <div class="row align-items-center">
                <div class="col-md-3 text-center text-md-start">
                    <img src="<?= $userData['profile_image'] ?>" alt="Profile" class="profile-avatar mb-2">
                    <h4 class="mb-0"><?= $userData['first_name'] . ' ' . $userData['last_name'] ?></h4>
                    <div class="level-badge mt-1"><?= $userData['seller_level'] ?></div>
                </div>
                <div class="col-md-6">
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="success-score"><?= $userData['success_score'] ?></div>
                            <small class="text-muted">Puntaje de Éxito</small>
                        </div>
                        <div class="col-3">
                            <div class="success-score"><?= $userData['rating'] ?> ★</div>
                            <small class="text-muted">Rating</small>
                        </div>
                        <div class="col-3">
                            <div class="success-score"><?= $userData['response_rate'] ?>%</div>
                            <small class="text-muted">Respuesta</small>
                        </div>
                        <div class="col-3">
                            <div class="success-score"><?= $userData['response_time'] ?></div>
                            <small class="text-muted">Tiempo</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 text-center text-md-end">
                    <button class="quick-action mb-2">
                        <i class="fas fa-plus me-2"></i>Nuevo Servicio
                    </button>
                    <br>
                    <button class="quick-action secondary">
                        <i class="fas fa-chart-line me-2"></i>Ver Analytics
                    </button>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Left Column -->
            <div class="col-lg-8">
                <!-- Earnings Overview -->
                <div class="fiverr-card">
                    <h5 class="mb-3"><i class="fas fa-dollar-sign me-2"></i>Resumen de Ganancias</h5>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-widget">
                                <div class="stat-value">$<?= number_format($earnings['total_earnings'], 0) ?></div>
                                <div class="stat-label">Total Ganado</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-widget">
                                <div class="stat-value">$<?= number_format($earnings['this_month'], 0) ?></div>
                                <div class="stat-label">Este Mes</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-widget">
                                <div class="stat-value">$<?= number_format($earnings['available_earnings'], 0) ?></div>
                                <div class="stat-label">Disponible</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-widget">
                                <div class="stat-value">$<?= number_format($earnings['avg_order_value'], 0) ?></div>
                                <div class="stat-label">Promedio Orden</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Gigs -->
                <div class="fiverr-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5><i class="fas fa-briefcase me-2"></i>Mis Servicios Activos</h5>
                        <button class="btn btn-sm btn-outline-primary">Gestionar Todo</button>
                    </div>
                    <div class="row">
                        <?php foreach ($gigs as $gig): ?>
                        <div class="col-md-4 mb-3">
                            <div class="gig-card">
                                <img src="<?= $gig['image'] ?>" alt="<?= $gig['title'] ?>" class="gig-image" 
                                     onerror="this.src='../public/assets/img/placeholder-gig.jpg'">
                                <div class="gig-content">
                                    <h6 class="mb-2"><?= $gig['title'] ?></h6>
                                    <div class="gig-price mb-2">$<?= number_format($gig['price'], 0) ?></div>
                                    <div class="gig-stats">
                                        <span><i class="fas fa-shopping-cart"></i> <?= $gig['orders_in_queue'] ?> en cola</span>
                                        <span><i class="fas fa-eye"></i> <?= $gig['views'] ?></span>
                                        <span><i class="fas fa-star"></i> <?= $gig['rating'] ?></span>
                                    </div>
                                    <div class="mt-2">
                                        <span class="badge <?= $gig['status'] === 'active' ? 'bg-success' : 'bg-warning' ?>">
                                            <?= ucfirst($gig['status']) ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Recent Orders -->
                <div class="fiverr-card">
                    <h5 class="mb-3"><i class="fas fa-shopping-cart me-2"></i>Órdenes Recientes</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Servicio</th>
                                    <th>Estado</th>
                                    <th>Valor</th>
                                    <th>Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Carlos M.</td>
                                    <td>Diseño de Logo</td>
                                    <td><span class="badge bg-warning">En Progreso</span></td>
                                    <td>$2,500</td>
                                    <td>2 días</td>
                                </tr>
                                <tr>
                                    <td>Ana R.</td>
                                    <td>Web Frontend</td>
                                    <td><span class="badge bg-info">Revisión</span></td>
                                    <td>$15,000</td>
                                    <td>1 día</td>
                                </tr>
                                <tr>
                                    <td>Luis P.</td>
                                    <td>Marketing Digital</td>
                                    <td><span class="badge bg-success">Completado</span></td>
                                    <td>$8,500</td>
                                    <td>Entregado</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="col-lg-4">
                <!-- Messages -->
                <div class="fiverr-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6><i class="fas fa-envelope me-2"></i>Mensajes</h6>
                        <a href="#" class="text-primary">Ver todos</a>
                    </div>
                    <?php foreach ($messages as $message): ?>
                    <div class="message-item <?= $message['unread'] ? 'unread' : '' ?>">
                        <img src="<?= $message['avatar'] ?>" alt="Avatar" class="message-avatar"
                             onerror="this.src='../public/assets/img/avatars/default.png'">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <strong style="font-size: 13px;"><?= $message['from'] ?></strong>
                                <small class="text-muted"><?= $message['time'] ?></small>
                            </div>
                            <div style="font-size: 12px;" class="text-muted"><?= $message['subject'] ?></div>
                            <div style="font-size: 11px;" class="text-muted"><?= substr($message['preview'], 0, 40) ?>...</div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <!-- To-Do List -->
                <div class="fiverr-card">
                    <h6 class="mb-3"><i class="fas fa-tasks me-2"></i>Tareas Pendientes</h6>
                    <?php foreach ($todos as $todo): ?>
                    <div class="todo-item">
                        <div class="todo-priority <?= $todo['priority'] ?>"></div>
                        <div class="flex-grow-1">
                            <div style="font-size: 13px;"><?= $todo['task'] ?></div>
                            <small class="text-muted"><?= $todo['due'] ?></small>
                        </div>
                        <input type="checkbox" class="form-check-input">
                    </div>
                    <?php endforeach; ?>
                </div>

                <!-- Performance Stats -->
                <div class="fiverr-card">
                    <h6 class="mb-3"><i class="fas fa-chart-bar me-2"></i>Rendimiento</h6>
                    <div class="row text-center">
                        <div class="col-6 mb-3">
                            <div class="stat-value" style="font-size: 20px;"><?= $userData['total_orders'] ?></div>
                            <div class="stat-label">Total Órdenes</div>
                        </div>
                        <div class="col-6 mb-3">
                            <div class="stat-value" style="font-size: 20px;"><?= $userData['completed_orders'] ?></div>
                            <div class="stat-label">Completadas</div>
                        </div>
                        <div class="col-6">
                            <div class="stat-value" style="font-size: 20px;"><?= $userData['response_rate'] ?>%</div>
                            <div class="stat-label">Tasa Respuesta</div>
                        </div>
                        <div class="col-6">
                            <div class="stat-value" style="font-size: 20px;"><?= $userData['rating'] ?></div>
                            <div class="stat-label">Rating</div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="fiverr-card">
                    <h6 class="mb-3"><i class="fas fa-bolt me-2"></i>Acciones Rápidas</h6>
                    <div class="d-grid gap-2">
                        <button class="quick-action">
                            <i class="fas fa-plus me-2"></i>Crear Nuevo Servicio
                        </button>
                        <button class="quick-action secondary">
                            <i class="fas fa-bullhorn me-2"></i>Promover Servicios
                        </button>
                        <button class="quick-action secondary">
                            <i class="fas fa-download me-2"></i>Descargar Reporte
                        </button>
                        <button class="quick-action secondary">
                            <i class="fas fa-user-edit me-2"></i>Editar Perfil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        function toggleSidebar() {
            document.querySelector('.sidebar-fiverr').classList.toggle('open');
        }
        
        // Auto-hide sidebar on mobile when clicking outside
        document.addEventListener('click', function(e) {
            const sidebar = document.querySelector('.sidebar-fiverr');
            const toggleBtn = document.querySelector('[onclick="toggleSidebar()"]');
            
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Add loading states to buttons
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cargando...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            });
        });
        
        // Mark all messages as read function
        function markAllMessagesAsRead() {
            // Remove unread class from all message items
            document.querySelectorAll('.message-dropdown-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update badge count
            const messagesBadge = document.querySelector('.nav-link .badge.bg-danger');
            if (messagesBadge) {
                messagesBadge.textContent = '0';
                messagesBadge.style.display = 'none';
            }
            
            // Show success notification
            showNotification('Todos los mensajes han sido marcados como leídos', 'success');
            
            // Close dropdown
            const dropdown = document.querySelector('.nav-item.dropdown .dropdown-menu');
            if (dropdown && dropdown.classList.contains('show')) {
                bootstrap.Dropdown.getInstance(document.querySelector('.nav-item.dropdown .dropdown-toggle')).hide();
            }
        }
        
        // Mark all notifications as read function
        function markAllNotificationsAsRead() {
            // Remove unread class from all notification items
            document.querySelectorAll('.notification-dropdown-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update badge count
            const notificationsBadge = document.querySelector('.nav-link .badge.bg-info');
            if (notificationsBadge) {
                notificationsBadge.textContent = '0';
                notificationsBadge.style.display = 'none';
            }
            
            // Show success notification
            showNotification('Todas las notificaciones han sido marcadas como leídas', 'success');
            
            // Close dropdown
            const dropdown = document.querySelectorAll('.nav-item.dropdown .dropdown-menu')[1];
            if (dropdown && dropdown.classList.contains('show')) {
                const notificationToggle = document.querySelectorAll('.nav-item.dropdown .dropdown-toggle')[1];
                bootstrap.Dropdown.getInstance(notificationToggle).hide();
            }
        }
        
        // Show notification function
        function showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            // Add to body
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }
    </script>
</body>
</html>