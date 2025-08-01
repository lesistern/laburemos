<?php
/**
 * LaburAR - Marketplace Page
 * Professional marketplace with real data integration and advanced search
 * 
 * @author LaburAR Team
 * @version 2.0
 * @features Real-time data, advanced filters, professional UI
 * @since 2025-07-24
 */

// Security headers and initialization
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../components/ServiceCardProfessional.php';
require_once __DIR__ . '/../components/FiltrosArgentinos.php';

// Initialize search parameters
$search_query = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_STRING) ?? '';
$category = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_STRING) ?? '';
$location = filter_input(INPUT_GET, 'location', FILTER_SANITIZE_STRING) ?? '';
$min_price = filter_input(INPUT_GET, 'min_price', FILTER_VALIDATE_INT) ?? 0;
$max_price = filter_input(INPUT_GET, 'max_price', FILTER_VALIDATE_INT) ?? 50000;
$sort_by = filter_input(INPUT_GET, 'sort_by', FILTER_SANITIZE_STRING) ?? 'relevance';
$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?? 1;

// Get real marketplace data
try {
    $searchController = new \LaburAR\Controllers\SearchController();
    $searchResults = $searchController->searchServices([
        'query' => $search_query,
        'category' => $category,
        'location' => $location,
        'min_price' => $min_price,
        'max_price' => $max_price,
        'sort_by' => $sort_by,
        'page' => $page,
        'per_page' => 20
    ]);
    
    $services = $searchResults['services'] ?? [];
    $total_results = $searchResults['total'] ?? 0;
    $categories = $searchResults['categories'] ?? [];
    $featured_services = $searchResults['featured'] ?? [];
    
} catch (Exception $e) {
    error_log('Marketplace search error: ' . $e->getMessage());
    $services = [];
    $total_results = 0;
    $categories = [];
    $featured_services = [];
}

// Get platform stats for trust signals
$platformStats = \LaburAR\Services\DatabaseHelper::getPlatformStats();

// Check if user is authenticated
$isAuthenticated = isset($_SESSION['user_id']) && isset($_SESSION['auth_token']);
$userType = $_SESSION['user_type'] ?? null;
?>
<!DOCTYPE html>
<html lang="es-AR" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Descubre freelancers argentinos especializados. Encuentra servicios de desarrollo, diseño, marketing digital y más en LaburAR con pagos seguros.">
    <meta name="keywords" content="freelancers argentina, servicios freelance, desarrollo web, diseño gráfico, marketing digital, mercadopago">
    
    <!-- SEO Meta Tags -->
    <meta name="author" content="LaburAR Team">
    <meta name="robots" content="index, follow">
    <meta name="language" content="Spanish">
    <meta name="geo.region" content="AR">
    <meta name="geo.country" content="Argentina">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Marketplace - LaburAR | El Futuro del Freelancing Argentino">
    <meta property="og:description" content="Conecta con los mejores freelancers argentinos. Servicios verificados, pagos seguros con MercadoPago y compliance AFIP automático">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://laburar.com.ar/marketplace">
    <meta property="og:image" content="/Laburar/public/assets/img/og-marketplace.jpg">
    <meta property="og:site_name" content="LaburAR">
    <meta property="og:locale" content="es_AR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@LaburAR">
    <meta name="twitter:title" content="Marketplace - LaburAR">
    <meta name="twitter:description" content="Freelancers verificados, pagos con MercadoPago, compliance AFIP automático">
    <meta name="twitter:image" content="/Laburar/public/assets/img/twitter-card.jpg">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/Laburar/public/assets/img/icons/logo-32.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/Laburar/public/assets/img/apple-touch-icon.png">
    
    <title><?= !empty($search_query) ? "Resultados para '$search_query' - " : '' ?>Marketplace - LaburAR | El Futuro del Freelancing Argentino</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend+Giga:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Professional Stylesheets -->
    <link rel="stylesheet" href="/Laburar/public/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/hero-professional.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/service-card-professional.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/main.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/marketplace.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/advanced-search.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/filtros-argentinos.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/micro-interactions.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/mobile-optimization.css">
    
    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "LaburAR Marketplace",
        "description": "Marketplace de freelancers argentinos con servicios profesionales verificados",
        "url": "https://laburar.com.ar/marketplace",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://laburar.com.ar/marketplace?search={search_term_string}",
            "query-input": "required name=search_term_string"
        },
        "publisher": {
            "@type": "Organization",
            "name": "LaburAR",
            "logo": "https://laburar.com.ar/public/assets/img/logo.png"
        },
        "areaServed": {
            "@type": "Country",
            "name": "Argentina"
        }
    }
    </script>
</head>

<body class="marketplace-page">
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
                <a href="/Laburar/marketplace.php" class="nav-link active">Marketplace</a>
                <?php if ($isAuthenticated): ?>
                    <a href="/Laburar/projects.php" class="nav-link">Proyectos</a>
                    <a href="/Laburar/chat.php" class="nav-link">Mensajes</a>
                    <a href="/Laburar/profile.php" class="nav-link">Perfil</a>
                <?php endif; ?>
            </div>
            
            <div class="nav-auth" id="authButtons">
                <?php if ($isAuthenticated): ?>
                    <div class="user-menu">
                        <button class="user-avatar" onclick="toggleUserMenu()">
                            <img src="<?= htmlspecialchars($_SESSION['user_avatar'] ?? '/Laburar/public/assets/img/default-avatar.jpg') ?>" alt="Usuario">
                            <span><?= htmlspecialchars($_SESSION['user_name'] ?? 'Usuario') ?></span>
                        </button>
                        <div class="user-dropdown" id="userDropdown">
                            <a href="/Laburar/profile.php" class="dropdown-item">Mi Perfil</a>
                            <a href="/Laburar/dashboard.php" class="dropdown-item">Dashboard</a>
                            <a href="/Laburar/settings.php" class="dropdown-item">Configuración</a>
                            <hr class="dropdown-divider">
                            <a href="/Laburar/logout.php" class="dropdown-item">Cerrar Sesión</a>
                        </div>
                    </div>
                <?php else: ?>
                    <a href="/Laburar/login.php" class="btn btn-ghost">Iniciar Sesión</a>
                    <a href="/Laburar/register.php" class="btn btn-primary">Registrarse</a>
                <?php endif; ?>
            </div>
            
            <div class="nav-toggle" id="navToggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Hero Search Section -->
    <section class="hero-search glass-bg">
        <div class="container">
            <div class="hero-content">
                <h1 class="hero-title">
                    <?php if (!empty($search_query)): ?>
                        Resultados para "<?= htmlspecialchars($search_query) ?>"
                    <?php else: ?>
                        Encuentra el Freelancer Perfecto
                    <?php endif; ?>
                </h1>
                <p class="hero-subtitle">
                    <?= number_format($total_results) ?> servicios profesionales disponibles en Argentina
                </p>
                
                <!-- Advanced Search Form -->
                <form method="GET" action="/Laburar/marketplace.php" class="search-form">
                    <div class="search-row">
                        <div class="search-field">
                            <input 
                                type="text" 
                                name="search" 
                                placeholder="¿Qué servicio necesitas?"
                                value="<?= htmlspecialchars($search_query) ?>"
                                class="search-input"
                            >
                        </div>
                        
                        <div class="search-field">
                            <select name="category" class="search-select">
                                <option value="">Todas las categorías</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?= htmlspecialchars($cat['slug']) ?>" <?= $category === $cat['slug'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($cat['name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                        <div class="search-field">
                            <select name="location" class="search-select">
                                <option value="">Toda Argentina</option>
                                <option value="CABA" <?= $location === 'CABA' ? 'selected' : '' ?>>CABA</option>
                                <option value="Buenos Aires" <?= $location === 'Buenos Aires' ? 'selected' : '' ?>>Buenos Aires</option>
                                <option value="Córdoba" <?= $location === 'Córdoba' ? 'selected' : '' ?>>Córdoba</option>
                                <option value="Santa Fe" <?= $location === 'Santa Fe' ? 'selected' : '' ?>>Santa Fe</option>
                                <option value="Mendoza" <?= $location === 'Mendoza' ? 'selected' : '' ?>>Mendoza</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="search-btn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                            </svg>
                            Buscar
                        </button>
                    </div>
                    
                    <!-- Advanced Filters -->
                    <div class="advanced-filters" id="advancedFilters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label>Precio (ARS)</label>
                                <div class="price-range">
                                    <input type="number" name="min_price" placeholder="Mín" value="<?= $min_price ?>" min="0">
                                    <span>-</span>
                                    <input type="number" name="max_price" placeholder="Máx" value="<?= $max_price ?>" min="0">
                                </div>
                            </div>
                            
                            <div class="filter-group">
                                <label>Ordenar por</label>
                                <select name="sort_by">
                                    <option value="relevance" <?= $sort_by === 'relevance' ? 'selected' : '' ?>>Relevancia</option>
                                    <option value="price_low" <?= $sort_by === 'price_low' ? 'selected' : '' ?>>Precio: Menor a Mayor</option>
                                    <option value="price_high" <?= $sort_by === 'price_high' ? 'selected' : '' ?>>Precio: Mayor a Menor</option>
                                    <option value="rating" <?= $sort_by === 'rating' ? 'selected' : '' ?>>Mejor Calificados</option>
                                    <option value="recent" <?= $sort_by === 'recent' ? 'selected' : '' ?>>Más Recientes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" class="toggle-filters" onclick="toggleAdvancedFilters()">
                        <span>Filtros Avanzados</span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Marketplace Results -->
    <main class="marketplace-content">
        <div class="container">
            <!-- Results Header -->
            <div class="results-header">
                <div class="results-info">
                    <h2>
                        <?php if (!empty($search_query)): ?>
                            Resultados para "<?= htmlspecialchars($search_query) ?>"
                        <?php else: ?>
                            Todos los Servicios
                        <?php endif; ?>
                    </h2>
                    <p><?= number_format($total_results) ?> servicios encontrados</p>
                </div>
                
                <div class="view-toggle">
                    <button class="view-btn active" data-view="grid">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button class="view-btn" data-view="list">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Services Grid -->
            <div class="services-grid grid-view" id="servicesGrid">
                <?php if (!empty($services)): ?>
                    <?php foreach ($services as $service): ?>
                        <div class="service-card-wrapper">
                            <?= \LaburAR\Components\ServiceCardProfessional::render($service) ?>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <!-- No Results -->
                    <div class="no-results">
                        <div class="no-results-icon">
                            <svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <h3>No encontramos servicios</h3>
                        <p>Intenta ajustar los filtros o buscar con términos diferentes.</p>
                        <a href="/Laburar/marketplace.php" class="btn btn-primary">Ver Todos los Servicios</a>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Pagination -->
            <?php if ($total_results > 20): ?>
                <div class="pagination-wrapper">
                    <?php
                    $total_pages = ceil($total_results / 20);
                    $current_params = $_GET;
                    ?>
                    <nav class="pagination">
                        <?php if ($page > 1): ?>
                            <?php 
                            $current_params['page'] = $page - 1;
                            $prev_url = '/Laburar/marketplace.php?' . http_build_query($current_params);
                            ?>
                            <a href="<?= htmlspecialchars($prev_url) ?>" class="pagination-btn">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Anterior
                            </a>
                        <?php endif; ?>

                        <div class="pagination-numbers">
                            <?php for ($i = max(1, $page - 2); $i <= min($total_pages, $page + 2); $i++): ?>
                                <?php 
                                $current_params['page'] = $i;
                                $page_url = '/Laburar/marketplace.php?' . http_build_query($current_params);
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
                            $next_url = '/Laburar/marketplace.php?' . http_build_query($current_params);
                            ?>
                            <a href="<?= htmlspecialchars($next_url) ?>" class="pagination-btn">
                                Siguiente
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                            </a>
                        <?php endif; ?>
                    </nav>
                </div>
            <?php endif; ?>
        </div>
    </main>

    <!-- Featured Categories -->
    <?php if (empty($search_query) && !empty($categories)): ?>
        <section class="featured-categories">
            <div class="container">
                <h2>Categorías Populares</h2>
                <div class="categories-grid">
                    <?php foreach (array_slice($categories, 0, 8) as $category): ?>
                        <a href="/Laburar/marketplace.php?category=<?= urlencode($category['slug']) ?>" 
                           class="category-card">
                            <div class="category-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <?= $category['icon_svg'] ?? '<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>' ?>
                                </svg>
                            </div>
                            <h3><?= htmlspecialchars($category['name']) ?></h3>
                            <p><?= number_format($category['services_count'] ?? 0) ?> servicios</p>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
    <?php endif; ?>

    <!-- Footer -->
    <footer class="footer glass-bg">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-brand">
                        <img src="/Laburar/public/assets/img/icons/logo-64.png" alt="LaburAR" class="footer-logo">
                        <span class="footer-brand-text">LaburAR</span>
                    </div>
                    <p>La plataforma argentina líder en freelancing profesional</p>
                    
                    <!-- Trust Stats -->
                    <div class="footer-stats">
                        <div class="stat">
                            <span class="stat-number"><?= number_format($platformStats['freelancers_count'] ?? 5420) ?></span>
                            <span class="stat-label">Freelancers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number"><?= number_format($platformStats['projects_completed'] ?? 12500) ?></span>
                            <span class="stat-label">Proyectos</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">98%</span>
                            <span class="stat-label">Satisfacción</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h4>Para Freelancers</h4>
                    <ul>
                        <li><a href="/Laburar/register.php">Crear Perfil</a></li>
                        <li><a href="/Laburar/how-it-works.php">Cómo Funciona</a></li>
                        <li><a href="/Laburar/fees.php">Comisiones</a></li>
                        <li><a href="/Laburar/success-stories.php">Casos de Éxito</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Para Clientes</h4>
                    <ul>
                        <li><a href="/Laburar/post-project.php">Publicar Proyecto</a></li>
                        <li><a href="/Laburar/marketplace.php">Explorar Servicios</a></li>
                        <li><a href="/Laburar/enterprise.php">LaburAR Enterprise</a></li>
                        <li><a href="/Laburar/guarantees.php">Garantías</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>Soporte</h4>
                    <ul>
                        <li><a href="/Laburar/help.php">Centro de Ayuda</a></li>
                        <li><a href="/Laburar/contact.php">Contacto</a></li>
                        <li><a href="/Laburar/legal/terms.php">Términos</a></li>
                        <li><a href="/Laburar/legal/privacy.php">Privacidad</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 LaburAR. Todos los derechos reservados.</p>
                <div class="payment-methods">
                    <img src="/Laburar/public/assets/img/payments/mercadopago.svg" alt="MercadoPago">
                    <img src="/Laburar/public/assets/img/payments/visa.svg" alt="Visa">
                    <img src="/Laburar/public/assets/img/payments/mastercard.svg" alt="Mastercard">
                </div>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="/Laburar/public/assets/js/marketplace.js"></script>
    <script src="/Laburar/public/assets/js/advanced-search.js"></script>
    <script src="/Laburar/public/assets/js/micro-interactions.js"></script>
    <script>
        // Toggle advanced filters
        function toggleAdvancedFilters() {
            const filters = document.getElementById('advancedFilters');
            const toggle = document.querySelector('.toggle-filters');
            
            filters.classList.toggle('show');
            toggle.classList.toggle('active');
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

        // View toggle functionality
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.dataset.view;
                const grid = document.getElementById('servicesGrid');
                
                // Update active button
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update grid view
                grid.className = `services-grid ${view}-view`;
                
                // Store preference
                localStorage.setItem('marketplace-view', view);
            });
        });

        // Restore view preference
        document.addEventListener('DOMContentLoaded', function() {
            const savedView = localStorage.getItem('marketplace-view') || 'grid';
            const viewBtn = document.querySelector(`[data-view="${savedView}"]`);
            const grid = document.getElementById('servicesGrid');
            
            if (viewBtn) {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                viewBtn.classList.add('active');
                grid.className = `services-grid ${savedView}-view`;
            }
        });

        // Mobile navigation
        document.getElementById('navToggle').addEventListener('click', function() {
            document.getElementById('navMenu').classList.toggle('show');
        });

        // Search form auto-submit on filter change
        document.querySelectorAll('.search-select, .search-input').forEach(element => {
            element.addEventListener('change', function() {
                // Auto-submit form when filters change (optional)
                // this.closest('form').submit();
            });
        });
    </script>
</body>
</html>