<?php
/**
 * LaburAR - Projects Management Page
 * Complete project management system with real data integration
 * 
 * @author LaburAR Team
 * @version 2.0
 * @features Real-time data, project management, proposal system
 * @since 2025-07-24
 */

// Security headers and initialization
require_once __DIR__ . '/bootstrap.php';

// Security: Authentication check
if (!isset($_SESSION['user_id']) || !isset($_SESSION['auth_token'])) {
    header('Location: /Laburar/login.php');
    exit;
}

// Get user information
$userId = $_SESSION['user_id'];
$userType = $_SESSION['user_type'] ?? 'freelancer';
$userName = $_SESSION['user_name'] ?? 'Usuario';

// Initialize project filters
$status_filter = filter_input(INPUT_GET, 'status', FILTER_SANITIZE_STRING) ?? '';
$category_filter = filter_input(INPUT_GET, 'category', FILTER_VALIDATE_INT) ?? 0;
$search_query = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_STRING) ?? '';
$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?? 1;

// Get real project data
try {
    require_once __DIR__ . '/../../app/Controllers/ProjectController.php';
    $projectController = new \LaburAR\Controllers\ProjectController();
    
    $projectsData = $projectController->getUserProjects($userId, [
        'status' => $status_filter,
        'category' => $category_filter,
        'search' => $search_query,
        'page' => $page,
        'per_page' => 12,
        'user_type' => $userType
    ]);
    
    $projects = $projectsData['projects'] ?? [];
    $total_projects = $projectsData['total'] ?? 0;
    $project_stats = $projectsData['stats'] ?? [
        'all' => 0,
        'active' => 0,
        'completed' => 0,
        'draft' => 0
    ];
    
    // Get categories for filters
    $categories = $projectController->getCategories();
    
} catch (Exception $e) {
    error_log('Projects page error: ' . $e->getMessage());
    $projects = [];
    $total_projects = 0;
    $project_stats = ['all' => 0, 'active' => 0, 'completed' => 0, 'draft' => 0];
    $categories = [];
}

// Generate CSRF token for forms
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<!DOCTYPE html>
<html lang="es-AR" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Gestiona tus proyectos freelance en LaburAR. Crea, administra y supervisa todos tus trabajos en una plataforma integrada.">
    <meta name="keywords" content="gestión proyectos, freelance argentina, administración trabajos, LaburAR projects">
    
    <!-- SEO Meta Tags -->
    <meta name="author" content="LaburAR Team">
    <meta name="robots" content="noindex, nofollow">
    <meta name="language" content="Spanish">
    <meta name="geo.region" content="AR">
    
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    
    <title>Mis Proyectos - LaburAR | Gestión de Proyectos Freelance</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend+Giga:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Professional Stylesheets -->
    <link rel="stylesheet" href="/Laburar/public/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/main.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/projects.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/project-management.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/micro-interactions.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/mobile-optimization.css">
    
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/Laburar/public/assets/img/icons/logo-32.ico">
</head>

<body class="projects-page">
    <!-- Professional Navigation -->
    <nav class="navbar navbar-professional glass-navigation glass-element">
        <div class="nav-container">
            <div class="nav-brand">
                <a href="/Laburar/" class="brand-link">
                    <img src="/Laburar/public/assets/img/icons/logo-64.png" alt="LaburAR" class="brand-logo">
                    <span class="brand-text">LABUR.AR</span>
                </a>
            </div>
            
            <div class="nav-menu" id="navMenu">
                <a href="/Laburar/" class="nav-link">Inicio</a>
                <a href="/Laburar/marketplace.php" class="nav-link">Marketplace</a>
                <a href="/Laburar/projects.php" class="nav-link active">Proyectos</a>
                <a href="/Laburar/chat.php" class="nav-link">Mensajes</a>
                <a href="/Laburar/profile.php" class="nav-link">Perfil</a>
            </div>
            
            <div class="nav-auth" id="authButtons">
                <div class="user-menu">
                    <button class="user-avatar" onclick="toggleUserMenu()">
                        <img src="<?= htmlspecialchars($_SESSION['user_avatar'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" alt="Usuario">
                        <span><?= htmlspecialchars($userName) ?></span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="/Laburar/profile.php" class="dropdown-item">Mi Perfil</a>
                        <a href="/Laburar/dashboard.php" class="dropdown-item">Dashboard</a>
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

    <!-- Main Content -->
    <main class="projects-container glass-bg" id="projectsContainer">
        <!-- Header -->
        <header class="projects-header glass-element">
            <div class="header-content">
                <h1>Gestión de Proyectos</h1>
                <p class="subtitle">
                    <?php if ($userType === 'client'): ?>
                        Administra tus proyectos y encuentra el mejor talento freelance
                    <?php else: ?>
                        Gestiona tus trabajos y colaboraciones en LaburAR
                    <?php endif; ?>
                </p>
                
                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="stat-card">
                        <div class="stat-number"><?= number_format($project_stats['active']) ?></div>
                        <div class="stat-label">Activos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?= number_format($project_stats['completed']) ?></div>
                        <div class="stat-label">Completados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?= number_format($total_projects) ?></div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Project Tabs -->
        <div class="project-tabs glass-element">
            <button class="project-tab <?= empty($status_filter) ? 'active' : '' ?>" data-tab="all">
                Todos <span class="count"><?= number_format($project_stats['all']) ?></span>
            </button>
            <button class="project-tab <?= $status_filter === 'active' ? 'active' : '' ?>" data-tab="active">
                Activos <span class="count"><?= number_format($project_stats['active']) ?></span>
            </button>
            <button class="project-tab <?= $status_filter === 'completed' ? 'active' : '' ?>" data-tab="completed">
                Completados <span class="count"><?= number_format($project_stats['completed']) ?></span>
            </button>
            <button class="project-tab <?= $status_filter === 'draft' ? 'active' : '' ?>" data-tab="draft">
                Borradores <span class="count"><?= number_format($project_stats['draft']) ?></span>
            </button>
        </div>

        <!-- Actions Bar -->
        <div class="projects-actions glass-element">
            <div class="search-filters">
                <form method="GET" action="/Laburar/projects.php" id="projectsFilterForm">
                    <input 
                        type="text" 
                        class="search-input" 
                        name="search"
                        value="<?= htmlspecialchars($search_query) ?>"
                        placeholder="Buscar proyectos..."
                        id="projectSearch"
                    >
                    
                    <select class="filter-select" name="status" id="statusFilter">
                        <option value="">Todos los estados</option>
                        <option value="draft" <?= $status_filter === 'draft' ? 'selected' : '' ?>>Borrador</option>
                        <option value="posted" <?= $status_filter === 'posted' ? 'selected' : '' ?>>Publicado</option>
                        <option value="proposals_review" <?= $status_filter === 'proposals_review' ? 'selected' : '' ?>>Revisando Propuestas</option>
                        <option value="in_progress" <?= $status_filter === 'in_progress' ? 'selected' : '' ?>>En Progreso</option>
                        <option value="review" <?= $status_filter === 'review' ? 'selected' : '' ?>>En Revisión</option>
                        <option value="completed" <?= $status_filter === 'completed' ? 'selected' : '' ?>>Completado</option>
                        <option value="cancelled" <?= $status_filter === 'cancelled' ? 'selected' : '' ?>>Cancelado</option>
                    </select>
                    
                    <select class="filter-select" name="category" id="categoryFilter">
                        <option value="">Todas las categorías</option>
                        <?php foreach ($categories as $category): ?>
                            <option value="<?= $category['id'] ?>" <?= $category_filter == $category['id'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($category['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    
                    <button type="submit" class="btn btn-secondary">
                        <i class="fas fa-search"></i>
                        Filtrar
                    </button>
                </form>
            </div>
            
            <div class="action-buttons">
                <?php if ($userType === 'client'): ?>
                    <button class="btn btn-primary" data-action="create">
                        <i class="fas fa-plus"></i>
                        Nuevo Proyecto
                    </button>
                <?php endif; ?>
                
                <button class="btn btn-secondary" onclick="location.reload()">
                    <i class="fas fa-sync-alt"></i>
                    Actualizar
                </button>
            </div>
        </div>

        <!-- Loading Indicator -->
        <div id="loadingIndicator" class="loading-spinner" style="display: none;">
            <div class="spinner"></div>
            Cargando proyectos...
        </div>

        <!-- Projects Grid -->
        <div class="projects-grid" id="projectsGrid">
            <?php if (!empty($projects)): ?>
                <?php foreach ($projects as $project): ?>
                    <div class="project-card glass-element" data-project-id="<?= $project['id'] ?>">
                        <div class="project-header">
                            <div class="project-status status-<?= $project['status'] ?>">
                                <?= ucfirst(str_replace('_', ' ', $project['status'])) ?>
                            </div>
                            <div class="project-menu">
                                <button class="menu-trigger" onclick="toggleProjectMenu(<?= $project['id'] ?>)">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="project-dropdown" id="projectMenu-<?= $project['id'] ?>">
                                    <a href="#" onclick="viewProject(<?= $project['id'] ?>)">Ver Detalles</a>
                                    <?php if ($userType === 'client' && in_array($project['status'], ['draft', 'posted'])): ?>
                                        <a href="#" onclick="editProject(<?= $project['id'] ?>)">Editar</a>
                                    <?php endif; ?>
                                    <?php if ($userType === 'freelancer' && $project['status'] === 'posted'): ?>
                                        <a href="#" onclick="sendProposal(<?= $project['id'] ?>)">Enviar Propuesta</a>
                                    <?php endif; ?>
                                    <a href="#" onclick="shareProject(<?= $project['id'] ?>)">Compartir</a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="project-content">
                            <h3 class="project-title">
                                <a href="#" onclick="viewProject(<?= $project['id'] ?>)">
                                    <?= htmlspecialchars($project['title']) ?>
                                </a>
                            </h3>
                            
                            <p class="project-description">
                                <?= htmlspecialchars(substr($project['description'], 0, 150)) ?>
                                <?= strlen($project['description']) > 150 ? '...' : '' ?>
                            </p>
                            
                            <div class="project-meta">
                                <div class="meta-item">
                                    <i class="fas fa-tag"></i>
                                    <span><?= htmlspecialchars($project['category_name'] ?? 'Sin categoría') ?></span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-clock"></i>
                                    <span><?= date('j M Y', strtotime($project['created_at'])) ?></span>
                                </div>
                                <?php if (!empty($project['deadline'])): ?>
                                    <div class="meta-item">
                                        <i class="fas fa-calendar-alt"></i>
                                        <span>Entrega: <?= date('j M Y', strtotime($project['deadline'])) ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="project-footer">
                            <div class="project-budget">
                                <span class="budget-label">Presupuesto:</span>
                                <span class="budget-amount">AR$ <?= number_format($project['budget_amount'], 0, ',', '.') ?></span>
                            </div>
                            
                            <div class="project-stats">
                                <?php if ($userType === 'client'): ?>
                                    <div class="stat">
                                        <i class="fas fa-users"></i>
                                        <span><?= $project['proposals_count'] ?? 0 ?> propuestas</span>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if (!empty($project['freelancer_name'])): ?>
                                    <div class="freelancer-info">
                                        <img src="<?= htmlspecialchars($project['freelancer_avatar'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" 
                                             alt="<?= htmlspecialchars($project['freelancer_name']) ?>" 
                                             class="freelancer-avatar">
                                        <span><?= htmlspecialchars($project['freelancer_name']) ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <!-- No Projects -->
                <div class="no-projects glass-element">
                    <div class="no-projects-icon">
                        <i class="fas fa-folder-open"></i>
                    </div>
                    <h3>
                        <?php if ($userType === 'client'): ?>
                            No tienes proyectos aún
                        <?php else: ?>
                            No tienes proyectos asignados
                        <?php endif; ?>
                    </h3>
                    <p>
                        <?php if ($userType === 'client'): ?>
                            Crea tu primer proyecto para encontrar el freelancer perfecto
                        <?php else: ?>
                            Explora el marketplace para encontrar proyectos interesantes
                        <?php endif; ?>
                    </p>
                    <?php if ($userType === 'client'): ?>
                        <button class="btn btn-primary" data-action="create">
                            <i class="fas fa-plus"></i>
                            Crear Primer Proyecto
                        </button>
                    <?php else: ?>
                        <a href="/Laburar/marketplace.php" class="btn btn-primary">
                            <i class="fas fa-search"></i>
                            Explorar Proyectos
                        </a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Pagination -->
        <?php if ($total_projects > 12): ?>
            <div class="pagination-wrapper glass-element">
                <?php
                $total_pages = ceil($total_projects / 12);
                $current_params = $_GET;
                ?>
                <nav class="pagination">
                    <?php if ($page > 1): ?>
                        <?php 
                        $current_params['page'] = $page - 1;
                        $prev_url = '/Laburar/projects.php?' . http_build_query($current_params);
                        ?>
                        <a href="<?= htmlspecialchars($prev_url) ?>" class="pagination-btn">
                            <i class="fas fa-chevron-left"></i>
                            Anterior
                        </a>
                    <?php endif; ?>

                    <div class="pagination-numbers">
                        <?php for ($i = max(1, $page - 2); $i <= min($total_pages, $page + 2); $i++): ?>
                            <?php 
                            $current_params['page'] = $i;
                            $page_url = '/Laburar/projects.php?' . http_build_query($current_params);
                            ?>
                            <a href="<?= htmlspecialchars($page_url) ?>" 
                               class="pagination-number <?= $i === $page ? 'active' : '' ?>">
                                <?= $i ?>
                            </a>
                        <?php endfor; ?>
                    </div>

                    <?php if ($page < $total_pages): ?>
                        <?php 
                        $current_params['page'] = $page + 1;
                        $next_url = '/Laburar/projects.php?' . http_build_query($current_params);
                        ?>
                        <a href="<?= htmlspecialchars($next_url) ?>" class="pagination-btn">
                            Siguiente
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    <?php endif; ?>
                </nav>
            </div>
        <?php endif; ?>
    </main>

    <!-- Create Project Modal -->
    <?php if ($userType === 'client'): ?>
        <div class="modal" id="createProjectModal">
            <div class="modal-backdrop" onclick="closeModal('createProjectModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Crear Nuevo Proyecto</h3>
                    <button class="modal-close" onclick="closeModal('createProjectModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="createProjectForm" class="form">
                        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                        
                        <div class="form-group">
                            <label for="projectTitle" class="form-label">Título del Proyecto *</label>
                            <input 
                                type="text" 
                                id="projectTitle" 
                                name="title" 
                                class="form-control"
                                placeholder="Ej: Desarrollo de sitio web corporativo"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="projectCategory" class="form-label">Categoría *</label>
                            <select id="projectCategory" name="category_id" class="form-control" required>
                                <option value="">Seleccionar categoría</option>
                                <?php foreach ($categories as $category): ?>
                                    <option value="<?= $category['id'] ?>">
                                        <?= htmlspecialchars($category['name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="projectDescription" class="form-label">Descripción *</label>
                            <textarea 
                                id="projectDescription" 
                                name="description" 
                                class="form-control"
                                rows="4"
                                placeholder="Describe detalladamente lo que necesitas..."
                                required
                            ></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="budgetType" class="form-label">Tipo de Presupuesto *</label>
                                <select id="budgetType" name="budget_type" class="form-control" required>
                                    <option value="fixed">Precio Fijo</option>
                                    <option value="hourly">Por Hora</option>
                                    <option value="milestone">Por Hitos</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="budgetAmount" class="form-label">Presupuesto (ARS) *</label>
                                <input 
                                    type="number" 
                                    id="budgetAmount" 
                                    name="budget_amount" 
                                    class="form-control"
                                    min="1000"
                                    step="100"
                                    placeholder="15000"
                                    required
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="projectDeadline" class="form-label">Fecha de Entrega</label>
                            <input 
                                type="date" 
                                id="projectDeadline" 
                                name="deadline" 
                                class="form-control"
                                min="<?= date('Y-m-d', strtotime('+1 day')) ?>"
                            >
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('createProjectModal')">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Crear Proyecto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Project Detail Modal -->
    <div class="modal" id="projectModal">
        <div class="modal-backdrop" onclick="closeModal('projectModal')"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalle del Proyecto</h3>
                <button class="modal-close" onclick="closeModal('projectModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="projectModalContent">
                <!-- Project detail content will be loaded here -->
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- JavaScript -->
    <script src="/Laburar/public/assets/js/projects.js"></script>
    <script src="/Laburar/public/assets/js/micro-interactions.js"></script>
    <script>
        // Project Management Functions
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize project management
            initializeProjectManagement();
            
            // Setup modal triggers
            setupModalTriggers();
            
            // Setup filters
            setupFilters();
        });

        function initializeProjectManagement() {
            // Setup create project button
            const createButtons = document.querySelectorAll('[data-action="create"]');
            createButtons.forEach(button => {
                button.addEventListener('click', function() {
                    showModal('createProjectModal');
                });
            });

            // Setup project form submission
            const createForm = document.getElementById('createProjectForm');
            if (createForm) {
                createForm.addEventListener('submit', handleCreateProject);
            }

            // Setup tab filtering
            const tabs = document.querySelectorAll('.project-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const status = this.dataset.tab === 'all' ? '' : this.dataset.tab;
                    filterByStatus(status);
                });
            });
        }

        function setupModalTriggers() {
            // Close modals when clicking outside
            window.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal-backdrop')) {
                    const modal = e.target.closest('.modal');
                    if (modal) {
                        closeModal(modal.id);
                    }
                }
            });
        }

        function setupFilters() {
            // Auto-submit form when filters change
            const filterSelects = document.querySelectorAll('#statusFilter, #categoryFilter');
            filterSelects.forEach(select => {
                select.addEventListener('change', function() {
                    document.getElementById('projectsFilterForm').submit();
                });
            });

            // Search on enter
            const searchInput = document.getElementById('projectSearch');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        document.getElementById('projectsFilterForm').submit();
                    }
                });
            }
        }

        async function handleCreateProject(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
            
            try {
                const response = await fetch('/Laburar/api/projects.php?action=create', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('Proyecto creado exitosamente', 'success');
                    closeModal('createProjectModal');
                    form.reset();
                    
                    // Reload page after short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(data.error || 'Error al crear el proyecto', 'error');
                }
            } catch (error) {
                console.error('Error creating project:', error);
                showToast('Error de conexión. Intenta nuevamente.', 'error');
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-plus"></i> Crear Proyecto';
            }
        }

        function filterByStatus(status) {
            const url = new URL(window.location);
            if (status) {
                url.searchParams.set('status', status);
            } else {
                url.searchParams.delete('status');
            }
            url.searchParams.delete('page'); // Reset pagination
            window.location.href = url.toString();
        }

        function viewProject(projectId) {
            // Load project details in modal
            showModal('projectModal');
            loadProjectDetails(projectId);
        }

        async function loadProjectDetails(projectId) {
            const modalContent = document.getElementById('projectModalContent');
            modalContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Cargando...</div>';
            
            try {
                const response = await fetch(`/Laburar/api/projects.php?action=get&id=${projectId}`);
                const data = await response.json();
                
                if (data.success) {
                    modalContent.innerHTML = generateProjectDetailHTML(data.project);
                } else {
                    modalContent.innerHTML = '<div class="error-message">Error al cargar el proyecto</div>';
                }
            } catch (error) {
                console.error('Error loading project:', error);
                modalContent.innerHTML = '<div class="error-message">Error de conexión</div>';
            }
        }

        function generateProjectDetailHTML(project) {
            return `
                <div class="project-detail">
                    <div class="project-detail-header">
                        <h2>${project.title}</h2>
                        <span class="status-badge status-${project.status}">${project.status}</span>
                    </div>
                    
                    <div class="project-detail-meta">
                        <div class="meta-item">
                            <strong>Categoría:</strong> ${project.category_name}
                        </div>
                        <div class="meta-item">
                            <strong>Presupuesto:</strong> AR$ ${new Intl.NumberFormat('es-AR').format(project.budget_amount)}
                        </div>
                        <div class="meta-item">
                            <strong>Creado:</strong> ${new Date(project.created_at).toLocaleDateString('es-AR')}
                        </div>
                        ${project.deadline ? `<div class="meta-item"><strong>Entrega:</strong> ${new Date(project.deadline).toLocaleDateString('es-AR')}</div>` : ''}
                    </div>
                    
                    <div class="project-detail-description">
                        <h4>Descripción</h4>
                        <p>${project.description}</p>
                    </div>
                    
                    ${project.requirements ? `
                        <div class="project-detail-requirements">
                            <h4>Requerimientos</h4>
                            <p>${project.requirements}</p>
                        </div>
                    ` : ''}
                    
                    <div class="project-detail-actions">
                        <button class="btn btn-secondary" onclick="closeModal('projectModal')">Cerrar</button>
                        ${project.status === 'posted' && '<?= $userType ?>' === 'freelancer' ? 
                            '<button class="btn btn-primary" onclick="sendProposal(' + project.id + ')">Enviar Propuesta</button>' : ''}
                    </div>
                </div>
            `;
        }

        function toggleProjectMenu(projectId) {
            const menu = document.getElementById(`projectMenu-${projectId}`);
            if (menu) {
                menu.classList.toggle('show');
            }
        }

        function showModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(toast);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
        }

        // Toggle user menu
        function toggleUserMenu() {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('show');
        }

        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            const userMenu = document.querySelector('.user-menu');
            if (!userMenu.contains(e.target)) {
                document.getElementById('userDropdown').classList.remove('show');
            }
        });

        // Mobile navigation
        document.getElementById('navToggle').addEventListener('click', function() {
            document.getElementById('navMenu').classList.toggle('show');
        });

        // Close project menus when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.project-menu')) {
                document.querySelectorAll('.project-dropdown').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    </script>
</body>
</html>