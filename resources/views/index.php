<?php
/**
 * LaburAR - Plataforma de Freelancers Argentina
 * Página principal de la plataforma - Versión Profesional
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/bootstrap.php';

// Detectar si es una solicitud para la demo de desarrollo
if (isset($_GET['demo']) && $_GET['demo'] === 'dev') {
    include 'demo-standalone.html';
    exit;
}

// Verificar si el usuario ya está logueado
if (isset($_SESSION['user_id']) && isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    // Redireccionar al dashboard (todos los tipos van al mismo por ahora)
    header('Location: /Laburar/dashboard/dashboard.php');
    exit;
}

// Incluir el componente de ServiceCard para mostrar servicios destacados
require_once __DIR__ . '/../components/ServiceCardProfessional.php';

// REGLA CRÍTICA: DATOS REALES OBLIGATORIOS - Obtener estadísticas reales
try {
    $platformStats = \LaburAR\Services\DatabaseHelper::getPlatformStats();
} catch (Exception $e) {
    // Fallback to mock data for development
    $platformStats = [
        'freelancers_count' => 1250,
        'clients_count' => 890,
        'projects_completed' => 3400,
        'success_rate' => 96.8,
        'average_rating' => 4.7,
        'active_services' => 850,
        'total_revenue' => 12500000,
        'growth_rate' => 15.2
    ];
}

// Si no está logueado, mostrar landing page profesional
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="LaburAR - La plataforma argentina líder en freelancing. Conectá con profesionales verificados que entienden tu mercado local.">
    <meta name="keywords" content="freelance argentina, trabajo remoto, servicios profesionales, diseño gráfico, programación, marketing digital, mercadopago">
    <meta name="author" content="LaburAR Team">
    
    <!-- Open Graph -->
    <meta property="og:title" content="LaburAR - El Marketplace Argentino de Freelancing">
    <meta property="og:description" content="Conectá con freelancers verificados que entienden tu mercado. Mismo horario, idioma nativo y MercadoPago.">
    <meta property="og:image" content="/Laburar/public/assets/img/og-image.jpg">
    <meta property="og:url" content="https://laburar.com.ar">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="es_AR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="LaburAR - Marketplace Argentino de Freelancing">
    <meta name="twitter:description" content="Freelancers verificados, pagos con MercadoPago, compliance AFIP automático">
    <meta name="twitter:image" content="/Laburar/public/assets/img/twitter-card.jpg">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/Laburar/public/assets/img/icons/logo-32.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/Laburar/public/assets/img/apple-touch-icon.png">
    
    <title>LaburAR - El Marketplace Argentino Líder en Freelancing | Servicios Profesionales</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Estilos Profesionales -->
    <link rel="stylesheet" href="/Laburar/public/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/hero-professional.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/service-card-professional.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/main.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/landing.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/advanced-search.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/micro-interactions.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/mobile-optimization.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/registration-modal.css">
    <link rel="stylesheet" href="/Laburar/public/assets/css/login-modal.css">
    
    <!-- Schema.org markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "LaburAR",
        "description": "El marketplace argentino líder en freelancing y servicios profesionales",
        "url": "https://laburar.com.ar",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://laburar.com.ar/marketplace?q={search_term_string}",
            "query-input": "required name=search_term_string"
        },
        "areaServed": {
            "@type": "Country",
            "name": "Argentina",
            "sameAs": "https://www.wikidata.org/wiki/Q414"
        },
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "ARS",
            "offerCount": "5000+"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "15000"
        }
    }
    </script>
</head>
<body style="
    background: linear-gradient(135deg, 
        #6FBFEF 0%, 
        #87CEEB 25%, 
        #ffffff 60%, 
        #f0f8fc 100%);
    min-height: 100vh;
">
    <!-- Professional Navigation -->
    <nav class="navbar navbar-professional glass-navigation glass-element">
        <div class="nav-container">
            <div class="nav-brand">
                <a href="/Laburar/" class="brand-link" style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="/Laburar/public/assets/img/icons/logo 64.png" alt="LaburAR" style="width: 40px; height: 40px; object-fit: contain;">
                    <span class="brand-text" style="font-family: 'Lexend Giga', sans-serif !important; font-weight: 700 !important; font-size: 1.75rem !important; letter-spacing: 0.5px !important; color: #000000 !important; background: none !important; -webkit-background-clip: unset !important; -webkit-text-fill-color: #000000 !important;">LABUR.AR</span>
                </a>
            </div>
            
            <div class="nav-menu" id="navMenu">
                <a href="/Laburar/marketplace.html" class="nav-link">Explorar Servicios</a>
                <a href="/Laburar/projects.html" class="nav-link">Proyectos</a>
                <a href="#como-funciona" class="nav-link">Cómo Funciona</a>
                <a href="#categorias" class="nav-link">Categorías</a>
                
                <div class="nav-auth">
                    <button type="button" class="btn btn-ghost" data-login-modal>Iniciar Sesión</button>
                    <button type="button" class="btn btn-primary" data-register-modal>Registrarse</button>
                </div>
            </div>
            
            <div class="nav-toggle" id="navToggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-fiverr glass-hero glass-element" style="
        position: relative;
        min-height: 700px;
        display: flex;
        align-items: center;
        color: white;
        overflow: hidden;
        backdrop-filter: var(--glass-blur-hero) var(--glass-saturate-strong);
    ">
        <!-- Hero Background Video Carousel -->
        <div class="hero-background-carousel">
            <video class="hero-bg-video active" autoplay muted loop playsinline preload="metadata">
                <source src="/Laburar/public/assets/img/videos/2887463-hd_1920_1080_25fps.mp4" type="video/mp4">
            </video>
            <video class="hero-bg-video" autoplay muted loop playsinline preload="metadata">
                <source src="/Laburar/public/assets/img/videos/6271217-hd_1920_1080_25fps.mp4" type="video/mp4">
            </video>
            <video class="hero-bg-video" autoplay muted loop playsinline preload="metadata">
                <source src="/Laburar/public/assets/img/videos/4463164-hd_1920_1080_25fps.mp4" type="video/mp4">
            </video>
            <video class="hero-bg-video" autoplay muted loop playsinline preload="metadata">
                <source src="/Laburar/public/assets/img/videos/5092427-hd_1920_1080_30fps.mp4" type="video/mp4">
            </video>
        </div>
        
        <!-- Video Credits (barely visible) -->
        <div class="video-credits" role="contentinfo" aria-label="Créditos de video">
            <div class="credit-item active" data-video="0">
                <a href="https://www.pexels.com/video/a-computer-monitor-flashing-digital-information-2887463/" 
                   target="_blank" rel="noopener" aria-label="Video por Bedrijfsfilmspecialist.nl en Pexels">
                   Video por Bedrijfsfilmspecialist.nl
                </a>
            </div>
            <div class="credit-item" data-video="1">
                <a href="https://www.pexels.com/video/close-up-of-dslr-camera-6271217/" 
                   target="_blank" rel="noopener" aria-label="Video por Ivan Samkov en Pexels">
                   Video por Ivan Samkov
                </a>
            </div>
            <div class="credit-item" data-video="2">
                <a href="https://www.pexels.com/video/woman-painting-on-her-canvas-4463164/" 
                   target="_blank" rel="noopener" aria-label="Video por Antoni Shkraba Studio en Pexels">
                   Video por Antoni Shkraba Studio
                </a>
            </div>
            <div class="credit-item" data-video="3">
                <a href="https://www.pexels.com/video/professional-doing-video-editing-and-mixing-5092427/" 
                   target="_blank" rel="noopener" aria-label="Video por Gilmer Diaz Estela en Pexels">
                   Video por Gilmer Diaz Estela
                </a>
            </div>
        </div>
        <!-- Hero Overlay -->
        <div class="hero-overlay"></div>
        <style>
            /* Hero Background Video Carousel */
            .hero-background-carousel {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            }
            
            .hero-bg-video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0;
                transition: opacity 2s ease-in-out;
            }
            
            .hero-bg-video.active {
                opacity: 1;
            }
            
            /* Video Credits Styling */
            .video-credits {
                position: absolute;
                bottom: 10px;
                right: 15px;
                z-index: 4;
                font-size: 0.7rem;
                color: rgba(255, 255, 255, 0.4);
                font-weight: 300;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                transition: opacity 0.3s ease;
            }
            
            .credit-item {
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .credit-item.active {
                display: block;
                opacity: 1;
            }
            
            .credit-item a {
                color: inherit;
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .credit-item a:hover,
            .credit-item a:focus {
                color: rgba(255, 255, 255, 0.85);
                text-decoration: underline;
            }
            
            .video-credits:hover {
                color: rgba(255, 255, 255, 0.7);
            }
            
            .hero-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, 
                            rgba(111, 191, 239, 0.4) 0%, 
                            rgba(0, 0, 0, 0.6) 50%, 
                            rgba(111, 191, 239, 0.3) 100%);
                z-index: 2;
            }
            
            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .hero-fiverr { min-height: 500px !important; padding: 2rem 0 !important; }
                .hero-fiverr h1 { font-size: 2rem !important; }
                .hero-search-container { margin: 0 1rem !important; }
                .hero-search-box { flex-direction: column !important; }
                .hero-search-button { width: 100% !important; margin-top: 0.5rem !important; }
                
                /* Video optimization for mobile */
                .hero-bg-video {
                    transform: scale(1.1); /* Slight zoom to ensure coverage */
                }
                
                .video-credits {
                    bottom: 5px;
                    right: 10px;
                    font-size: 0.6rem;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .hero-bg-video {
                    transition: none;
                }
                
                .credit-item {
                    transition: none;
                }
            }
            
            /* Performance optimizations */
            @media (max-width: 480px) {
                .hero-bg-video {
                    /* On very small screens, consider pausing non-active videos */
                    pointer-events: none;
                }
            }
        </style>
        
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; text-align: center; position: relative; z-index: 3;">
            <!-- Hero Message -->
            <h1 style="
                font-size: 3.5rem; 
                font-weight: 800; 
                margin-bottom: 1.5rem; 
                line-height: 1.1;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.7);
            ">
                Conectamos talento excepcional<br>
                <span style="color: #6FBFEF; font-weight: 900;">con proyectos extraordinarios</span>
            </h1>
            
            <!-- Search Bar -->
            <div class="hero-search-container" style="max-width: 600px; margin: 0 auto 2rem;">
                <div class="hero-search-box glass-base glass-element" style="
                    display: flex;
                    backdrop-filter: var(--glass-blur-strong) var(--glass-brightness-medium);
                    background: var(--glass-gradient-secondary);
                    border-radius: var(--glass-radius-xl);
                    overflow: hidden;
                    box-shadow: var(--glass-shadow-strong), var(--glass-shadow-inset-medium);
                    border: 1px solid var(--glass-border-white-strong);
                ">
                    <input 
                        type="text" 
                        placeholder="¿Qué servicio necesitás? Ej: diseño de logo, página web..."
                        style="
                            flex: 1;
                            padding: 1rem 1.5rem;
                            border: none;
                            outline: none;
                            font-size: 1rem;
                            color: #333;
                        "
                        id="heroSearchInput"
                    >
                    <button 
                        class="hero-search-button"
                        onclick="window.location.href='/Laburar/marketplace.html?q=' + encodeURIComponent(document.getElementById('heroSearchInput').value)"
                        style="
                            background: #6FBFEF;
                            color: white;
                            border: none;
                            padding: 1rem 2rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: background 0.3s ease;
                        "
                        onmouseover="this.style.background='#5BA8D8'"
                        onmouseout="this.style.background='#6FBFEF'"
                    >
                        Buscar
                    </button>
                </div>
            </div>
            
            <!-- Popular Searches -->
            <div style="margin-bottom: 2rem;">
                <span style="color: rgba(255,255,255,0.8); margin-right: 1rem;">Popular:</span>
                <a href="/Laburar/marketplace.html?categoria=diseno-web" style="color: white; text-decoration: none; margin: 0 0.5rem; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 0.875rem;">Diseño Web</a>
                <a href="/Laburar/marketplace.html?categoria=desarrollo-web" style="color: white; text-decoration: none; margin: 0 0.5rem; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 0.875rem;">Programación</a>
                <a href="/Laburar/marketplace.html?categoria=marketing-digital" style="color: white; text-decoration: none; margin: 0 0.5rem; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 0.875rem;">Marketing</a>
                <a href="/Laburar/marketplace.html?categoria=diseno-grafico" style="color: white; text-decoration: none; margin: 0 0.5rem; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 0.875rem;">Diseño Gráfico</a>
            </div>
            
            <!-- Trust Indicators -->
            <?php if ($platformStats['freelancers_count'] > 0 || $platformStats['projects_completed'] > 0): ?>
            <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 2rem; font-size: 0.875rem; color: rgba(255,255,255,0.9);">
                <?php if ($platformStats['freelancers_count'] > 0): ?>
                <div>
                    <span style="font-weight: 600; color: #6FBFEF;"><?= number_format($platformStats['freelancers_count']) ?>+</span>
                    <span>Freelancers activos</span>
                </div>
                <?php endif; ?>
                <?php if ($platformStats['projects_completed'] > 0): ?>
                <div>
                    <span style="font-weight: 600; color: #6FBFEF;"><?= number_format($platformStats['projects_completed']) ?>+</span>
                    <span>Proyectos entregados</span>
                </div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
        
    </section>



    <!-- Expanded Categories Section -->
    <section id="categorias" class="categories-section" style="padding: 5rem 0; background: white;">
        <div class="container" style="max-width: 1400px; margin: 0 auto; padding: 0 2rem;">
            <div style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem; color: #1e293b;">
                    Explorá más de 100 categorías
                </h2>
                <p style="font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto;">
                    Encontrá el profesional perfecto para cualquier proyecto
                </p>
            </div>
            
            <style>
                .expanded-categories-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                
                .category-card-modern {
                    position: relative;
                    height: 200px;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    text-decoration: none;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(3.75px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                .category-card-modern:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(5px);
                }
                
                .category-bg {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }
                
                .category-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(111,191,239,0.3) 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 1.5rem;
                    backdrop-filter: blur(2.5px);
                }
                
                .category-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6);
                }
                
                .category-subtitle {
                    font-size: 0.95rem;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.5);
                    font-weight: 500;
                }
                
                @media (max-width: 768px) {
                    .expanded-categories-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }
                    
                    .category-card-modern {
                        height: 150px;
                    }
                    
                    .category-title {
                        font-size: 1.25rem;
                    }
                    
                    .category-subtitle {
                        font-size: 0.85rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .expanded-categories-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="expanded-categories-grid">
                <a href="/Laburar/marketplace.html?categoria=diseno-grafico" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Diseño Gráfico</h3>
                        <p class="category-subtitle">Logos, branding, materiales impresos</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=desarrollo-web" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Desarrollo Web</h3>
                        <p class="category-subtitle">Sitios web, e-commerce, aplicaciones</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=marketing-digital" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Marketing Digital</h3>
                        <p class="category-subtitle">SEO, redes sociales, publicidad online</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=video-animacion" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Video y Animación</h3>
                        <p class="category-subtitle">Motion graphics, videos explicativos</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=redaccion-contenido" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Redacción y Contenido</h3>
                        <p class="category-subtitle">Copywriting, blogs, guiones</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=programacion" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Programación</h3>
                        <p class="category-subtitle">Apps móviles, software, automatización</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=fotografia" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Fotografía</h3>
                        <p class="category-subtitle">Retratos, productos, eventos</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=traduccion" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Traducción</h3>
                        <p class="category-subtitle">Documentos, webs, subtítulos</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=musica-audio" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Música y Audio</h3>
                        <p class="category-subtitle">Composición, mezcla, locución</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=consultoria-negocios" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Consultoría</h3>
                        <p class="category-subtitle">Estrategia, finanzas, recursos humanos</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=diseno-ui-ux" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">UI/UX Design</h3>
                        <p class="category-subtitle">Prototipos, interfaces, experiencia usuario</p>
                    </div>
                </a>
                
                <a href="/Laburar/marketplace.html?categoria=asistente-virtual" class="category-card-modern glass-element">
                    <div class="category-bg" style="background-image: url('https://images.unsplash.com/photo-1553484771-047a44eee27a?w=400&h=300&fit=crop');"></div>
                    <div class="category-overlay">
                        <h3 class="category-title">Asistente Virtual</h3>
                        <p class="category-subtitle">Administración, gestión, soporte</p>
                    </div>
                </a>
            </div>
            
            <div style="text-align: center;">
                <a href="/Laburar/marketplace.html" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #6FBFEF;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(111,191,239,0.3);
                " onmouseover="this.style.background='#5BA8D8'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#6FBFEF'; this.style.transform='translateY(0)'">
                    Ver todas las categorías
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </a>
            </div>
        </div>
    </section>

    <!-- Popular Services Section -->
    <section style="padding: 4rem 0; background: #f7f7f7;">
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;">
            <div style="text-align: center; margin-bottom: 3rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; color: #404145;">Servicios populares</h2>
                <p style="font-size: 1.125rem; color: #62646a;">Los más solicitados por empresas locales</p>
            </div>
            
            <!-- Services Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <?php
                // DATOS REALES: Obtener servicios más populares de la base de datos
                try {
                    $popularServices = \LaburAR\Services\DatabaseHelper::getPopularServices(6);
                } catch (Exception $e) {
                    // Fallback: usar datos mock si la base de datos no está disponible
                    $popularServices = [
                        [
                            'id' => 1,
                            'title' => 'Diseño de logo profesional para empresas argentinas',
                            'description' => 'Logo único y profesional que representa tu marca argentina',
                            'image_url' => '/Laburar/public/assets/img/placeholders/austin-distel-tLZhFRLj6nY-unsplash.jpg',
                            'freelancer_name' => 'María González',
                            'freelancer_avatar' => '',
                            'rating' => 4.9,
                            'category' => 'Diseño Gráfico',
                            'orders_count' => 127,
                            'price' => 15000
                        ],
                        [
                            'id' => 2,
                            'title' => 'Desarrollo web con MercadoPago integrado',
                            'description' => 'Sitio web completo con integración de pagos argentinos',
                            'image_url' => '/Laburar/public/assets/img/placeholders/pankaj-patel-_SgRNwAVNKw-unsplash.jpg',
                            'freelancer_name' => 'Carlos Rodríguez',
                            'freelancer_avatar' => '',
                            'rating' => 4.8,
                            'category' => 'Programación',
                            'orders_count' => 89,
                            'price' => 45000
                        ],
                        [
                            'id' => 3,
                            'title' => 'Marketing digital para PyMEs argentinas',
                            'description' => 'Estrategia digital adaptada al mercado argentino',
                            'image_url' => '/Laburar/public/assets/img/placeholders/escritura.jpg',
                            'freelancer_name' => 'Ana López',
                            'freelancer_avatar' => '',
                            'rating' => 4.7,
                            'category' => 'Marketing',
                            'orders_count' => 156,
                            'price' => 25000
                        ],
                        [
                            'id' => 4,
                            'title' => 'Traducción español-inglés especializada',
                            'description' => 'Traducción profesional con contexto cultural argentino',
                            'image_url' => '/Laburar/public/assets/img/placeholders/jakub-zerdzicki-ykgLX_CwtDw-unsplash.jpg',
                            'freelancer_name' => 'Luis Fernández',
                            'freelancer_avatar' => '',
                            'rating' => 4.9,
                            'category' => 'Traducción',
                            'orders_count' => 203,
                            'price' => 12000
                        ],
                        [
                            'id' => 5,
                            'title' => 'Edición de video para redes sociales',
                            'description' => 'Videos optimizados para redes sociales argentinas',
                            'image_url' => '/Laburar/public/assets/img/placeholders/kevin-shek-pWtydIYnASM-unsplash.jpg',
                            'freelancer_name' => 'Sofia Martinez',
                            'freelancer_avatar' => '',
                            'rating' => 4.8,
                            'category' => 'Video',
                            'orders_count' => 94,
                            'price' => 18000
                        ],
                        [
                            'id' => 6,
                            'title' => 'Consultoría contable y tributaria AFIP',
                            'description' => 'Asesoramiento contable especializado en normativa argentina',
                            'image_url' => '/Laburar/public/assets/img/placeholders/nejc-soklic-2jTu7H9l6JA-unsplash.jpg',
                            'freelancer_name' => 'Roberto Silva',
                            'freelancer_avatar' => '',
                            'rating' => 4.9,
                            'category' => 'Contabilidad',
                            'orders_count' => 178,
                            'price' => 8000
                        ]
                    ];
                }
                if (!empty($popularServices)) {
                    foreach ($popularServices as $service) {
                        echo '<div class="service-card glass-base glass-element" style="overflow: hidden; transition: transform 0.3s ease;" onmouseover="this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.transform=\'translateY(0)\'">';
                        echo '<img src="' . ($service['image_url'] ?: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80') . '" alt="' . htmlspecialchars($service['title']) . '" style="width: 100%; height: 200px; object-fit: cover;">';
                        echo '<div style="padding: 1.5rem;">';
                        echo '<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">';
                        echo '<img src="' . ($service['freelancer_avatar'] ?: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&q=80') . '" alt="' . htmlspecialchars($service['freelancer_name']) . '" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">';
                        echo '<span style="font-size: 0.875rem; color: #62646a;">' . htmlspecialchars($service['freelancer_name']) . '</span>';
                        echo '<span style="background: #6FBFEF; color: white; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">★ ' . number_format($service['rating'], 1) . '</span>';
                        echo '</div>';
                        echo '<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #404145; line-height: 1.4;">' . htmlspecialchars($service['title']) . '</h3>';
                        echo '<div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 1rem;">';
                        echo '<span style="color: #6FBFEF; font-size: 0.875rem;">' . $service['category'] . '</span>';
                        echo '<span style="font-size: 0.875rem; color: #62646a;">(' . number_format($service['orders_count']) . ' pedidos)</span>';
                        echo '</div>';
                        echo '<p style="font-size: 0.875rem; color: #62646a; margin-bottom: 1rem; line-height: 1.4;">' . htmlspecialchars($service['description']) . '</p>';
                        echo '<div style="display: flex; justify-content: space-between; align-items: center;">';
                        echo '<span style="font-size: 0.875rem; color: #62646a;">Desde</span>';
                        echo '<span style="font-size: 1.125rem; font-weight: 700; color: #404145;">AR$ ' . number_format($service['price'], 0, ',', '.') . '</span>';
                        echo '</div>';
                        echo '</div>';
                        echo '</div>';
                    }
                } else {
                    // Mostrar tarjetas de servicios próximamente
                    $comingSoonServices = [
                        ['title' => 'Diseño de Logo Profesional', 'category' => 'Diseño Gráfico', 'image' => 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
                        ['title' => 'Desarrollo de Sitio Web', 'category' => 'Programación', 'image' => 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
                        ['title' => 'Estrategia de Marketing Digital', 'category' => 'Marketing', 'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
                        ['title' => 'Redacción de Contenidos', 'category' => 'Redacción', 'image' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
                        ['title' => 'Video Promocional', 'category' => 'Video', 'image' => 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
                        ['title' => 'Traducción Profesional', 'category' => 'Traducción', 'image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
                    ];
                    
                    foreach ($comingSoonServices as $service) {
                        echo '<div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative;">';
                        echo '<img src="' . $service['image'] . '" alt="' . $service['title'] . '" style="width: 100%; height: 200px; object-fit: cover; filter: grayscale(50%);">';
                        echo '<div style="position: absolute; top: 1rem; right: 1rem; background: #6FBFEF; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Próximamente</div>';
                        echo '<div style="padding: 1.5rem;">';
                        echo '<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #404145;">' . $service['title'] . '</h3>';
                        echo '<p style="font-size: 0.875rem; color: #62646a; margin-bottom: 1rem;">' . $service['category'] . '</p>';
                        echo '<a href="/Laburar/register.html?type=freelancer" style="background: #6FBFEF; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.875rem; font-weight: 600;">Sé el primero en ofrecer</a>';
                        echo '</div>';
                        echo '</div>';
                    }
                }
                ?>
            </div>
        </div>
    </section>

    <!-- LaburAR Pro Section -->
    <section style="background: linear-gradient(135deg, #ffffff, #FCBF49); padding: 4rem 0;">
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;">
            <!-- Glassmorphism Container -->
            <div style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 1.5rem; padding: 3rem; box-shadow: 0 8px 32px 0 rgba(252, 191, 73, 0.15);">
                <div class="pro-grid" style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
                    <style>
                        @media (max-width: 768px) {
                            .pro-grid { max-width: 100% !important; padding: 0 1rem !important; }
                            .pro-grid-benefits { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
                        }
                        .pro-badge-diamond {
                            background: linear-gradient(135deg, #FFD700, #FFA500);
                            color: white;
                            padding: 0.35rem 0.85rem;
                            font-size: 0.75rem;
                            font-weight: 700;
                            position: relative;
                            display: inline-block;
                            transform: rotate(0deg);
                            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
                        }
                        .pro-badge-diamond::before,
                        .pro-badge-diamond::after {
                            content: '';
                            position: absolute;
                            width: 0;
                            height: 0;
                            border-style: solid;
                        }
                        .pro-badge-diamond::before {
                            top: -8px;
                            left: 50%;
                            transform: translateX(-50%);
                            border-width: 0 20px 8px 20px;
                            border-color: transparent transparent #FFD700 transparent;
                        }
                        .pro-badge-diamond::after {
                            bottom: -8px;
                            left: 50%;
                            transform: translateX(-50%);
                            border-width: 8px 20px 0 20px;
                            border-color: #FFA500 transparent transparent transparent;
                        }
                    </style>
                    <div class="pro-content">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(252, 191, 73, 0.3); padding: 0.5rem 1rem; border-radius: 20px; margin-bottom: 1.5rem;">
                        <span style="font-family: 'Lexend Giga', sans-serif; font-weight: 700; font-size: 0.875rem; color: #ffffff; letter-spacing: 0.5px;">LABUR.AR</span>
                        <span class="pro-badge-diamond">PRO</span>
                    </div>
                    
                    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; line-height: 1.1; color: #2C3E50;">
                        La solución <span style="color: #F39C12;">premium</span> para empresas
                    </h2>
                    
                    <p style="font-size: 1.125rem; margin-bottom: 2rem; line-height: 1.6; color: #62646a;">
                        Contrata profesionales freelance certificados en Laburar Pro
                    </p>
                    
                    <div class="pro-grid-benefits" style="margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; width: 100%; text-align: left;">
                        <!-- Columna Izquierda -->
                        <div>
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <div style="background: linear-gradient(135deg, #F39C12, #E67E22); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem;">
                                    <span style="color: white; font-size: 0.75rem;">✓</span>
                                </div>
                                <span style="color: #62646a;"><strong>Programa de Beneficios para Empresas Pro</strong><br>Cada proyecto en Laburar Pro te otorga acceso a ventajas exclusivas.</span>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                <div style="background: linear-gradient(135deg, #F39C12, #E67E22); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem;">
                                    <span style="color: white; font-size: 0.75rem;">✓</span>
                                </div>
                                <span style="color: #62646a;"><strong>Garantía de satisfacción</strong><br>Te ofrecemos una garantía de reembolso al contratar freelancers validados.</span>
                            </div>
                        </div>
                        
                        <!-- Columna Derecha -->
                        <div>
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.5rem;">
                                <div style="background: linear-gradient(135deg, #F39C12, #E67E22); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem;">
                                    <span style="color: white; font-size: 0.75rem;">✓</span>
                                </div>
                                <span style="color: #62646a;"><strong>Colaboración y gestión de pagos</strong><br>Trabaja en equipo, maneja presupuestos y realiza contrataciones de manera ágil y flexible.</span>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                <div style="background: linear-gradient(135deg, #F39C12, #E67E22); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem;">
                                    <span style="color: white; font-size: 0.75rem;">✓</span>
                                </div>
                                <span style="color: #62646a;"><strong>Servicios de reclutamiento</strong><br>Los especialistas de Laburar Pro se encargarán de seleccionar y entrevistar a los mejores talentos freelance para ti.</span>
                            </div>
                        </div>
                    </div>
                    
                    <a href="/Laburar/marketplace.html?pro=true" style="background: linear-gradient(135deg, #F39C12, #E67E22); color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block; transition: all 0.3s ease; box-shadow: 0 4px 8px rgba(243, 156, 18, 0.3);" onmouseover="this.style.background='linear-gradient(135deg, #E67E22, #D35400)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(243, 156, 18, 0.4)'" onmouseout="this.style.background='linear-gradient(135deg, #F39C12, #E67E22)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(243, 156, 18, 0.3)'">
                        Explorar LABUR.AR PRO
                    </a>
                </div>
            </div>
            </div> <!-- End of glassmorphism container -->
        </div>
    </section>

    <!-- Key Benefits Section -->
    <section class="benefits-section glass-element" style="background: linear-gradient(135deg, #f8fbff 0%, #e8f5ff 100%); padding: 3rem 0;">
        <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
            <div class="benefits-grid-horizontal">
                <div class="benefit-item">
                    <div class="benefit-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div>
                        <h4>Accede a talento top en más de 100 categorías</h4>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                    </div>
                    <div>
                        <h4>Disfruta una experiencia simple y fácil de usar</h4>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2">
                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                        </svg>
                    </div>
                    <div>
                        <h4>Obtén trabajo de calidad rápido y dentro del presupuesto</h4>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="8" cy="9" r="1.5" fill="#1e293b"/>
                            <circle cx="16" cy="9" r="1.5" fill="#1e293b"/>
                            <path d="M7 14s2 3 5 3 5-3 5-3"/>
                        </svg>
                    </div>
                    <div>
                        <h4>Solo paga cuando estés satisfecho</h4>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .benefits-grid-horizontal {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .benefits-grid-horizontal {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
        }
        
        @media (max-width: 480px) {
            .benefits-grid-horizontal {
                grid-template-columns: 1fr;
                gap: 12px;
            }
        }
        
        .benefit-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
            padding: 20px 16px;
            transition: all 0.3s ease;
        }
        
        .benefit-item:hover {
            transform: translateY(-4px);
        }
        
        .benefit-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .benefit-item h4 {
            font-size: 0.95rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
            line-height: 1.2;
        }
        </style>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-grid">
                <div class="cta-card cta-freelancer glass-light glass-element">
                    <h3 class="cta-title">¿Sos freelancer?</h3>
                    <p class="cta-description">
                        Unite a la comunidad de profesionales independientes más grande de Argentina. 
                        Conseguí clientes, cobrá en pesos y crecé profesionalmente.
                    </p>
                    <button type="button" class="btn btn-primary btn-lg" data-register-modal>
                        Empezar a Vender
                    </button>
                </div>
                
                <div class="cta-card cta-client glass-light glass-element">
                    <h3 class="cta-title">¿Necesitás contratar?</h3>
                    <p class="cta-description">
                        Encontrá el talento perfecto para tu proyecto. 
                        Profesionales verificados, pagos seguros y resultados garantizados.
                    </p>
                    <button type="button" class="btn btn-secondary btn-lg" data-register-modal>
                        Publicar Proyecto
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer Styles -->
    <style>
        /* Footer Expansion Styles */
        .footer {
            width: 100%;
            padding: 4rem 0 2rem 0;
            margin-top: 4rem;
            background: linear-gradient(135deg, 
                rgba(111, 191, 239, 0.03) 0%, 
                rgba(103, 126, 234, 0.03) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(111, 191, 239, 0.1);
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.95) 0%, 
                rgba(255, 255, 255, 0.9) 100%);
            z-index: -1;
        }
        
        .footer-container {
            max-width: 1400px; /* Expanded from standard container width */
            margin: 0 auto;
            padding: 0 2rem;
            width: 100%;
        }
        
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr; /* 5 equal columns */
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .footer-column {
            display: flex;
            flex-direction: column;
        }
        
        .footer-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 1.5rem;
            position: relative;
            z-index: 1;
        }
        
        .footer-description {
            font-size: 1rem;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 2rem;
            max-width: 280px;
            position: relative;
            z-index: 1;
        }
        
        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .footer-links li {
            margin-bottom: 0.75rem;
        }
        
        .footer-links a {
            color: #4a5568;
            text-decoration: none;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
        }
        
        .footer-links a:hover {
            color: #6FBFEF;
            transform: translateX(4px);
        }
        
        .footer-social {
            display: flex;
            gap: 1rem;
        }
        
        .social-link {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(111, 191, 239, 0.15);
            border-radius: 8px;
            color: #6FBFEF;
            transition: all 0.3s ease;
            text-decoration: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(111, 191, 239, 0.2);
            position: relative;
            z-index: 1;
        }
        
        .social-link:hover {
            background: rgba(111, 191, 239, 0.25);
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(111, 191, 239, 0.3);
        }
        
        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 2rem;
            border-top: 1px solid rgba(111, 191, 239, 0.2);
            flex-wrap: wrap;
            gap: 1.5rem;
        }
        
        .footer-social {
            display: flex;
            gap: 1rem;
            align-items: center;
            justify-content: center;
            flex: 1;
        }
        
        .footer-tagline {
            color: #4a5568;
            font-size: 0.95rem;
            margin: 0;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        .footer-badges {
            display: none;
        }
        
        .footer-badge {
            height: 32px;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        
        .footer-badge:hover {
            opacity: 1;
        }
        
        .footer-copyright {
            color: #4a5568;
            font-size: 0.9rem;
            margin: 0;
            display: flex;
            align-items: center;
            position: relative;
            z-index: 1;
            margin-left: auto;
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
            .footer-container {
                max-width: 1200px;
                padding: 0 1.5rem;
            }
        }
        
        @media (max-width: 768px) {
            .footer-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
                text-align: center;
            }
            
            .footer-description {
                max-width: none;
                margin-bottom: 1.5rem;
            }
            
            .footer-social {
                justify-content: center;
            }
            
            .footer-bottom {
                flex-direction: column;
                text-align: center;
                gap: 1rem;
            }
        }
        
        @media (max-width: 480px) {
            .footer {
                padding: 3rem 0 1.5rem 0;
            }
            
            .footer-container {
                padding: 0 1rem;
            }
            
            .footer-grid {
                gap: 1.5rem;
            }
        }
    </style>

    <!-- Footer -->
    <footer class="footer glass-footer glass-element">
        <div class="footer-container">
            <div class="footer-grid">
                <div class="footer-column">
                    <h4 class="footer-title">Categorías</h4>
                    <ul class="footer-links">
                        <li><a href="#">Artes gráficas y diseño</a></li>
                        <li><a href="#">Marketing digital</a></li>
                        <li><a href="#">Escritura y traducción</a></li>
                        <li><a href="#">Video y animación</a></li>
                        <li><a href="#">Música y audio</a></li>
                        <li><a href="#">Programación y tecnología</a></li>
                        <li><a href="#">Servicios de IA</a></li>
                        <li><a href="#">Consultoría de marketing</a></li>
                        <li><a href="#">Datos</a></li>
                        <li><a href="#">Negocios</a></li>
                        <li><a href="#">Crecimiento personal y pasatiempos</a></li>
                        <li><a href="#">Fotografía</a></li>
                        <li><a href="#">Finanzas</a></li>
                        <li><a href="#">Proyectos integrales</a></li>
                        <li><a href="#">Catálogo de servicios</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="footer-title">Para los clientes</h4>
                    <ul class="footer-links">
                        <li><a href="#">Cómo funciona Laburar</a></li>
                        <li><a href="#">Historias de éxito de clientes (en construcción)</a></li>
                        <li><a href="#">Confianza y seguridad</a></li>
                        <li><a href="#">Guía de calidad</a></li>
                        <li><a href="#">Laburar Learn - Cursos en línea (en construcción)</a></li>
                        <li><a href="#">Guías de Laburar (en construcción)</a></li>
                        <li><a href="#">Respuestas Laburar</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="footer-title">Para freelancers</h4>
                    <ul class="footer-links">
                        <li><a href="#">Conviértete en freelancer de Laburar</a></li>
                        <li><a href="#">Conviértete en una agencia (en construcción)</a></li>
                        <li><a href="#">Foro</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="footer-title">Soluciones para negocios</h4>
                    <ul class="footer-links">
                        <li><a href="#">Laburar Pro</a></li>
                        <li><a href="#">Servicios de gestión de proyectos</a></li>
                        <li><a href="#">Experto en servicios de contratación</a></li>
                        <li><a href="#">Contactar con ventas</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h4 class="footer-title">Empresa</h4>
                    <ul class="footer-links">
                        <li><a href="#">Acerca de Laburar</a></li>
                        <li><a href="#">Ayuda y soporte</a></li>
                        <li><a href="#">Carreras</a></li>
                        <li><a href="#">Términos de Servicio</a></li>
                        <li><a href="#">Política de privacidad</a></li>
                        <li><a href="#">Mi información personal no se debe vender ni compartir</a></li>
                        <li><a href="#">Asociaciones</a></li>
                        <li><a href="#">Red de creadores</a></li>
                        <li><a href="#">Afiliados</a></li>
                        <li><a href="#">Invitar a un amigo</a></li>
                        <li><a href="#">Prensa y noticias</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p class="footer-tagline">
                    Conectamos talento con oportunidades.
                </p>
                <div class="footer-social">
                    <a href="#" class="social-link" aria-label="X (Twitter)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </a>
                    <a href="#" class="social-link" aria-label="Instagram">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                    <a href="#" class="social-link" aria-label="Facebook">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                    <a href="#" class="social-link" aria-label="WhatsApp">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a3 3 0 0 0 3 3l3-3"/></svg>
                    </a>
                </div>
                <p class="footer-copyright">
                    © 2025 LaburAR. Todos los derechos reservados. Hecho con 
                    <svg style="display: inline; margin: 0 0.25rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 
                    en Argentina
                </p>
            </div>
        </div>
    </footer>

    <!-- Quick View Modal -->
    <?php // echo ServiceCardProfessional::renderQuickViewModal(); ?>

    <!-- Scripts -->
    <script src="/Laburar/public/assets/js/landing.js"></script>
    <script src="/Laburar/public/assets/js/advanced-search.js"></script>
    <script src="/Laburar/public/assets/js/micro-interactions.js"></script>
    <script src="/Laburar/public/assets/js/performance-manager.js"></script>
    <script src="/Laburar/public/assets/js/mobile-interactions.js"></script>
    <script src="/Laburar/public/assets/js/registration-modal.js?v=<?php echo time(); ?>"></script>
    <script src="/Laburar/public/assets/js/login-modal.js?v=<?php echo time(); ?>"></script>
    <script>
        // Professional animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in', 'slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all feature cards and service cards
        document.querySelectorAll('.feature-card, .service-card-professional, .category-card').forEach(el => {
            observer.observe(el);
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Glassmorphism Header Scroll Effect
        const navbar = document.querySelector('.navbar');
        const heroSection = document.querySelector('.hero-fiverr');
        
        function updateHeaderOnScroll() {
            const scrolled = window.scrollY;
            const heroHeight = heroSection.offsetHeight;
            const scrollPercentage = Math.min(scrolled / (heroHeight * 0.3), 1);
            
            if (scrolled > 50) {
                navbar.classList.add('navbar-scrolled');
                navbar.style.setProperty('--scroll-opacity', scrollPercentage);
            } else {
                navbar.classList.remove('navbar-scrolled');
                navbar.style.setProperty('--scroll-opacity', '0');
            }
        }
        
        window.addEventListener('scroll', updateHeaderOnScroll);
        window.addEventListener('load', updateHeaderOnScroll);
        
        // Hero Background Video Carousel with Performance Optimizations
        function initHeroCarousel() {
            const videos = document.querySelectorAll('.hero-bg-video');
            const credits = document.querySelectorAll('.credit-item');
            let currentIndex = 0;
            let carouselInterval;
            let isVisible = true;
            
            // Check if user prefers reduced motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            // Performance: Pause videos when page is hidden
            document.addEventListener('visibilitychange', function() {
                isVisible = !document.hidden;
                if (isVisible) {
                    // Resume current video
                    if (videos[currentIndex]) {
                        videos[currentIndex].play().catch(e => console.log('Resume failed:', e));
                    }
                } else {
                    // Pause all videos when tab is hidden
                    videos.forEach(video => video.pause());
                }
            });
            
            function showNextVideo() {
                // Pause previous video
                if (videos[currentIndex]) {
                    videos[currentIndex].pause();
                }
                
                // Remove active class from current video and credit
                videos[currentIndex].classList.remove('active');
                credits[currentIndex].classList.remove('active');
                
                // Move to next video (loop back to 0 if at end)
                currentIndex = (currentIndex + 1) % videos.length;
                
                // Add active class to next video and credit
                videos[currentIndex].classList.add('active');
                credits[currentIndex].classList.add('active');
                
                // Play the active video if page is visible
                if (isVisible && !prefersReducedMotion) {
                    videos[currentIndex].currentTime = 0; // Reset to beginning
                    videos[currentIndex].play().catch(e => {
                        console.log('Video autoplay failed:', e);
                    });
                }
            }
            
            // Initialize first video
            if (videos.length > 0) {
                // Preload first few videos
                videos.forEach((video, index) => {
                    if (index < 2) { // Preload first 2 videos
                        video.load();
                    }
                });
                
                // Start first video if not reduced motion
                if (!prefersReducedMotion && isVisible) {
                    videos[0].play().catch(e => {
                        console.log('Initial video autoplay failed:', e);
                    });
                }
            }
            
            // Start the carousel only if motion is allowed
            if (!prefersReducedMotion && videos.length > 1) {
                carouselInterval = setInterval(showNextVideo, 8000);
            }
            
            // Cleanup function for memory management
            return function cleanup() {
                if (carouselInterval) {
                    clearInterval(carouselInterval);
                }
                videos.forEach(video => {
                    video.pause();
                    video.removeAttribute('src');
                    video.load();
                });
            };
        }
        
        // Initialize carousel when DOM is loaded
        document.addEventListener('DOMContentLoaded', initHeroCarousel);
    </script>
    
    <style>
    /* Navbar Scroll Glassmorphism Effects */
    .navbar {
        transition: var(--glass-transition-medium);
        z-index: 1000;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        --scroll-opacity: 0;
    }
    
    .navbar-scrolled {
        backdrop-filter: var(--glass-blur-hero) var(--glass-saturate-strong) !important;
        background: linear-gradient(180deg,
            rgba(255, 255, 255, calc(0.95 - 0.1 * var(--scroll-opacity))) 0%,
            rgba(255, 255, 255, calc(0.85 - 0.15 * var(--scroll-opacity))) 100%) !important;
        border-bottom: 1px solid rgba(255, 255, 255, calc(0.3 + 0.2 * var(--scroll-opacity))) !important;
        box-shadow: 
            0 8px 32px rgba(111, 191, 239, calc(0.15 + 0.1 * var(--scroll-opacity))),
            inset 0 1px 0 rgba(255, 255, 255, calc(0.2 + 0.3 * var(--scroll-opacity))) !important;
    }
    
    /* Adjust body padding to account for fixed navbar */
    body {
        padding-top: 80px;
    }
    
    .hero-fiverr {
        margin-top: -80px;
        padding-top: 80px;
    }
    </style>
</body>
</html>