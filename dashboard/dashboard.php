<?php
session_start();
require_once '../config/database.php';
require_once '../app/Models/User.php';
require_once '../app/Models/Service.php';
require_once '../app/Models/Badge.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    header('Location: ../public/index.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$user = new User();
$userInfo = $user->findById($user_id);

$service = new Service();
$userServices = $service->getServicesByUserId($user_id);

$badge = new Badge();
$userBadges = $badge->getUserBadges($user_id);
$availableBadges = $badge->getAvailableBadges($user_id);

// Calculate dashboard metrics
$totalEarnings = 0;
$activeProjects = 0;
$completedProjects = 0;

// Mock data for demo - replace with actual calculations
$totalEarnings = rand(500, 5000);
$activeProjects = rand(2, 8);
$completedProjects = rand(5, 25);
$monthlyGrowth = rand(5, 35);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - LaburAR</title>
    <link rel="icon" type="image/x-icon" href="../assets/img/icons/logo-32.ico">
    <link rel="apple-touch-icon" href="../assets/img/icons/logo 256.png">
    
    <!-- Core CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="../public/assets/css/liquid-glass.css" rel="stylesheet">
    <link href="../public/assets/css/badge-micro.css" rel="stylesheet">
    <link href="../public/assets/css/dashboard-modern.css" rel="stylesheet">
    
    <!-- Dashboard Specific Overrides -->
    <style>
        /* Page-specific customizations */
        .dashboard-welcome {
            background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            margin-bottom: var(--spacing-xl);
        }
        
        /* Enhanced loading states */
        .loading-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Dropdown styles for messages and notifications */
        .dropdown-menu {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(111, 191, 239, 0.3);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 0;
            margin: 8px 0;
        }
        
        .dropdown-header {
            background: rgba(111, 191, 239, 0.1);
            padding: 12px 16px;
            border-bottom: 1px solid rgba(111, 191, 239, 0.2);
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
            border-left: 3px solid #2563eb;
        }
        
        .message-dropdown-item.unread:hover,
        .notification-dropdown-item.unread:hover {
            background: rgba(111, 191, 239, 0.15);
        }
        
        .dropdown-item {
            color: #333;
            padding: 8px 16px;
        }
        
        .dropdown-item:hover {
            background: rgba(111, 191, 239, 0.1);
            color: #333;
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
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Mobile Toggle Button -->
        <button class="btn btn-primary d-md-none position-fixed" 
                style="top: 20px; left: 20px; z-index: 1100;" 
                onclick="toggleSidebar()">
            <i class="fas fa-bars"></i>
        </button>

        <!-- Sidebar -->
        <div class="dashboard-sidebar" id="sidebar">
            <div class="text-center mb-4">
                <div class="d-flex align-items-center justify-content-center mb-2">
                    <img src="../assets/img/icons/logo 256.png" alt="LaburAR Logo" style="width: 32px; height: 32px; object-fit: contain;" class="me-2">
                    <h4 class="text-primary mb-0">LaburAR</h4>
                </div>
                <p class="text-muted small">Dashboard Profesional</p>
            </div>

            <!-- User Profile Summary -->
            <div class="glass-card text-center mb-4 fade-in">
                <div class="position-relative d-inline-block mb-3">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face" 
                         class="rounded-circle" 
                         style="width: 80px; height: 80px; object-fit: cover;">
                    <span class="position-absolute bottom-0 end-0 bg-success rounded-circle p-2"></span>
                </div>
                <h6 class="mb-1"><?= htmlspecialchars($userInfo['name']) ?></h6>
                <p class="small text-muted mb-2"><?= htmlspecialchars($userInfo['email']) ?></p>
                <div class="badge-showcase justify-content-center">
                    <?php if (!empty($userBadges)): ?>
                        <?php foreach (array_slice($userBadges, 0, 3) as $badge): ?>
                            <div class="badge-item" title="<?= htmlspecialchars($badge['name']) ?>">
                                <div class="badge-icon-<?= $badge['rarity'] ?>">
                                    <i class="fas fa-<?= $badge['icon'] ?>"></i>
                                </div>
                            </div>
                        <?php endforeach; ?>
                        <?php if (count($userBadges) > 3): ?>
                            <span class="small text-muted">+<?= count($userBadges) - 3 ?> más</span>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Navigation -->
            <nav>
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a href="#" class="nav-link active">
                            <i class="fas fa-tachometer-alt"></i>
                            Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-briefcase"></i>
                            Mis Servicios
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-project-diagram"></i>
                            Proyectos
                        </a>
                    </li>
                    <li class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-comments"></i>
                            Mensajes
                            <span class="badge bg-danger ms-auto">2</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end" style="width: 320px; max-height: 400px; overflow-y: auto;">
                            <div class="dropdown-header">
                                <h6 class="mb-0">Mensajes Recientes</h6>
                            </div>
                            <div class="dropdown-divider"></div>
                            
                            <div class="dropdown-item-text message-dropdown-item unread" data-message-id="1">
                                <div class="d-flex align-items-start">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="Avatar" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between">
                                            <strong style="font-size: 13px;">Carlos Mendoza</strong>
                                            <small class="text-muted">2 min</small>
                                        </div>
                                        <div style="font-size: 12px;" class="text-muted mb-1">Consulta sobre diseño de logo</div>
                                        <div style="font-size: 11px;" class="text-muted">Hola, me interesa tu servicio de diseño...</div>
                                    </div>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            
                            <div class="dropdown-item-text message-dropdown-item unread" data-message-id="2">
                                <div class="d-flex align-items-start">
                                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" alt="Avatar" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between">
                                            <strong style="font-size: 13px;">Ana Ruiz</strong>
                                            <small class="text-muted">1 hora</small>
                                        </div>
                                        <div style="font-size: 12px;" class="text-muted mb-1">Entrega del proyecto web</div>
                                        <div style="font-size: 11px;" class="text-muted">Perfecto el trabajo, muchas gracias por...</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="dropdown-divider"></div>
                            <div class="dropdown-item text-center" onclick="markAllMessagesAsRead()">
                                <i class="fas fa-check-double me-2 text-success"></i>Marcar como visto
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="dropdown-item text-center">
                                <a href="#" class="text-primary">Ver todos los mensajes</a>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown">
                        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-bell"></i>
                            Notificaciones
                            <span class="badge bg-info ms-auto">3</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end" style="width: 320px; max-height: 400px; overflow-y: auto;">
                            <div class="dropdown-header">
                                <h6 class="mb-0">Notificaciones</h6>
                            </div>
                            <div class="dropdown-divider"></div>
                            
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
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-wallet"></i>
                            Finanzas
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-trophy"></i>
                            Badges
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="fas fa-cog"></i>
                            Configuración
                        </a>
                    </li>
                    <li class="nav-item mt-3">
                        <a href="../public/logout.php" class="nav-link text-danger">
                            <i class="fas fa-sign-out-alt"></i>
                            Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </nav>
        </div>

        <!-- Main Content -->
        <main class="dashboard-main">
            <!-- Welcome Header -->
            <div class="mb-4 fade-in">
                <h1 class="dashboard-title">¡Hola, <?= htmlspecialchars(explode(' ', $userInfo['name'])[0]) ?>!</h1>
                <p class="text-muted">Aquí tienes un resumen de tu actividad en LaburAR</p>
            </div>

            <!-- Metrics Row -->
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="metric-card slide-up" style="animation-delay: 0.1s">
                        <div class="metric-trend">+<?= $monthlyGrowth ?>%</div>
                        <div class="metric-value">$<?= number_format($totalEarnings) ?></div>
                        <div class="metric-label">Ganancias Totales</div>
                        <div class="progress-modern mt-3">
                            <div class="progress-bar-modern" style="width: 75%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="metric-card slide-up" style="animation-delay: 0.2s">
                        <div class="metric-value"><?= $activeProjects ?></div>
                        <div class="metric-label">Proyectos Activos</div>
                        <div class="progress-modern mt-3">
                            <div class="progress-bar-modern" style="width: 60%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="metric-card slide-up" style="animation-delay: 0.3s">
                        <div class="metric-value"><?= $completedProjects ?></div>
                        <div class="metric-label">Completados</div>
                        <div class="progress-modern mt-3">
                            <div class="progress-bar-modern" style="width: 90%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="metric-card slide-up" style="animation-delay: 0.4s">
                        <div class="metric-value">98%</div>
                        <div class="metric-label">Satisfacción</div>
                        <div class="progress-modern mt-3">
                            <div class="progress-bar-modern" style="width: 98%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="glass-card bounce-in">
                        <h5 class="section-title">Acciones Rápidas</h5>
                        <div class="row">
                            <div class="col-md-3 col-sm-6 mb-3">
                                <button class="btn btn-modern w-100">
                                    <i class="fas fa-plus me-2"></i>
                                    Nuevo Servicio
                                </button>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <button class="btn btn-modern w-100">
                                    <i class="fas fa-eye me-2"></i>
                                    Ver Propuestas
                                </button>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <button class="btn btn-modern w-100">
                                    <i class="fas fa-edit me-2"></i>
                                    Editar Perfil
                                </button>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <button class="btn btn-modern w-100">
                                    <i class="fas fa-chart-line me-2"></i>
                                    Estadísticas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Services and Badges Row -->
            <div class="row">
                <!-- My Services -->
                <div class="col-lg-8 mb-4">
                    <div class="glass-card slide-up">
                        <h5 class="section-title">Mis Servicios</h5>
                        <?php if (!empty($userServices)): ?>
                            <div class="row">
                                <?php foreach ($userServices as $service): ?>
                                    <div class="col-md-6 mb-3">
                                        <div class="service-card">
                                            <div class="service-title"><?= htmlspecialchars($service['title']) ?></div>
                                            <p class="text-muted small mb-2"><?= htmlspecialchars(substr($service['description'], 0, 80)) ?>...</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span class="service-price">$<?= number_format($service['price']) ?></span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary btn-sm">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success btn-sm">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="text-center py-5">
                                <i class="fas fa-briefcase text-muted" style="font-size: 3rem; opacity: 0.3;"></i>
                                <h6 class="text-muted mt-3">No tienes servicios publicados</h6>
                                <p class="text-muted">¡Crea tu primer servicio para empezar a ganar!</p>
                                <button class="btn btn-modern">
                                    <i class="fas fa-plus me-2"></i>
                                    Crear Primer Servicio
                                </button>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Badges Section -->
                <div class="col-lg-4 mb-4">
                    <div class="glass-card slide-up">
                        <h5 class="section-title">Mis Badges</h5>
                        <?php if (!empty($userBadges)): ?>
                            <div class="badge-showcase mb-3">
                                <?php foreach ($userBadges as $badge): ?>
                                    <div class="badge-item" 
                                         title="<?= htmlspecialchars($badge['name']) ?>: <?= htmlspecialchars($badge['description']) ?>">
                                        <div class="badge-icon-<?= $badge['rarity'] ?>">
                                            <i class="fas fa-<?= $badge['icon'] ?>"></i>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <p class="text-muted small">
                                Has obtenido <?= count($userBadges) ?> badge(s). 
                                ¡Sigue trabajando para desbloquear más!
                            </p>
                        <?php else: ?>
                            <div class="text-center py-3">
                                <i class="fas fa-trophy text-muted" style="font-size: 2rem; opacity: 0.3;"></i>
                                <p class="text-muted mt-2 mb-0">No tienes badges aún</p>
                                <small class="text-muted">Completa proyectos para obtener tu primer badge</small>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($availableBadges)): ?>
                            <hr>
                            <h6 class="text-muted">Próximos Objetivos</h6>
                            <div class="badge-showcase">
                                <?php foreach (array_slice($availableBadges, 0, 6) as $badge): ?>
                                    <div class="badge-item opacity-50" 
                                         title="<?= htmlspecialchars($badge['name']) ?>: <?= htmlspecialchars($badge['description']) ?>">
                                        <div class="badge-icon-<?= $badge['rarity'] ?>">
                                            <i class="fas fa-<?= $badge['icon'] ?>"></i>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="row">
                <div class="col-12">
                    <div class="glass-card fade-in">
                        <h5 class="section-title">Actividad Reciente</h5>
                        <div class="timeline">
                            <div class="timeline-item py-3 border-bottom">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                             style="width: 40px; height: 40px;">
                                            <i class="fas fa-check text-white"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h6 class="mb-1">Proyecto completado</h6>
                                        <p class="text-muted small mb-0">Has completado "Diseño de logo empresarial"</p>
                                    </div>
                                    <div class="col-auto">
                                        <small class="text-muted">Hace 2 horas</small>
                                    </div>
                                </div>
                            </div>
                            <div class="timeline-item py-3 border-bottom">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <div class="rounded-circle bg-success d-flex align-items-center justify-content-center" 
                                             style="width: 40px; height: 40px;">
                                            <i class="fas fa-trophy text-white"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h6 class="mb-1">¡Nuevo badge obtenido!</h6>
                                        <p class="text-muted small mb-0">Has desbloqueado el badge "Fundador #47"</p>
                                    </div>
                                    <div class="col-auto">
                                        <small class="text-muted">Hace 1 día</small>
                                    </div>
                                </div>
                            </div>
                            <div class="timeline-item py-3">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <div class="rounded-circle bg-info d-flex align-items-center justify-content-center" 
                                             style="width: 40px; height: 40px;">
                                            <i class="fas fa-star text-white"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h6 class="mb-1">Nueva reseña recibida</h6>
                                        <p class="text-muted small mb-0">María González te ha dado 5 estrellas</p>
                                    </div>
                                    <div class="col-auto">
                                        <small class="text-muted">Hace 3 días</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../public/assets/js/dashboard-interactions.js"></script>
    
    <script>
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
            const dropdowns = document.querySelectorAll('.nav-item.dropdown .dropdown-menu');
            const notificationDropdown = dropdowns[1]; // Second dropdown (notifications)
            if (notificationDropdown && notificationDropdown.classList.contains('show')) {
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