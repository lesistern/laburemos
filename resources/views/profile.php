<?php
/**
 * LaburAR - Profile Page
 * Dynamic user profile with real-time data, portfolio management and verification
 * 
 * @author LaburAR Team
 * @version 2.0
 * @features Real user data, portfolio management, verification system, reviews
 * @since 2025-07-24
 */

// Security headers and initialization
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../components/TrustBadgeComponent.php';
require_once __DIR__ . '/../components/ArgentineBusinessFeatures.php';

// Check if user is authenticated
if (!isset($_SESSION['user_id']) || !isset($_SESSION['auth_token'])) {
    header('Location: /Laburar/login.php');
    exit;
}

// Get profile ID from URL (for viewing other profiles) or use current user
$profile_user_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? $_SESSION['user_id'];
$is_own_profile = ($profile_user_id == $_SESSION['user_id']);

// Get user profile data
try {
    $profileController = new \LaburAR\Controllers\ProfileController();
    $profile_data = $profileController->getProfile($profile_user_id);
    
    if (!$profile_data['success']) {
        header('Location: /Laburar/404.php');
        exit;
    }
    
    $user = $profile_data['user'];
    $portfolio_items = $profile_data['portfolio'] ?? [];
    $reviews = $profile_data['reviews'] ?? [];
    $services = $profile_data['services'] ?? [];
    $stats = $profile_data['stats'] ?? [];
    
} catch (Exception $e) {
    error_log('Profile page error: ' . $e->getMessage());
    header('Location: /Laburar/500.php');
    exit;
}

// Handle profile updates (only for own profile)
$success_message = '';
$error_message = '';

if ($is_own_profile && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF validation
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error_message = 'Token de seguridad inválido.';
    } else {
        try {
            $result = $profileController->updateProfile($_SESSION['user_id'], $_POST);
            
            if ($result['success']) {
                $success_message = 'Perfil actualizado correctamente.';
                // Refresh profile data
                $profile_data = $profileController->getProfile($profile_user_id);
                $user = $profile_data['user'];
            } else {
                $error_message = $result['message'] ?? 'Error al actualizar perfil.';
            }
            
        } catch (Exception $e) {
            error_log('Profile update error: ' . $e->getMessage());
            $error_message = 'Error interno del servidor.';
        }
    }
}

// Generate CSRF token for forms
if ($is_own_profile && !isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Calculate profile completion percentage
$completion_percentage = $profileController->calculateCompletionPercentage($user);
?>
<!DOCTYPE html>
<html lang="es-AR" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= $is_own_profile ? 'Mi perfil' : 'Perfil de ' . htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?> - LaburAR Freelancer Profesional">
    <meta name="keywords" content="freelancer, perfil, portfolio, <?= htmlspecialchars($user['city'] ?? '') ?>, argentina, <?= htmlspecialchars($user['profession'] ?? '') ?>">
    <title><?= $is_own_profile ? 'Mi Perfil' : htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?> - LaburAR | Freelancer Profesional</title>
    
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend+Giga:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Professional Stylesheets -->
    <link rel="stylesheet" href="/Laburar/public/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/main.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/profile.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/trust-badges.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/micro-interactions.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/mobile-optimization.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/Laburar/public/assets/img/icons/logo-32.ico">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?> - LaburAR">
    <meta property="og:description" content="<?= htmlspecialchars($user['professional_title'] ?? 'Freelancer profesional') ?> en LaburAR - <?= htmlspecialchars($user['city'] ?? 'Argentina') ?>">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="https://laburar.com.ar/profile<?= $is_own_profile ? '' : '?id=' . $profile_user_id ?>">
    <meta property="og:image" content="<?= htmlspecialchars($user['avatar_url'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>">
    <meta property="profile:first_name" content="<?= htmlspecialchars($user['first_name']) ?>">
    <meta property="profile:last_name" content="<?= htmlspecialchars($user['last_name']) ?>">
    
    <!-- JSON-LD Schema for Professional Profile -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "<?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?>",
        "jobTitle": "<?= htmlspecialchars($user['professional_title'] ?? 'Freelancer') ?>",
        "description": "<?= htmlspecialchars($user['bio'] ?? '') ?>",
        "image": "<?= htmlspecialchars($user['avatar_url'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "<?= htmlspecialchars($user['city'] ?? '') ?>",
            "addressRegion": "<?= htmlspecialchars($user['province'] ?? '') ?>",
            "addressCountry": "AR"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "<?= number_format($stats['average_rating'] ?? 5.0, 1) ?>",
            "reviewCount": "<?= $stats['total_reviews'] ?? 0 ?>"
        },
        "worksFor": {
            "@type": "Organization",
            "name": "LaburAR",
            "url": "https://laburar.com.ar"
        }
    }
    </script>
</head>

<body class="profile-page">
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
                <a href="/Laburar/chat.php" class="nav-link">Mensajes</a>
                <?php if ($is_own_profile): ?>
                    <a href="/Laburar/profile.php" class="nav-link active">Mi Perfil</a>
                <?php endif; ?>
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

    <!-- Profile Container -->
    <div class="profile-container">
        <!-- Sidebar -->
        <div class="profile-sidebar">
            <!-- Profile Completion (Only for own profile) -->
            <?php if ($is_own_profile && $completion_percentage < 100): ?>
                <div class="completion-card">
                    <h3>Completá tu perfil</h3>
                    <div class="completion-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: <?= $completion_percentage ?>%"></div>
                        </div>
                        <span class="progress-text"><?= $completion_percentage ?>% completo</span>
                    </div>
                    <p>Un perfil completo recibe 3x más propuestas</p>
                </div>
            <?php endif; ?>

            <!-- Main Profile Card -->
            <div class="profile-card glass-element">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="<?= htmlspecialchars($user['avatar_url'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" 
                             alt="<?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?>" 
                             class="avatar-image">
                        
                        <!-- Online Status -->
                        <div class="profile-status <?= $user['is_online'] ? 'online' : 'offline' ?>"></div>
                        
                        <!-- Avatar Upload (Only for own profile) -->
                        <?php if ($is_own_profile): ?>
                            <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                            <button class="avatar-upload" onclick="document.getElementById('avatarUpload').click()" title="Cambiar Avatar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7C14.84 7 14.69 7.02 14.55 7.06L10.5 5.5C10.33 5.43 10.16 5.39 10 5.39C9.26 5.39 8.65 5.95 8.5 6.68L8 9H5C4.45 9 4 9.45 4 10V16C4 16.55 4.45 17 5 17H6L7 22H17L18 17H19C19.55 17 20 16.55 20 16V10C20 9.45 19.55 9 19 9H21Z"/>
                                </svg>
                            </button>
                        <?php endif; ?>
                        
                        <!-- Verification Badge -->
                        <?php if ($user['is_verified']): ?>
                            <div class="verification-badge" title="Perfil Verificado">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7C14.84 7 14.69 7.02 14.55 7.06L10.5 5.5C10.33 5.43 10.16 5.39 10 5.39C9.26 5.39 8.65 5.95 8.5 6.68L8 9H5C4.45 9 4 9.45 4 10V16C4 16.55 4.45 17 5 17H6L7 22H17L18 17H19C19.55 17 20 16.55 20 16V10C20 9.45 19.55 9 19 9H21Z"/>
                                </svg>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <h1 class="profile-name"><?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?></h1>
                    <p class="profile-title"><?= htmlspecialchars($user['professional_title'] ?? 'Freelancer Profesional') ?></p>
                    
                    <!-- Rating -->
                    <div class="profile-rating">
                        <div class="rating-stars">
                            <?php
                            $rating = $stats['average_rating'] ?? 5.0;
                            for ($i = 1; $i <= 5; $i++):
                            ?>
                                <span class="rating-star <?= $i <= floor($rating) ? 'filled' : ($i - 0.5 <= $rating ? 'half' : 'empty') ?>">★</span>
                            <?php endfor; ?>
                        </div>
                        <span class="rating-text"><?= number_format($rating, 1) ?> (<?= $stats['total_reviews'] ?? 0 ?> reseñas)</span>
                    </div>
                    
                    <!-- Location -->
                    <div class="profile-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z"/>
                        </svg>
                        <span><?= htmlspecialchars(($user['city'] ?? '') . ', ' . ($user['province'] ?? 'Argentina')) ?></span>
                    </div>
                    
                    <!-- Member Since -->
                    <div class="profile-member-since">
                        <span>Miembro desde <?= date('M Y', strtotime($user['created_at'])) ?></span>
                    </div>
                </div>
                
                <!-- Profile Stats -->
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value"><?= number_format($stats['completed_projects'] ?? 0) ?></span>
                        <span class="stat-label">Proyectos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value"><?= number_format($stats['success_rate'] ?? 100) ?>%</span>
                        <span class="stat-label">Éxito</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value"><?= $stats['response_time'] ?? '< 1h' ?></span>
                        <span class="stat-label">Respuesta</span>
                    </div>
                </div>
                
                <!-- Trust Badges -->
                <div class="trust-badges">
                    <?php echo \LaburAR\Components\TrustBadgeComponent::render([
                        'afip_verified' => $user['afip_verified'] ?? false,
                        'identity_verified' => $user['identity_verified'] ?? false,
                        'phone_verified' => $user['phone_verified'] ?? false,
                        'email_verified' => $user['email_verified'] ?? false,
                        'payment_verified' => $user['payment_verified'] ?? false
                    ]); ?>
                </div>
                
                <!-- Profile Actions -->
                <div class="profile-actions">
                    <?php if ($is_own_profile): ?>
                        <button class="btn btn-primary btn-edit-profile" onclick="toggleEditMode()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/>
                            </svg>
                            Editar Perfil
                        </button>
                        <button class="btn btn-ghost btn-share-profile" onclick="shareProfile()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12S8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5S19.66 2 18 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12S4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92S20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"/>
                            </svg>
                            Compartir
                        </button>
                    <?php else: ?>
                        <button class="btn btn-primary btn-contact" onclick="contactFreelancer(<?= $profile_user_id ?>)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                            </svg>
                            Contactar
                        </button>
                        <button class="btn btn-ghost btn-favorite" onclick="toggleFavorite(<?= $profile_user_id ?>)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5 22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
                            </svg>
                            Favorito
                        </button>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Quick Actions (Own Profile) -->
            <?php if ($is_own_profile): ?>
                <div class="quick-actions glass-element">
                    <h3>Acciones Rápidas</h3>
                    <div class="action-buttons">
                        <a href="/Laburar/services/create.php" class="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                            </svg>
                            <span>Crear Servicio</span>
                        </a>
                        <a href="/Laburar/portfolio/add.php" class="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"/>
                            </svg>
                            <span>Agregar Trabajo</span>
                        </a>
                        <a href="/Laburar/verification.php" class="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                            </svg>
                            <span>Verificar Cuenta</span>
                        </a>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <!-- Main Content -->
        <div class="profile-main">
            <!-- Success/Error Messages -->
            <?php if ($success_message): ?>
                <div class="alert alert-success">
                    <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <?= htmlspecialchars($success_message) ?>
                </div>
            <?php endif; ?>

            <?php if ($error_message): ?>
                <div class="alert alert-error">
                    <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <?= htmlspecialchars($error_message) ?>
                </div>
            <?php endif; ?>

            <!-- Profile Tabs -->
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="overview">Resumen</button>
                <button class="tab-btn" data-tab="portfolio">Portfolio</button>
                <button class="tab-btn" data-tab="services">Servicios</button>
                <button class="tab-btn" data-tab="reviews">Reseñas</button>
                <?php if ($is_own_profile): ?>
                    <button class="tab-btn" data-tab="analytics">Estadísticas</button>
                <?php endif; ?>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Overview Tab -->
                <div class="tab-pane active" id="overview">
                    <!-- About Section -->
                    <div class="section-card glass-element">
                        <div class="section-header">
                            <h2>Sobre mí</h2>
                            <?php if ($is_own_profile): ?>
                                <button class="btn-edit" onclick="editSection('about')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/>
                                    </svg>
                                </button>
                            <?php endif; ?>
                        </div>
                        <div class="section-content">
                            <?php if ($user['bio']): ?>
                                <p class="bio-text"><?= nl2br(htmlspecialchars($user['bio'])) ?></p>
                            <?php else: ?>
                                <?php if ($is_own_profile): ?>
                                    <p class="empty-state">Contá sobre vos, tu experiencia y qué te hace único como freelancer.</p>
                                    <button class="btn btn-primary" onclick="editSection('about')">Agregar Descripción</button>
                                <?php else: ?>
                                    <p class="empty-state">Este freelancer no ha agregado una descripción aún.</p>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Skills Section -->
                    <div class="section-card glass-element">
                        <div class="section-header">
                            <h2>Habilidades</h2>
                            <?php if ($is_own_profile): ?>
                                <button class="btn-edit" onclick="editSection('skills')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                                    </svg>
                                </button>
                            <?php endif; ?>
                        </div>
                        <div class="section-content">
                            <?php if (!empty($user['skills'])): ?>
                                <div class="skills-grid">
                                    <?php foreach ($user['skills'] as $skill): ?>
                                        <div class="skill-item">
                                            <span class="skill-name"><?= htmlspecialchars($skill['name']) ?></span>
                                            <div class="skill-level">
                                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                                    <span class="skill-star <?= $i <= $skill['level'] ? 'filled' : '' ?>">●</span>
                                                <?php endfor; ?>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php else: ?>
                                <?php if ($is_own_profile): ?>
                                    <p class="empty-state">Agregá tus habilidades para que los clientes sepan qué podés hacer.</p>
                                    <button class="btn btn-primary" onclick="editSection('skills')">Agregar Habilidades</button>
                                <?php else: ?>
                                    <p class="empty-state">Este freelancer no ha agregado habilidades aún.</p>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Languages Section -->
                    <div class="section-card glass-element">
                        <div class="section-header">
                            <h2>Idiomas</h2>
                            <?php if ($is_own_profile): ?>
                                <button class="btn-edit" onclick="editSection('languages')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                                    </svg>
                                </button>
                            <?php endif; ?>
                        </div>
                        <div class="section-content">
                            <?php if (!empty($user['languages'])): ?>
                                <div class="languages-list">
                                    <?php foreach ($user['languages'] as $language): ?>
                                        <div class="language-item">
                                            <span class="language-name"><?= htmlspecialchars($language['name']) ?></span>
                                            <span class="language-level"><?= htmlspecialchars($language['level']) ?></span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php else: ?>
                                <?php if ($is_own_profile): ?>
                                    <p class="empty-state">Agregá los idiomas que hablás para acceder a más oportunidades.</p>
                                    <button class="btn btn-primary" onclick="editSection('languages')">Agregar Idiomas</button>
                                <?php else: ?>
                                    <p class="empty-state">Este freelancer no ha especificado idiomas.</p>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Portfolio Tab -->
                <div class="tab-pane" id="portfolio">
                    <div class="section-header">
                        <h2>Portfolio</h2>
                        <?php if ($is_own_profile): ?>
                            <a href="/Laburar/portfolio/add.php" class="btn btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                                </svg>
                                Agregar Trabajo
                            </a>
                        <?php endif; ?>
                    </div>

                    <?php if (!empty($portfolio_items)): ?>
                        <div class="portfolio-grid">
                            <?php foreach ($portfolio_items as $item): ?>
                                <div class="portfolio-item glass-element">
                                    <div class="portfolio-image">
                                        <img src="<?= htmlspecialchars($item['image_url']) ?>" 
                                             alt="<?= htmlspecialchars($item['title']) ?>"
                                             loading="lazy">
                                        <div class="portfolio-overlay">
                                            <button class="btn-view" onclick="viewPortfolioItem(<?= $item['id'] ?>)">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z"/>
                                                </svg>
                                            </button>
                                            <?php if ($is_own_profile): ?>
                                                <button class="btn-edit" onclick="editPortfolioItem(<?= $item['id'] ?>)">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/>
                                                    </svg>
                                                </button>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    <div class="portfolio-content">
                                        <h3><?= htmlspecialchars($item['title']) ?></h3>
                                        <p><?= htmlspecialchars($item['description']) ?></p>
                                        <div class="portfolio-tags">
                                            <?php foreach ($item['tags'] as $tag): ?>
                                                <span class="tag"><?= htmlspecialchars($tag) ?></span>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="empty-portfolio">
                            <div class="empty-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"/>
                                </svg>
                            </div>
                            <?php if ($is_own_profile): ?>
                                <h3>Mostrá tu mejor trabajo</h3>
                                <p>Agregá proyectos a tu portfolio para destacar tu experiencia y atraer más clientes.</p>
                                <a href="/Laburar/portfolio/add.php" class="btn btn-primary">Agregar Primer Trabajo</a>
                            <?php else: ?>
                                <h3>Portfolio vacío</h3>
                                <p>Este freelancer no ha agregado trabajos a su portfolio aún.</p>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Services Tab -->
                <div class="tab-pane" id="services">
                    <div class="section-header">
                        <h2>Servicios</h2>
                        <?php if ($is_own_profile): ?>
                            <a href="/Laburar/services/create.php" class="btn btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                                </svg>
                                Crear Servicio
                            </a>
                        <?php endif; ?>
                    </div>

                    <?php if (!empty($services)): ?>
                        <div class="services-grid">
                            <?php foreach ($services as $service): ?>
                                <div class="service-card glass-element">
                                    <div class="service-image">
                                        <img src="<?= htmlspecialchars($service['image_url']) ?>" 
                                             alt="<?= htmlspecialchars($service['title']) ?>">
                                    </div>
                                    <div class="service-content">
                                        <h3><?= htmlspecialchars($service['title']) ?></h3>
                                        <p><?= htmlspecialchars($service['description']) ?></p>
                                        <div class="service-price">
                                            <span class="price">$<?= number_format($service['price']) ?></span>
                                            <span class="currency">ARS</span>
                                        </div>
                                        <div class="service-stats">
                                            <span class="stat">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                                                </svg>
                                                <?= number_format($service['rating'], 1) ?>
                                            </span>
                                            <span class="stat">
                                                <?= $service['orders_count'] ?> pedidos
                                            </span>
                                        </div>
                                        <div class="service-actions">
                                            <?php if ($is_own_profile): ?>
                                                <a href="/Laburar/services/edit.php?id=<?= $service['id'] ?>" class="btn btn-secondary">Editar</a>
                                                <a href="/Laburar/services/view.php?id=<?= $service['id'] ?>" class="btn btn-primary">Ver</a>
                                            <?php else: ?>
                                                <a href="/Laburar/services/<?= $service['id'] ?>" class="btn btn-primary">Ver Servicio</a>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="empty-services">
                            <div class="empty-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L1 7L12 12L23 7L12 2ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
                                </svg>
                            </div>
                            <?php if ($is_own_profile): ?>
                                <h3>Creá tu primer servicio</h3>
                                <p>Los servicios son la mejor forma de mostrar lo que podés hacer y generar ingresos consistentes.</p>
                                <a href="/Laburar/services/create.php" class="btn btn-primary">Crear Servicio</a>
                            <?php else: ?>
                                <h3>Sin servicios disponibles</h3>
                                <p>Este freelancer no tiene servicios publicados aún.</p>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Reviews Tab -->
                <div class="tab-pane" id="reviews">
                    <div class="section-header">
                        <h2>Reseñas (<?= count($reviews) ?>)</h2>
                        <div class="reviews-summary">
                            <div class="rating-summary">
                                <span class="rating-value"><?= number_format($stats['average_rating'] ?? 5.0, 1) ?></span>
                                <div class="rating-stars">
                                    <?php
                                    $rating = $stats['average_rating'] ?? 5.0;
                                    for ($i = 1; $i <= 5; $i++):
                                    ?>
                                        <span class="rating-star <?= $i <= floor($rating) ? 'filled' : ($i - 0.5 <= $rating ? 'half' : 'empty') ?>">★</span>
                                    <?php endfor; ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    <?php if (!empty($reviews)): ?>
                        <div class="reviews-list">
                            <?php foreach ($reviews as $review): ?>
                                <div class="review-item glass-element">
                                    <div class="review-header">
                                        <div class="reviewer-info">
                                            <img src="<?= htmlspecialchars($review['client_avatar']) ?>" 
                                                 alt="<?= htmlspecialchars($review['client_name']) ?>"
                                                 class="reviewer-avatar">
                                            <div class="reviewer-details">
                                                <h4><?= htmlspecialchars($review['client_name']) ?></h4>
                                                <p><?= htmlspecialchars($review['client_country']) ?></p>
                                            </div>
                                        </div>
                                        <div class="review-rating">
                                            <div class="rating-stars">
                                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                                    <span class="rating-star <?= $i <= $review['rating'] ? 'filled' : 'empty' ?>">★</span>
                                                <?php endfor; ?>
                                            </div>
                                            <span class="review-date"><?= date('M d, Y', strtotime($review['created_at'])) ?></span>
                                        </div>
                                    </div>
                                    <div class="review-content">
                                        <p><?= nl2br(htmlspecialchars($review['comment'])) ?></p>
                                        <?php if ($review['project_title']): ?>
                                            <div class="project-reference">
                                                <span>Proyecto: <?= htmlspecialchars($review['project_title']) ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="empty-reviews">
                            <div class="empty-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                                </svg>
                            </div>
                            <h3>Sin reseñas aún</h3>
                            <p><?= $is_own_profile ? 'Completá tu primer proyecto para recibir reseñas.' : 'Este freelancer no tiene reseñas aún.' ?></p>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Analytics Tab (Only for own profile) -->
                <?php if ($is_own_profile): ?>
                    <div class="tab-pane" id="analytics">
                        <div class="analytics-grid">
                            <div class="analytics-card glass-element">
                                <h3>Visitas al Perfil</h3>
                                <div class="analytics-value"><?= number_format($stats['profile_views'] ?? 0) ?></div>
                                <div class="analytics-change">
                                    <span class="change-positive">+12%</span> vs mes anterior
                                </div>
                            </div>
                            
                            <div class="analytics-card glass-element">
                                <h3>Propuestas Enviadas</h3>
                                <div class="analytics-value"><?= number_format($stats['proposals_sent'] ?? 0) ?></div>
                                <div class="analytics-change">
                                    <span class="change-neutral">3%</span> tasa de éxito
                                </div>
                            </div>
                            
                            <div class="analytics-card glass-element">
                                <h3>Ingresos del Mes</h3>
                                <div class="analytics-value">$<?= number_format($stats['monthly_earnings'] ?? 0) ?></div>
                                <div class="analytics-change">
                                    <span class="change-positive">+8%</span> vs mes anterior
                                </div>
                            </div>
                            
                            <div class="analytics-card glass-element">
                                <h3>Tiempo de Respuesta</h3>
                                <div class="analytics-value"><?= $stats['avg_response_time'] ?? '2h' ?></div>
                                <div class="analytics-change">
                                    <span class="change-positive">-15min</span> más rápido
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Edit Profile Modal (Only for own profile) -->
    <?php if ($is_own_profile): ?>
        <div class="modal" id="editProfileModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Perfil</h3>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                <form method="POST" class="edit-form" id="editProfileForm">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
                    
                    <div class="form-group">
                        <label for="professional_title">Título Profesional</label>
                        <input type="text" id="professional_title" name="professional_title" 
                               value="<?= htmlspecialchars($user['professional_title'] ?? '') ?>"
                               placeholder="Ej: Desarrollador Full Stack">
                    </div>
                    
                    <div class="form-group">
                        <label for="bio">Descripción</label>
                        <textarea id="bio" name="bio" rows="5" 
                                  placeholder="Contanos sobre tu experiencia, habilidades y qué te hace único..."><?= htmlspecialchars($user['bio'] ?? '') ?></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="hourly_rate">Tarifa por Hora (ARS)</label>
                            <input type="number" id="hourly_rate" name="hourly_rate" 
                                   value="<?= $user['hourly_rate'] ?? '' ?>" min="500" max="50000">
                        </div>
                        
                        <div class="form-group">
                            <label for="availability">Disponibilidad</label>
                            <select id="availability" name="availability">
                                <option value="full_time" <?= ($user['availability'] ?? '') === 'full_time' ? 'selected' : '' ?>>Tiempo Completo</option>
                                <option value="part_time" <?= ($user['availability'] ?? '') === 'part_time' ? 'selected' : '' ?>>Medio Tiempo</option>
                                <option value="project_based" <?= ($user['availability'] ?? '') === 'project_based' ? 'selected' : '' ?>>Por Proyecto</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>

    <!-- JavaScript -->
    <script src="/Laburar/public/assets/js/profile.js"></script>
    <script src="/Laburar/public/assets/js/micro-interactions.js"></script>
    <script>
        // Tab functionality
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update active tab content
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                
                // Store active tab
                localStorage.setItem('profile-active-tab', tabId);
            });
        });

        // Restore active tab
        const savedTab = localStorage.getItem('profile-active-tab');
        if (savedTab) {
            const tabBtn = document.querySelector(`[data-tab="${savedTab}"]`);
            if (tabBtn) tabBtn.click();
        }

        // Profile actions
        function toggleEditMode() {
            document.getElementById('editProfileModal').classList.add('show');
        }

        function closeEditModal() {
            document.getElementById('editProfileModal').classList.remove('show');
        }

        function shareProfile() {
            if (navigator.share) {
                navigator.share({
                    title: 'Mi perfil en LaburAR',
                    text: 'Mirá mi perfil profesional en LaburAR',
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert('Enlace copiado al portapapeles');
            }
        }

        function contactFreelancer(userId) {
            window.location.href = `/Laburar/chat.php?user=${userId}`;
        }

        function toggleFavorite(userId) {
            // Implementation for favorite toggle
            console.log('Toggle favorite for user:', userId);
        }

        // User menu toggle
        function toggleUserMenu() {
            document.getElementById('userDropdown').classList.toggle('show');
        }

        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            const userMenu = document.querySelector('.user-menu');
            if (!userMenu.contains(e.target)) {
                document.getElementById('userDropdown').classList.remove('show');
            }
        });

        // Avatar upload
        document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('avatar', file);
                formData.append('csrf_token', '<?= $_SESSION['csrf_token'] ?? '' ?>');
                
                fetch('/Laburar/api/upload-avatar.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error al subir la imagen: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al subir la imagen');
                });
            }
        });

        // Mobile navigation
        document.getElementById('navToggle').addEventListener('click', function() {
            document.getElementById('navMenu').classList.toggle('show');
        });

        // Portfolio and service actions
        function viewPortfolioItem(id) {
            window.open(`/Laburar/portfolio/${id}`, '_blank');
        }

        function editPortfolioItem(id) {
            window.location.href = `/Laburar/portfolio/edit.php?id=${id}`;
        }

        // Form validation
        document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
            // Basic validation
            const title = document.getElementById('professional_title').value;
            const bio = document.getElementById('bio').value;
            
            if (!title.trim()) {
                e.preventDefault();
                alert('Por favor, ingresa tu título profesional');
                return;
            }
            
            if (!bio.trim()) {
                e.preventDefault();
                alert('Por favor, agrega una descripción de tu perfil');
                return;
            }
        });
    </script>
</body>
</html>