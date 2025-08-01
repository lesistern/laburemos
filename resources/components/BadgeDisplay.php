<?php
/**
 * Badge Display Component
 * 
 * Displays user badges with proper styling and interactions
 * 
 * @package LaburAR\Components
 * @author LaburAR Team
 * @since 2025-01-25
 */

namespace LaburAR\Components;

require_once __DIR__ . '/../../app/Models/Badge.php';

// Import Badge class from global namespace
use Badge;

class BadgeDisplay
{
    /**
     * Render a single badge
     */
    public static function renderBadge($badge, $options = [])
    {
        $size = $options['size'] ?? 'medium';
        $showTooltip = $options['tooltip'] ?? true;
        $clickable = $options['clickable'] ?? false;
        $featured = $options['featured'] ?? false;
        
        $sizeClass = match($size) {
            'small' => 'badge-small',
            'large' => 'badge-large',
            default => 'badge-medium'
        };
        
        $rarityColor = Badge::RARITY_COLORS[$badge['rarity']] ?? '#808080';
        $rarityName = Badge::RARITY_NAMES[$badge['rarity']] ?? 'Común';
        
        $badgeClass = "badge-item {$sizeClass} rarity-{$badge['rarity']}";
        if ($featured) {
            $badgeClass .= ' badge-featured';
        }
        if ($clickable) {
            $badgeClass .= ' badge-clickable';
        }
        
        $earnedDate = isset($badge['earned_at']) ? date('d/m/Y', strtotime($badge['earned_at'])) : '';
        $metadata = isset($badge['metadata']) ? json_decode($badge['metadata'], true) : [];
        
        ob_start();
        ?>
        <div class="<?= $badgeClass ?>" 
             data-badge-id="<?= $badge['id'] ?>"
             <?php if ($showTooltip): ?>
             data-tooltip="<?= htmlspecialchars($badge['description']) ?>"
             data-earned="<?= $earnedDate ?>"
             data-points="<?= $badge['points'] ?>"
             data-rarity="<?= $rarityName ?>"
             <?php endif; ?>
             style="--badge-color: <?= $rarityColor ?>">
            
            <div class="badge-icon-container">
                <?php if (!empty($badge['image_url'])): ?>
                    <img src="<?= $badge['image_url'] ?>" alt="<?= $badge['name'] ?>" class="badge-image">
                <?php else: ?>
                    <i class="icon-<?= $badge['icon'] ?> badge-icon"></i>
                <?php endif; ?>
                
                <?php if ($featured): ?>
                    <div class="badge-featured-indicator">
                        <i class="icon-star"></i>
                    </div>
                <?php endif; ?>
                
                <div class="badge-rarity-glow"></div>
            </div>
            
            <div class="badge-content">
                <h4 class="badge-name"><?= htmlspecialchars($badge['name']) ?></h4>
                <p class="badge-rarity"><?= $rarityName ?></p>
                <?php if ($badge['points'] > 0): ?>
                    <div class="badge-points"><?= $badge['points'] ?> pts</div>
                <?php endif; ?>
            </div>
            
            <?php if (isset($badge['progress']) && $badge['progress'] < 100): ?>
                <div class="badge-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: <?= $badge['progress'] ?>%"></div>
                    </div>
                    <span class="progress-text"><?= round($badge['progress']) ?>%</span>
                </div>
            <?php endif; ?>
            
            <?php if ($earnedDate): ?>
                <div class="badge-earned-date">
                    Obtenido el <?= $earnedDate ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render a grid of badges
     */
    public static function renderBadgeGrid($badges, $options = [])
    {
        $columns = $options['columns'] ?? 4;
        $size = $options['size'] ?? 'medium';
        $showEmpty = $options['show_empty'] ?? false;
        $emptyCount = $options['empty_count'] ?? 0;
        
        ob_start();
        ?>
        <div class="badge-grid" style="--grid-columns: <?= $columns ?>">
            <?php foreach ($badges as $badge): ?>
                <?= self::renderBadge($badge, $options) ?>
            <?php endforeach; ?>
            
            <?php if ($showEmpty && $emptyCount > 0): ?>
                <?php for ($i = 0; $i < $emptyCount; $i++): ?>
                    <div class="badge-item badge-empty <?= $size ?>">
                        <div class="badge-icon-container">
                            <i class="icon-lock badge-icon"></i>
                        </div>
                        <div class="badge-content">
                            <h4 class="badge-name">Badge Bloqueado</h4>
                            <p class="badge-rarity">Común</p>
                        </div>
                    </div>
                <?php endfor; ?>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render user badge stats
     */
    public static function renderBadgeStats($stats)
    {
        ob_start();
        ?>
        <div class="badge-stats">
            <div class="stat-item">
                <div class="stat-number"><?= $stats['total_badges'] ?? 0 ?></div>
                <div class="stat-label">Badges Totales</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-number"><?= $stats['total_points'] ?? 0 ?></div>
                <div class="stat-label">Puntos</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-number"><?= $stats['categories_unlocked'] ?? 0 ?></div>
                <div class="stat-label">Categorías</div>
            </div>
            
            <?php if ($stats['has_legendary'] ?? false): ?>
                <div class="stat-item stat-legendary">
                    <div class="stat-icon">
                        <i class="icon-crown"></i>
                    </div>
                    <div class="stat-label">Legendario</div>
                </div>
            <?php endif; ?>
            
            <?php if ($stats['has_exclusive'] ?? false): ?>
                <div class="stat-item stat-exclusive">
                    <div class="stat-icon">
                        <i class="icon-diamond"></i>
                    </div>
                    <div class="stat-label">Exclusivo</div>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render badge categories navigation
     */
    public static function renderCategoryNav($categories, $currentCategory = null)
    {
        ob_start();
        ?>
        <div class="badge-category-nav">
            <button class="category-btn <?= $currentCategory === null ? 'active' : '' ?>" 
                    data-category="all">
                Todos
            </button>
            <?php foreach ($categories as $category): ?>
                <button class="category-btn <?= $currentCategory === $category['slug'] ? 'active' : '' ?>" 
                        data-category="<?= $category['slug'] ?>"
                        style="--category-color: <?= $category['color'] ?>">
                    <i class="icon-<?= $category['icon'] ?>"></i>
                    <?= htmlspecialchars($category['name']) ?>
                </button>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render progress towards next badge
     */
    public static function renderNextBadges($nextBadges)
    {
        if (empty($nextBadges)) {
            return '<div class="no-next-badges">¡Has desbloqueado todos los badges disponibles!</div>';
        }
        
        ob_start();
        ?>
        <div class="next-badges">
            <h3>Próximos Logros</h3>
            <?php foreach ($nextBadges as $badge): ?>
                <div class="next-badge-item">
                    <div class="badge-preview">
                        <i class="icon-<?= $badge['icon'] ?> badge-icon"></i>
                        <div class="badge-info">
                            <h4><?= htmlspecialchars($badge['name']) ?></h4>
                            <p><?= htmlspecialchars($badge['description']) ?></p>
                            <div class="badge-points"><?= $badge['points'] ?> puntos</div>
                        </div>
                    </div>
                    
                    <?php if (isset($badge['progress'])): ?>
                        <div class="progress-section">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: <?= $badge['progress'] ?>%"></div>
                            </div>
                            <div class="progress-info">
                                <?= $badge['current_value'] ?? 0 ?> / <?= $badge['required_value'] ?? 1 ?>
                                (<?= round($badge['progress']) ?>%)
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render badge showcase for profile
     */
    public static function renderProfileShowcase($featuredBadges, $totalBadges = 0)
    {
        ob_start();
        ?>
        <div class="badge-showcase">
            <div class="showcase-header">
                <h3>Badges</h3>
                <div class="badge-count"><?= $totalBadges ?> obtenidos</div>
            </div>
            
            <div class="featured-badges">
                <?php if (empty($featuredBadges)): ?>
                    <div class="no-badges">
                        <i class="icon-award"></i>
                        <p>Sin badges destacados</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($featuredBadges as $badge): ?>
                        <?= self::renderBadge($badge, ['size' => 'small', 'featured' => true]) ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}