<?php
/**
 * ServiceCard Component - Tarjeta de Servicio Argentina
 * 
 * Componente especializado para mostrar servicios en el marketplace argentino.
 * Características únicas:
 * - Trust signals argentinos (monotributo, universidad, cámara)
 * - Precios en pesos con cuotas sin interés
 * - Badges especializados "Talento Argentino"
 * - Ubicación argentina prominente
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-19
 */

require_once __DIR__ . '/../../app/Services/TrustSignalEngine.php';
require_once __DIR__ . '/../../app/Services/SecurityHelper.php';

class ServiceCard {
    
    private $trustEngine;
    private $security;
    
    public function __construct() {
        $this->trustEngine = new TrustSignalEngine();
        $this->security = new SecurityHelper();
    }
    
    /**
     * Renderizar tarjeta de servicio
     * 
     * @param array $service Datos del servicio
     * @param array $options Opciones de renderizado
     * @return string HTML de la tarjeta
     */
    public function render($service, $options = []) {
        // Validar datos mínimos
        if (empty($service['id']) || empty($service['title'])) {
            return $this->renderError('Datos de servicio inválidos');
        }
        
        // Configuración por defecto
        $config = array_merge([
            'show_trust_badges' => true,
            'show_pricing' => true,
            'show_location' => true,
            'show_packages' => true,
            'card_size' => 'standard', // standard, compact, featured
            'link_target' => '_self'
        ], $options);
        
        // Obtener datos adicionales
        $trustScore = $this->getTrustScoreData($service['user_id']);
        $packages = $this->getServicePackages($service['id']);
        $userProfile = $this->getUserProfile($service['user_id']);
        
        // Generar HTML
        $html = $this->generateCardHTML($service, $trustScore, $packages, $userProfile, $config);
        
        return $html;
    }
    
    /**
     * Generar HTML principal de la tarjeta
     */
    private function generateCardHTML($service, $trustScore, $packages, $userProfile, $config) {
        $cardClasses = $this->getCardClasses($config['card_size'], $trustScore['level']);
        $serviceUrl = "/service-detail.php?id=" . $service['id'];
        
        $html = '<div class="service-card ' . $cardClasses . '" data-service-id="' . $service['id'] . '">';
        
        // Header con imagen y badges
        $html .= $this->renderCardHeader($service, $trustScore, $config);
        
        // Contenido principal
        $html .= '<div class="service-card-content">';
        
        // Trust badges
        if ($config['show_trust_badges']) {
            $html .= $this->renderTrustBadges($trustScore);
        }
        
        // Título y categoría
        $html .= $this->renderTitleSection($service, $serviceUrl, $config);
        
        // Perfil del freelancer
        $html .= $this->renderFreelancerProfile($userProfile, $trustScore);
        
        // Descripción
        $html .= $this->renderDescription($service);
        
        // Ubicación
        if ($config['show_location']) {
            $html .= $this->renderLocation($userProfile);
        }
        
        // Packages y precios
        if ($config['show_packages'] && !empty($packages)) {
            $html .= $this->renderPackages($packages, $service);
        } elseif ($config['show_pricing']) {
            $html .= $this->renderBasicPricing($service);
        }
        
        // Rating y estadísticas
        $html .= $this->renderStats($service);
        
        $html .= '</div>'; // .service-card-content
        
        // Footer con acciones
        $html .= $this->renderCardFooter($service, $packages, $serviceUrl, $config);
        
        $html .= '</div>'; // .service-card
        
        return $html;
    }
    
    /**
     * Renderizar header de la tarjeta
     */
    private function renderCardHeader($service, $trustScore, $config) {
        $imageUrl = $this->getServiceImage($service);
        $talentoArgentino = $trustScore['total_score'] >= 50;
        
        $html = '<div class="service-card-header">';
        
        // Imagen del servicio
        $html .= '<div class="service-image-container">';
        $html .= '<img src="' . htmlspecialchars($imageUrl) . '" ';
        $html .= 'alt="' . htmlspecialchars($service['title']) . '" ';
        $html .= 'class="service-image" loading="lazy">';
        
        // Badge Talento Argentino (si aplica)
        if ($talentoArgentino) {
            $html .= '<div class="talento-argentino-badge">';
            $html .= '<span class="badge-icon">🇦🇷</span>';
            $html .= '<span class="badge-text">Talento Argentino</span>';
            $html .= '</div>';
        }
        
        // Overlay con acciones rápidas
        $html .= '<div class="service-overlay">';
        $html .= '<button class="btn-favorite" data-service-id="' . $service['id'] . '">';
        $html .= '<i class="icon-heart"></i>';
        $html .= '</button>';
        $html .= '<button class="btn-share" data-service-id="' . $service['id'] . '">';
        $html .= '<i class="icon-share"></i>';
        $html .= '</button>';
        $html .= '</div>';
        
        $html .= '</div>'; // .service-image-container
        $html .= '</div>'; // .service-card-header
        
        return $html;
    }
    
    /**
     * Renderizar trust badges argentinos
     */
    private function renderTrustBadges($trustScore) {
        if (empty($trustScore['badges'])) {
            return '';
        }
        
        $html = '<div class="trust-badges-container">';
        
        foreach ($trustScore['badges'] as $badge) {
            $html .= '<div class="trust-badge trust-badge-' . $badge['type'] . '" ';
            $html .= 'style="background-color: ' . $badge['color'] . '" ';
            $html .= 'title="' . htmlspecialchars($badge['description']) . '">';
            $html .= '<i class="icon-' . $badge['icon'] . '"></i>';
            $html .= '<span class="badge-label">' . htmlspecialchars($badge['label']) . '</span>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renderizar sección de título
     */
    private function renderTitleSection($service, $serviceUrl, $config) {
        $html = '<div class="service-title-section">';
        
        // Categoría
        if (!empty($service['category_name'])) {
            $html .= '<span class="service-category">' . htmlspecialchars($service['category_name']) . '</span>';
        }
        
        // Título principal
        $html .= '<h3 class="service-title">';
        $html .= '<a href="' . $serviceUrl . '" target="' . $config['link_target'] . '">';
        $html .= htmlspecialchars($service['title']);
        $html .= '</a>';
        $html .= '</h3>';
        
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renderizar perfil del freelancer
     */
    private function renderFreelancerProfile($userProfile, $trustScore) {
        $html = '<div class="freelancer-profile">';
        
        // Avatar
        $avatarUrl = $userProfile['avatar_url'] ?? '/assets/img/default-avatar.png';
        $html .= '<img src="' . htmlspecialchars($avatarUrl) . '" ';
        $html .= 'alt="' . htmlspecialchars($userProfile['username']) . '" ';
        $html .= 'class="freelancer-avatar">';
        
        // Info del freelancer
        $html .= '<div class="freelancer-info">';
        $html .= '<span class="freelancer-name">' . htmlspecialchars($userProfile['username']) . '</span>';
        
        // Nivel de trust
        $html .= '<div class="trust-level trust-level-' . $trustScore['level'] . '">';
        $html .= '<span class="level-indicator"></span>';
        $html .= '<span class="level-text">' . $this->getTrustLevelText($trustScore['level']) . '</span>';
        $html .= '</div>';
        
        $html .= '</div>'; // .freelancer-info
        $html .= '</div>'; // .freelancer-profile
        
        return $html;
    }
    
    /**
     * Renderizar descripción del servicio
     */
    private function renderDescription($service) {
        $description = $this->truncateText($service['description'] ?? '', 120);
        
        $html = '<div class="service-description">';
        $html .= '<p>' . htmlspecialchars($description) . '</p>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renderizar ubicación argentina
     */
    private function renderLocation($userProfile) {
        $location = $userProfile['location'] ?? 'Argentina';
        
        $html = '<div class="service-location">';
        $html .= '<i class="icon-map-pin"></i>';
        $html .= '<span>' . htmlspecialchars($location) . '</span>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renderizar packages de servicio
     */
    private function renderPackages($packages, $service) {
        $html = '<div class="service-packages">';
        
        // Mostrar solo el package más básico en la tarjeta
        $basicPackage = $this->getBasicPackage($packages);
        
        if ($basicPackage) {
            $html .= '<div class="package-preview">';
            $html .= '<div class="package-info">';
            $html .= '<span class="package-name">' . htmlspecialchars($basicPackage['name']) . '</span>';
            $html .= '<span class="package-delivery">Entrega: ' . $basicPackage['delivery_days'] . ' días</span>';
            $html .= '</div>';
            
            // Precio argentino
            $html .= '<div class="package-pricing">';
            $html .= '<span class="price-main">AR$ ' . number_format($basicPackage['price'], 0, ',', '.') . '</span>';
            
            // Cuotas sin interés si aplica
            if ($basicPackage['price'] >= 1000) {
                $cuotas = $this->calculateInstallments($basicPackage['price']);
                $html .= '<span class="price-installments">' . $cuotas['cuotas'] . ' cuotas sin interés</span>';
            }
            $html .= '</div>';
            
            $html .= '</div>'; // .package-preview
        }
        
        // Indicador de múltiples packages
        if (count($packages) > 1) {
            $html .= '<div class="packages-indicator">';
            $html .= '<span>' . count($packages) . ' opciones disponibles</span>';
            $html .= '</div>';
        }
        
        $html .= '</div>'; // .service-packages
        
        return $html;
    }
    
    /**
     * Renderizar precios básicos
     */
    private function renderBasicPricing($service) {
        $basePrice = $service['base_price'] ?? 0;
        
        if ($basePrice <= 0) {
            return '<div class="service-pricing"><span class="price-consult">Consultar precio</span></div>';
        }
        
        $html = '<div class="service-pricing">';
        $html .= '<span class="price-main">AR$ ' . number_format($basePrice, 0, ',', '.') . '</span>';
        
        if ($basePrice >= 1000) {
            $cuotas = $this->calculateInstallments($basePrice);
            $html .= '<span class="price-installments">' . $cuotas['cuotas'] . ' cuotas sin interés</span>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renderizar estadísticas y rating
     */
    private function renderStats($service) {
        $html = '<div class="service-stats">';
        
        // Rating
        $rating = $service['average_rating'] ?? 0;
        $reviewCount = $service['review_count'] ?? 0;
        
        $html .= '<div class="service-rating">';
        $html .= $this->renderStars($rating);
        $html .= '<span class="rating-number">' . number_format($rating, 1) . '</span>';
        if ($reviewCount > 0) {
            $html .= '<span class="review-count">(' . $reviewCount . ')</span>';
        }
        $html .= '</div>';
        
        // Estadísticas adicionales
        $html .= '<div class="service-metrics">';
        
        if (!empty($service['orders_completed'])) {
            $html .= '<span class="metric">';
            $html .= '<i class="icon-check"></i>';
            $html .= $service['orders_completed'] . ' completados';
            $html .= '</span>';
        }
        
        if (!empty($service['response_time'])) {
            $html .= '<span class="metric">';
            $html .= '<i class="icon-clock"></i>';
            $html .= 'Responde en ' . $service['response_time'];
            $html .= '</span>';
        }
        
        $html .= '</div>'; // .service-metrics
        $html .= '</div>'; // .service-stats
        
        return $html;
    }
    
    /**
     * Renderizar footer con acciones
     */
    private function renderCardFooter($service, $packages, $serviceUrl, $config) {
        $html = '<div class="service-card-footer">';
        
        // Botones de acción
        $html .= '<div class="service-actions">';
        
        // Botón principal
        $html .= '<a href="' . $serviceUrl . '" class="btn btn-primary btn-view-service" ';
        $html .= 'target="' . $config['link_target'] . '">';
        $html .= 'Ver Servicio';
        $html .= '</a>';
        
        // Botón de contacto rápido
        $html .= '<button class="btn btn-secondary btn-quick-contact" ';
        $html .= 'data-user-id="' . $service['user_id'] . '" ';
        $html .= 'data-service-id="' . $service['id'] . '">';
        $html .= '<i class="icon-message"></i>';
        $html .= 'Consultar';
        $html .= '</button>';
        
        $html .= '</div>'; // .service-actions
        $html .= '</div>'; // .service-card-footer
        
        return $html;
    }
    
    /**
     * Obtener datos de trust score
     */
    private function getTrustScoreData($userId) {
        try {
            return $this->trustEngine->calcularTrustScore($userId);
        } catch (Exception $e) {
            return [
                'total_score' => 0,
                'level' => 'basic',
                'badges' => []
            ];
        }
    }
    
    /**
     * Obtener packages del servicio
     */
    private function getServicePackages($serviceId) {
        try {
            $sql = "SELECT * FROM service_packages WHERE service_id = ? ORDER BY price ASC";
            return Database::getInstance()->query($sql, [$serviceId]);
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Obtener perfil de usuario
     */
    private function getUserProfile($userId) {
        try {
            $sql = "SELECT username, avatar_url, location, response_time FROM users WHERE id = ?";
            return Database::getInstance()->queryOne($sql, [$userId]) ?? [
                'username' => 'Usuario',
                'avatar_url' => '/assets/img/default-avatar.png',
                'location' => 'Argentina'
            ];
        } catch (Exception $e) {
            return [
                'username' => 'Usuario',
                'avatar_url' => '/assets/img/default-avatar.png',
                'location' => 'Argentina'
            ];
        }
    }
    
    /**
     * Obtener imagen del servicio
     */
    private function getServiceImage($service) {
        if (!empty($service['image_url'])) {
            return $service['image_url'];
        }
        
        // Imagen por defecto basada en categoría
        $category = strtolower($service['category_name'] ?? 'general');
        return "/assets/img/service-defaults/{$category}.jpg";
    }
    
    /**
     * Obtener clases CSS de la tarjeta
     */
    private function getCardClasses($size, $trustLevel) {
        $classes = ['service-card-' . $size];
        
        if ($trustLevel === 'elite' || $trustLevel === 'pro') {
            $classes[] = 'service-card-featured';
        }
        
        return implode(' ', $classes);
    }
    
    /**
     * Obtener package más básico
     */
    private function getBasicPackage($packages) {
        if (empty($packages)) {
            return null;
        }
        
        // Buscar package "básico" o el más barato
        foreach ($packages as $package) {
            if (stripos($package['name'], 'básico') !== false) {
                return $package;
            }
        }
        
        return $packages[0]; // Primer package (más barato por ORDER BY price ASC)
    }
    
    /**
     * Calcular cuotas sin interés
     */
    private function calculateInstallments($price) {
        if ($price < 1000) return ['cuotas' => 0, 'monto' => 0];
        if ($price < 5000) return ['cuotas' => 3, 'monto' => round($price / 3)];
        if ($price < 10000) return ['cuotas' => 6, 'monto' => round($price / 6)];
        return ['cuotas' => 12, 'monto' => round($price / 12)];
    }
    
    /**
     * Renderizar estrellas de rating
     */
    private function renderStars($rating) {
        $html = '<div class="star-rating">';
        
        for ($i = 1; $i <= 5; $i++) {
            $class = $i <= $rating ? 'star-filled' : 'star-empty';
            $html .= '<span class="star ' . $class . '">★</span>';
        }
        
        $html .= '</div>';
        return $html;
    }
    
    /**
     * Obtener texto del nivel de trust
     */
    private function getTrustLevelText($level) {
        $levels = [
            'basic' => 'Nuevo',
            'verified' => 'Verificado',
            'pro' => 'Profesional',
            'elite' => 'Elite'
        ];
        
        return $levels[$level] ?? 'Nuevo';
    }
    
    /**
     * Truncar texto
     */
    private function truncateText($text, $length) {
        if (strlen($text) <= $length) {
            return $text;
        }
        
        return substr($text, 0, $length) . '...';
    }
    
    /**
     * Renderizar error
     */
    private function renderError($message) {
        return '<div class="service-card service-card-error">' .
               '<p class="error-message">' . htmlspecialchars($message) . '</p>' .
               '</div>';
    }
    
    /**
     * Método estático para uso rápido
     */
    public static function quickRender($service, $options = []) {
        $instance = new self();
        return $instance->render($service, $options);
    }
}