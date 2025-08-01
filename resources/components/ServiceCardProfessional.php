<?php
/**
 * ServiceCardProfessional Component
 * 
 * Professional service card component for LaburAR marketplace
 * Implements professional design quality with Argentine localization
 */

class ServiceCardProfessional {
    
    /**
     * Render a professional service card
     * 
     * @param array $service Service data array
     * @param array $options Rendering options
     * @return string HTML output
     */
    public static function render($service, $options = []) {
        $showFavorite = $options['show_favorite'] ?? true;
        $showQuickView = $options['show_quick_view'] ?? true;
        $size = $options['size'] ?? 'default'; // default, compact, featured
        
        $cardClass = "service-card-professional";
        if ($size !== 'default') {
            $cardClass .= " service-card-{$size}";
        }
        
        ob_start();
        ?>
        <div class="<?= $cardClass ?>" data-service-id="<?= $service['id'] ?>">
            <!-- Image Container -->
            <div class="service-image-container">
                <img 
                    src="<?= $service['image_url'] ?? '/Laburar/assets/img/placeholders/service-default.jpg' ?>" 
                    alt="<?= htmlspecialchars($service['title']) ?>"
                    class="service-image"
                    loading="lazy"
                >
                
                <!-- Badges Overlay -->
                <div class="service-badges-overlay">
                    <?php if ($service['is_verified']): ?>
                        <span class="service-badge badge-verified">
                            <svg class="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Verificado
                        </span>
                    <?php endif; ?>
                    
                    <?php if ($service['is_featured']): ?>
                        <span class="service-badge badge-featured">Destacado</span>
                    <?php endif; ?>
                    
                    <?php if ($service['is_express']): ?>
                        <span class="service-badge badge-express">Express 24h</span>
                    <?php endif; ?>
                </div>
                
                <!-- Action Buttons -->
                <div class="service-actions">
                    <?php if ($showFavorite): ?>
                        <button 
                            class="action-button favorite-button" 
                            data-action="toggle-favorite"
                            aria-label="Agregar a favoritos"
                        >
                            <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                    <?php endif; ?>
                    
                    <?php if ($showQuickView): ?>
                        <button 
                            class="action-button quickview-button" 
                            data-action="quick-view"
                            aria-label="Vista rápida"
                        >
                            <svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Content -->
            <div class="service-content">
                <!-- Category -->
                <div class="service-category">
                    <a href="/Laburar/marketplace?categoria=<?= $service['category_slug'] ?>" class="category-link">
                        <?= htmlspecialchars($service['category_name']) ?>
                    </a>
                </div>
                
                <!-- Title -->
                <h3 class="service-title">
                    <a href="/Laburar/service/<?= $service['id'] ?>" class="title-link">
                        <?= htmlspecialchars($service['title']) ?>
                    </a>
                </h3>
                
                <!-- Rating -->
                <div class="service-rating">
                    <div class="stars-container">
                        <div class="stars-background">★★★★★</div>
                        <div class="stars-filled" style="width: <?= ($service['rating'] / 5) * 100 ?>%">★★★★★</div>
                    </div>
                    <span class="rating-text"><?= number_format($service['rating'], 1) ?></span>
                    <span class="rating-count">(<?= $service['review_count'] ?>)</span>
                </div>
                
                <!-- Seller Info -->
                <div class="service-seller">
                    <img 
                        src="<?= $service['seller_avatar'] ?? '/Laburar/assets/img/avatars/default.jpg' ?>" 
                        alt="<?= htmlspecialchars($service['seller_name']) ?>"
                        class="seller-avatar"
                    >
                    <div class="seller-info">
                        <span class="seller-name">
                            <a href="/Laburar/freelancer/<?= $service['seller_id'] ?>">
                                <?= htmlspecialchars($service['seller_name']) ?>
                            </a>
                        </span>
                        <div class="seller-badges">
                            <?php if ($service['seller_level'] === 'pro'): ?>
                                <span class="seller-badge badge-pro">Pro</span>
                            <?php elseif ($service['seller_level'] === 'expert'): ?>
                                <span class="seller-badge badge-expert">Expert</span>
                            <?php endif; ?>
                            
                            <?php if ($service['seller_country'] === 'AR'): ?>
                                <span class="seller-badge badge-country">🇦🇷</span>
                            <?php endif; ?>
                            
                            <?php if ($service['seller_is_online']): ?>
                                <span class="seller-badge badge-online">En línea</span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="service-footer">
                    <div class="service-pricing">
                        <span class="price-label">Desde</span>
                        <span class="price-amount">AR$ <?= number_format($service['starting_price'], 0, ',', '.') ?></span>
                    </div>
                    
                    <?php if ($service['accepts_mercadopago']): ?>
                        <div class="payment-info">
                            <span class="payment-badge mercadopago">
                                <img src="/Laburar/assets/img/icons/mercadopago.svg" alt="MercadoPago" width="16" height="16">
                                <?= $service['installments'] ?> cuotas
                            </span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render a grid of service cards
     * 
     * @param array $services Array of services
     * @param array $options Grid options
     * @return string HTML output
     */
    public static function renderGrid($services, $options = []) {
        $gridClass = $options['grid_class'] ?? 'services-grid';
        $cardOptions = $options['card_options'] ?? [];
        
        ob_start();
        ?>
        <div class="<?= $gridClass ?>">
            <?php foreach ($services as $service): ?>
                <?= self::render($service, $cardOptions) ?>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render the quick view modal structure
     * 
     * @return string HTML output
     */
    public static function renderQuickViewModal() {
        ob_start();
        ?>
        <div class="service-quickview-modal" id="serviceQuickViewModal">
            <div class="quickview-content">
                <div class="quickview-header">
                    <h3 class="quickview-title">Vista rápida del servicio</h3>
                    <button class="quickview-close" aria-label="Cerrar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="quickview-body">
                    <!-- Content will be loaded dynamically -->
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Get real services data from database (REAL DATA IMPLEMENTATION)
     */
    public static function getRealServicesData(int $count = 8): array {
        require_once __DIR__ . '/../../app/Services/DatabaseHelper.php';
        
        return DatabaseHelper::getRecentServices($count);
    }
    
    /**
     * Generate sample service data for testing (DEPRECATED - use getRealServicesData)
     * 
     * @param int $count Number of services to generate
     * @return array
     */
    public static function generateSampleData($count = 12) {
        $categories = [
            ['name' => 'Diseño Gráfico', 'slug' => 'diseno-grafico'],
            ['name' => 'Desarrollo Web', 'slug' => 'desarrollo-web'],
            ['name' => 'Marketing Digital', 'slug' => 'marketing-digital'],
            ['name' => 'Redacción y Contenido', 'slug' => 'redaccion-contenido'],
            ['name' => 'Video y Animación', 'slug' => 'video-animacion'],
            ['name' => 'Música y Audio', 'slug' => 'musica-audio']
        ];
        
        $services = [];
        for ($i = 1; $i <= $count; $i++) {
            $category = $categories[array_rand($categories)];
            $rating = rand(40, 50) / 10;
            
            $services[] = [
                'id' => $i,
                'title' => "Servicio profesional de {$category['name']} #$i",
                'category_name' => $category['name'],
                'category_slug' => $category['slug'],
                'image_url' => "/Laburar/assets/img/demo/service-$i.jpg",
                'rating' => $rating,
                'review_count' => rand(10, 200),
                'starting_price' => rand(5, 50) * 1000,
                'is_verified' => rand(0, 1) == 1,
                'is_featured' => rand(0, 10) > 8,
                'is_express' => rand(0, 10) > 7,
                'accepts_mercadopago' => true,
                'installments' => rand(3, 12),
                'seller_id' => rand(1, 100),
                'seller_name' => "Freelancer Pro $i",
                'seller_avatar' => "/Laburar/assets/img/demo/avatar-$i.jpg",
                'seller_level' => rand(0, 10) > 7 ? 'expert' : (rand(0, 10) > 5 ? 'pro' : 'new'),
                'seller_country' => 'AR',
                'seller_is_online' => rand(0, 1) == 1
            ];
        }
        
        return $services;
    }
}
?>