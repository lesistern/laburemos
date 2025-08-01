<?php
/**
 * Trust Badge Component
 * Componente para renderizar badges de confianza y verificación
 * 
 * Funcionalidades:
 * - Renderizado de badges de confianza
 * - Estado de verificaciones del usuario
 * - Progreso hacia próximos niveles
 * - Tooltips informativos
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../../app/Services/TrustSignalEnginePro.php';

class TrustBadgeComponent {
    
    /**
     * Render trust badges for a user
     */
    public static function render($user, array $options = []): string {
        $size = $options['size'] ?? 'default'; // small, default, large
        $layout = $options['layout'] ?? 'horizontal'; // horizontal, vertical, grid
        $limit = $options['limit'] ?? null;
        $showTooltips = $options['show_tooltips'] ?? true;
        $showScore = $options['show_score'] ?? false;
        
        $trustEngine = new TrustSignalEnginePro();
        $trustData = $trustEngine->calculateTrustScore($user);
        $badges = $trustData['badges'];
        
        if ($limit) {
            $badges = array_slice($badges, 0, $limit);
        }
        
        $containerClass = "trust-badges trust-badges-{$size} trust-badges-{$layout}";
        
        ob_start();
        ?>
        <div class="<?= $containerClass ?>" data-user-id="<?= $user['id'] ?>">
            <?php if ($showScore): ?>
                <div class="trust-score">
                    <div class="trust-score-circle">
                        <svg class="trust-score-ring" width="40" height="40">
                            <circle 
                                cx="20" 
                                cy="20" 
                                r="16" 
                                fill="transparent" 
                                stroke="var(--neutral-200)" 
                                stroke-width="2"
                            />
                            <circle 
                                cx="20" 
                                cy="20" 
                                r="16" 
                                fill="transparent" 
                                stroke="var(--success-green)" 
                                stroke-width="2"
                                stroke-dasharray="<?= 2 * pi() * 16 ?>"
                                stroke-dashoffset="<?= 2 * pi() * 16 * (1 - $trustData['percentage'] / 100) ?>"
                                style="transform: rotate(-90deg); transform-origin: 20px 20px;"
                            />
                        </svg>
                        <span class="trust-score-text"><?= round($trustData['percentage']) ?>%</span>
                    </div>
                    <span class="trust-level"><?= ucfirst($trustData['level']) ?></span>
                </div>
            <?php endif; ?>
            
            <div class="badges-container">
                <?php foreach ($badges as $badge): ?>
                    <div 
                        class="trust-badge trust-badge-<?= $badge['type'] ?> trust-badge-<?= $badge['level'] ?> trust-badge-<?= $badge['color'] ?>"
                        <?php if ($showTooltips): ?>
                            data-tooltip="<?= htmlspecialchars($badge['description']) ?>"
                            data-tooltip-position="top"
                        <?php endif; ?>
                    >
                        <div class="badge-icon">
                            <?= self::renderBadgeIcon($badge['icon']) ?>
                        </div>
                        <span class="badge-text"><?= htmlspecialchars($badge['title']) ?></span>
                        
                        <?php if ($badge['type'] === 'level'): ?>
                            <div class="badge-shine"></div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if (empty($badges)): ?>
                <div class="no-badges">
                    <span class="no-badges-text">Verificaciones pendientes</span>
                    <a href="/Laburar/profile/verify" class="btn btn-sm btn-primary">Verificar Perfil</a>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render verification status component
     */
    public static function renderVerificationStatus($user): string {
        $trustEngine = new TrustSignalEnginePro();
        $trustData = $trustEngine->calculateTrustScore($user);
        
        $verifications = [
            'email' => [
                'title' => 'Email',
                'verified' => !empty($user['email_verified_at']),
                'required' => true,
                'description' => 'Confirma tu dirección de email'
            ],
            'phone' => [
                'title' => 'Teléfono',
                'verified' => !empty($user['phone_verified_at']),
                'required' => true,
                'description' => 'Verifica tu número de teléfono'
            ],
            'cuit' => [
                'title' => 'CUIT/CUIL',
                'verified' => $trustData['factors']['verification']['details']['cuit']['verified'] ?? false,
                'required' => false,
                'premium' => true,
                'description' => 'Verificación fiscal argentina con AFIP'
            ],
            'university' => [
                'title' => 'Título Universitario',
                'verified' => $trustData['factors']['argentine_factors']['details']['university']['verified'] ?? false,
                'required' => false,
                'premium' => true,
                'description' => 'Verifica tu título universitario'
            ],
            'chamber' => [
                'title' => 'Matrícula Profesional',
                'verified' => $trustData['factors']['argentine_factors']['details']['professional_chamber']['verified'] ?? false,
                'required' => false,
                'premium' => true,
                'description' => 'Matriculación en colegio profesional'
            ]
        ];
        
        ob_start();
        ?>
        <div class="verification-status">
            <div class="verification-header">
                <h3 class="verification-title">Estado de Verificación</h3>
                <div class="verification-progress">
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            style="width: <?= $trustData['percentage'] ?>%"
                        ></div>
                    </div>
                    <span class="progress-text"><?= round($trustData['percentage']) ?>% completo</span>
                </div>
            </div>
            
            <div class="verification-items">
                <?php foreach ($verifications as $key => $verification): ?>
                    <div class="verification-item <?= $verification['verified'] ? 'verified' : 'pending' ?>">
                        <div class="verification-status-icon">
                            <?php if ($verification['verified']): ?>
                                <svg class="icon-verified" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            <?php else: ?>
                                <svg class="icon-pending" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            <?php endif; ?>
                        </div>
                        
                        <div class="verification-content">
                            <div class="verification-name">
                                <?= $verification['title'] ?>
                                <?php if ($verification['required'] ?? false): ?>
                                    <span class="required-badge">Requerido</span>
                                <?php endif; ?>
                                <?php if ($verification['premium'] ?? false): ?>
                                    <span class="premium-badge">Premium</span>
                                <?php endif; ?>
                            </div>
                            
                            <div class="verification-description">
                                <?php if ($verification['verified']): ?>
                                    <span class="status-verified">✓ Verificado</span>
                                <?php else: ?>
                                    <span class="status-pending"><?= $verification['description'] ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="verification-action">
                            <?php if (!$verification['verified']): ?>
                                <a 
                                    href="/Laburar/profile/verify/<?= $key ?>" 
                                    class="btn btn-sm btn-outline"
                                >
                                    Verificar
                                </a>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($trustData['next_milestone']): ?>
                <div class="next-milestone">
                    <h4 class="milestone-title">Próximo Nivel</h4>
                    <p class="milestone-description">
                        <?= $trustData['next_milestone']['description'] ?>
                    </p>
                    <div class="milestone-progress">
                        <div class="milestone-bar">
                            <div 
                                class="milestone-fill" 
                                style="width: <?= $trustData['next_milestone']['progress'] ?>%"
                            ></div>
                        </div>
                        <span class="milestone-text">
                            <?= $trustData['next_milestone']['current'] ?> / <?= $trustData['next_milestone']['target'] ?> puntos
                        </span>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render trust summary for service cards
     */
    public static function renderTrustSummary($user, array $options = []): string {
        $trustEngine = new TrustSignalEnginePro();
        $trustData = $trustEngine->calculateTrustScore($user);
        
        $showPercentage = $options['show_percentage'] ?? true;
        $maxBadges = $options['max_badges'] ?? 3;
        
        $topBadges = array_slice($trustData['badges'], 0, $maxBadges);
        
        ob_start();
        ?>
        <div class="trust-summary">
            <?php if ($showPercentage): ?>
                <div class="trust-percentage">
                    <span class="percentage-value"><?= round($trustData['percentage']) ?>%</span>
                    <span class="percentage-label">Confianza</span>
                </div>
            <?php endif; ?>
            
            <div class="trust-badges-mini">
                <?php foreach ($topBadges as $badge): ?>
                    <div 
                        class="trust-badge-mini trust-badge-<?= $badge['color'] ?>"
                        data-tooltip="<?= htmlspecialchars($badge['description']) ?>"
                    >
                        <?= self::renderBadgeIcon($badge['icon']) ?>
                    </div>
                <?php endforeach; ?>
                
                <?php if (count($trustData['badges']) > $maxBadges): ?>
                    <div class="trust-badge-more">
                        +<?= count($trustData['badges']) - $maxBadges ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render verification modal
     */
    public static function renderVerificationModal(): string {
        ob_start();
        ?>
        <div id="verificationModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Verificar Perfil</h3>
                    <button class="modal-close" onclick="closeVerificationModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="verification-steps">
                        <!-- Email Verification -->
                        <div class="verification-step" data-step="email">
                            <div class="step-header">
                                <div class="step-icon">📧</div>
                                <div class="step-info">
                                    <h4>Verificación de Email</h4>
                                    <p>Confirma tu dirección de correo electrónico</p>
                                </div>
                            </div>
                            <div class="step-content">
                                <form id="emailVerificationForm">
                                    <div class="form-group">
                                        <label>Email</label>
                                        <input type="email" id="email" class="form-control" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Enviar Código</button>
                                </form>
                            </div>
                        </div>
                        
                        <!-- CUIT Verification -->
                        <div class="verification-step" data-step="cuit">
                            <div class="step-header">
                                <div class="step-icon">🇦🇷</div>
                                <div class="step-info">
                                    <h4>Verificación CUIT/CUIL</h4>
                                    <p>Verifica tu identidad fiscal argentina</p>
                                </div>
                            </div>
                            <div class="step-content">
                                <form id="cuitVerificationForm">
                                    <div class="form-group">
                                        <label>CUIT/CUIL</label>
                                        <input 
                                            type="text" 
                                            id="cuit" 
                                            class="form-control" 
                                            placeholder="20-12345678-9"
                                            maxlength="13"
                                            required
                                        >
                                        <small class="form-text">Incluye los guiones para mejor formato</small>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Verificar con AFIP</button>
                                </form>
                            </div>
                        </div>
                        
                        <!-- University Verification -->
                        <div class="verification-step" data-step="university">
                            <div class="step-header">
                                <div class="step-icon">🎓</div>
                                <div class="step-info">
                                    <h4>Título Universitario</h4>
                                    <p>Verifica tu formación académica</p>
                                </div>
                            </div>
                            <div class="step-content">
                                <form id="universityVerificationForm">
                                    <div class="form-group">
                                        <label>Universidad</label>
                                        <select id="university" class="form-control" required>
                                            <option value="">Selecciona tu universidad</option>
                                            <option value="uba">Universidad de Buenos Aires</option>
                                            <option value="unlp">Universidad Nacional de La Plata</option>
                                            <option value="utn">Universidad Tecnológica Nacional</option>
                                            <option value="other">Otra universidad</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Título/Carrera</label>
                                        <input type="text" id="degree" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Documento</label>
                                        <input type="file" id="degreeDocument" class="form-control" accept=".pdf,.jpg,.png">
                                        <small class="form-text">Sube una copia de tu diploma o certificado</small>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Enviar para Revisión</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render badge icon SVG
     */
    private static function renderBadgeIcon(string $iconName): string {
        $icons = [
            'shield-check' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            'credit-card-check' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v4h16V4H4zm0 6v10h16V10H4zm4 4l2 2 4-4"/></svg>',
            'academic-cap' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7l-10-5zM12 4.2L19.6 7 12 9.8 4.4 7 12 4.2zM4 9.2l8 3.8 8-3.8V17H4V9.2z"/></svg>',
            'briefcase-check' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h4c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h4zm2-2v2h4V4h-4zm-4 6v10h12V10H6zm5 3l2 2 4-4"/></svg>',
            'star-crown' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3 6 6 1-4.5 4.5L18 19l-6-3-6 3 1.5-6.5L3 8l6-1 3-6z"/></svg>',
            'star-pro' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'shield-verified' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 17l-4-4 1.41-1.41L11 15.17l6.59-6.59L19 10l-8 8z"/></svg>',
            'clock-fast' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"/></svg>',
            'circle-online' => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>'
        ];
        
        return $icons[$iconName] ?? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
    }
    
    /**
     * Get real users data for demonstrations (REAL DATA IMPLEMENTATION)
     */
    public static function getRealUsersData(int $limit = 3): array {
        require_once __DIR__ . '/../../app/Services/DatabaseHelper.php';
        
        $connection = DatabaseHelper::getConnection();
        if (!$connection) {
            // Fallback to empty data when DB not available
            return [];
        }
        
        try {
            $stmt = $connection->prepare(
                "SELECT id, name, email_verified_at, phone_verified_at, created_at, user_type
                 FROM users 
                 WHERE user_type = 'freelancer' AND status = 'active'
                 ORDER BY created_at DESC 
                 LIMIT ?"
            );
            $stmt->execute([$limit]);
            $users = $stmt->fetchAll();
            
            return $users ?: [];
            
        } catch (Exception $e) {
            error_log("Error fetching real users data: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get real user by ID (REAL DATA IMPLEMENTATION)
     */
    public static function getRealUserById(int $userId): ?array {
        require_once __DIR__ . '/../../app/Services/DatabaseHelper.php';
        
        $connection = DatabaseHelper::getConnection();
        if (!$connection) {
            return null;
        }
        
        try {
            $stmt = $connection->prepare(
                "SELECT * FROM users WHERE id = ? AND status = 'active'"
            );
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            return $user ?: null;
            
        } catch (Exception $e) {
            error_log("Error fetching user by ID: " . $e->getMessage());
            return null;
        }
    }
}