<?php
/**
 * Badge Research Showcase - Complete Implementation Guide
 * LaburAR Platform - Interactive demonstration of badge systems
 * 
 * Based on: Top 5 GitHub alternatives + UI patterns research
 * Features: Live models, real functions, interactive examples
 * 
 * @author LaburAR Team
 * @version 2.0 Research Complete
 */

// Simulate badge data from assets directory
$badgeDir = './assets/img/badges/';
$allBadges = [];
if (is_dir($badgeDir)) {
    $files = scandir($badgeDir);
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
            $allBadges[] = $file;
        }
    }
}

// GitHub Research - Top 5 Badge Systems
$githubAlternatives = [
    'pacoorozco/gamify-laravel' => [
        'name' => 'Gamify Laravel Platform',
        'description' => 'Complete gamification with levels & badges (GPL-3.0)',
        'stars' => '500+',
        'tech' => 'Laravel 10.x + Docker + Blade',
        'features' => ['Serious Game Mechanics', 'User Progression', 'Level System', 'Badge Rewards', 'Question-based Games'],
        'model' => 'Platform-based with organizational focus',
        'code_example' => 'php artisan gamify:install // Docker-ready setup',
        'badges' => array_slice($allBadges, 0, 4),
        'color' => '#f97316'
    ],
    'qcod/laravel-gamify' => [
        'name' => 'Laravel Gamify Package',
        'description' => 'Reputation points & badges with trait system',
        'stars' => '800+',
        'tech' => 'Laravel + Traits + Events',
        'features' => ['Reputation System', 'Point Types', 'Badge Levels', 'Auto-sync', 'Event Broadcasting'],
        'model' => 'Trait-based integration',
        'code_example' => '$user->givePoint(new PostCreated); $user->syncBadges();',
        'badges' => array_slice($allBadges, 4, 4),
        'color' => '#3b82f6'
    ],
    'ansezz/laravel-gamify' => [
        'name' => 'Laravel Gamification System',
        'description' => 'Points & badges with group support',
        'stars' => '300+',
        'tech' => 'Laravel + Migrations + Groups',
        'features' => ['Point Classes', 'Badge Groups', 'Progress Tracking', 'Level Management', 'Metadata Support'],
        'model' => 'Group-based organization',
        'code_example' => 'class Achievement extends BadgeType { public function beginner($user) {} }',
        'badges' => array_slice($allBadges, 8, 4),
        'color' => '#10b981'
    ],
    'maize-tech/laravel-badges' => [
        'name' => 'Laravel Badges System',
        'description' => 'Progress tracking with metadata & translations',
        'stars' => '400+',
        'tech' => 'Laravel + Translations + Events',
        'features' => ['ProgressableBadge', 'Metadata Support', 'Translations', 'Badge Events', 'Entity Sync'],
        'model' => 'Entity-based with progress',
        'code_example' => '$entity->giveBadge(new FirstPost); $entity->syncBadges();',
        'badges' => array_slice($allBadges, 12, 4),
        'color' => '#8b5cf6'
    ],
    'assada/laravel-achievements' => [
        'name' => 'Laravel Achievements',
        'description' => 'Trophy system with achievement chains',
        'stars' => '600+',
        'tech' => 'Laravel + Chains + Notifications',
        'features' => ['Achievement Chains', 'Trophy System', 'Single Class Pattern', 'Chain Unlocking', 'Achievement Events'],
        'model' => 'Chain-based progression',
        'code_example' => 'class FirstPost extends Achievement { public function trigger() {} }',
        'badges' => array_slice($allBadges, 16, 4),
        'color' => '#ef4444'
    ]
];

// Interactive Demo Data
$demoUser = [
    'name' => 'Demo User',
    'points' => 2850,
    'level' => 7,
    'badges_earned' => 12,
    'progress' => 75
];

// Badge Mechanics Examples
$mechanics = [
    'event_driven' => [
        'name' => 'Event-Driven System',
        'description' => 'Automatic badge awarding based on user actions',
        'example' => 'User completes project → Event fired → Badge rules evaluated → Badge awarded',
        'code' => 'event(new ProjectCompleted($user, $project));',
        'pros' => ['Automatic', 'Real-time', 'Scalable'],
        'cons' => ['Complex setup', 'Event overhead']
    ],
    'point_threshold' => [
        'name' => 'Point Threshold System',
        'description' => 'Badges unlock when user reaches point milestones',
        'example' => '1000 points = Bronze, 5000 = Silver, 10000 = Gold',
        'code' => 'if($user->getPoints() >= 1000) $user->giveBadge(Bronze::class);',
        'pros' => ['Simple', 'Clear goals', 'Predictable'],
        'cons' => ['Linear progression', 'May feel grindy']
    ],
    'achievement_chain' => [
        'name' => 'Achievement Chains',
        'description' => 'Sequential unlocking of related badges',
        'example' => 'First Sale → 10 Sales → 100 Sales → Sales Master',
        'code' => 'class TenSales extends Achievement { depends: [FirstSale::class] }',
        'pros' => ['Guided progression', 'Story-driven', 'Long-term engagement'],
        'cons' => ['Complex dependencies', 'Blocking progression']
    ],
    'social_proof' => [
        'name' => 'Social Proof System',
        'description' => 'Community-validated achievements',
        'example' => 'Peer endorsements, review ratings, community votes',
        'code' => '$user->endorseBadge($target, TeamPlayer::class);',
        'pros' => ['Trust building', 'Community engagement', 'Quality validation'],
        'cons' => ['Requires active community', 'Potential bias']
    ]
];

// Implementation Models
$implementationModels = [
    'database_schema' => [
        'badges' => 'id, name, description, icon, rarity, points, category, requirements',
        'user_badges' => 'id, user_id, badge_id, earned_at, metadata, progress',
        'badge_progress' => 'id, user_id, badge_id, current_value, target_value',
        'badge_events' => 'id, user_id, event_type, event_data, processed_at'
    ],
    'php_classes' => [
        'BadgeType' => 'Abstract class for badge definitions',
        'PointType' => 'Abstract class for point calculations', 
        'Gamify' => 'User trait for badge/point functionality',
        'BadgeService' => 'Business logic for badge operations'
    ]
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Badge Research Showcase - LaburAR</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: #e2e8f0;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* Hero Section */
        .hero {
            text-align: center;
            padding: 3rem 2rem;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 3rem;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(transparent, rgba(59, 130, 246, 0.1), transparent);
            animation: rotate 20s linear infinite;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
        }
        
        .hero h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }
        
        .demo-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 800;
            color: #60a5fa;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        /* GitHub Alternatives Section */
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin: 3rem 0 2rem;
            color: #f1f5f9;
        }
        
        .alternatives-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .alternative-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .alternative-card:hover {
            transform: translateY(-5px);
            border-color: var(--card-color);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .alternative-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--card-color);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .card-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 0.5rem;
        }
        
        .stars-badge {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        
        .card-description {
            color: #cbd5e1;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
        }
        
        .tech-stack {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 0.8rem;
            margin-bottom: 1.5rem;
            border-left: 3px solid var(--card-color);
        }
        
        .tech-label {
            font-size: 0.8rem;
            color: #94a3b8;
            margin-bottom: 0.3rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tech-text {
            color: #e2e8f0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .features-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }
        
        .feature-tag {
            background: rgba(59, 130, 246, 0.2);
            color: #93c5fd;
            padding: 0.3rem 0.8rem;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .code-example {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .code-example pre {
            color: #a78bfa;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            line-height: 1.4;
        }
        
        .badge-preview {
            display: flex;
            gap: 0.8rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .badge-64 {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            object-fit: cover;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .badge-64:hover {
            transform: scale(1.1) rotate(5deg);
            border-color: var(--card-color);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        /* Mechanics Demo Section */
        .mechanics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .mechanic-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .mechanic-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-3px);
        }
        
        .mechanic-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #f1f5f9;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .pros-cons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .pros, .cons {
            font-size: 0.8rem;
        }
        
        .pros h4 {
            color: #4ade80;
            margin-bottom: 0.3rem;
        }
        
        .cons h4 {
            color: #f87171;
            margin-bottom: 0.3rem;
        }
        
        .pros ul, .cons ul {
            list-style: none;
            padding-left: 1rem;
        }
        
        .pros li::before {
            content: '✓ ';
            color: #4ade80;
            font-weight: bold;
        }
        
        .cons li::before {
            content: '✗ ';
            color: #f87171;
            font-weight: bold;
        }
        
        /* Interactive Demo */
        .demo-panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 3rem;
        }
        
        .demo-controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        
        .demo-btn {
            padding: 0.8rem 1.5rem;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .demo-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .demo-result {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
        }
        
        /* Implementation Models */
        .model-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        
        .model-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .model-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #f1f5f9;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .model-content {
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            color: #cbd5e1;
            line-height: 1.6;
        }
        
        /* Animations */
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .alternatives-grid {
                grid-template-columns: 1fr;
            }
            
            .demo-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .pros-cons {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Hero Section -->
        <div class="hero">
            <div class="hero-content">
                <h1>🏆 Badge Research Lab</h1>
                <p>Análisis completo de los mejores sistemas de badges del mundo + implementación práctica para LaburAR</p>
                
                <div class="demo-stats">
                    <div class="stat-card">
                        <div class="stat-number"><?= count($allBadges) ?></div>
                        <div class="stat-label">Badges Disponibles</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5</div>
                        <div class="stat-label">Sistemas GitHub</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">4</div>
                        <div class="stat-label">Mecánicas Core</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">64px</div>
                        <div class="stat-label">Tamaño Óptimo</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- GitHub Alternatives -->
        <h2 class="section-title">🚀 Top 5 Alternativas GitHub</h2>
        <div class="alternatives-grid">
            <?php foreach ($githubAlternatives as $repo => $data): ?>
                <div class="alternative-card fade-in" style="--card-color: <?= $data['color'] ?>">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title"><?= $data['name'] ?></h3>
                            <div class="stars-badge">
                                <i class="fas fa-star"></i>
                                <?= $data['stars'] ?>
                            </div>
                        </div>
                    </div>
                    
                    <p class="card-description"><?= $data['description'] ?></p>
                    
                    <div class="tech-stack">
                        <div class="tech-label">Tech Stack</div>
                        <div class="tech-text"><?= $data['tech'] ?></div>
                    </div>
                    
                    <div class="features-list">
                        <?php foreach ($data['features'] as $feature): ?>
                            <span class="feature-tag"><?= $feature ?></span>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="code-example">
                        <pre><?= htmlspecialchars($data['code_example']) ?></pre>
                    </div>
                    
                    <div class="badge-preview">
                        <?php foreach ($data['badges'] as $badge): ?>
                            <?php if (file_exists($badgeDir . $badge)): ?>
                                <img src="<?= $badgeDir . $badge ?>" alt="<?= $badge ?>" class="badge-64">
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Mechanics Demo -->
        <h2 class="section-title">⚙️ Mecánicas de Badges</h2>
        <div class="mechanics-grid">
            <?php foreach ($mechanics as $key => $mechanic): ?>
                <div class="mechanic-card fade-in">
                    <h3 class="mechanic-title">
                        <i class="fas fa-cog"></i>
                        <?= $mechanic['name'] ?>
                    </h3>
                    <p style="color: #cbd5e1; margin-bottom: 1rem;"><?= $mechanic['description'] ?></p>
                    
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <strong style="color: #f1f5f9;">Ejemplo:</strong><br>
                        <span style="color: #94a3b8;"><?= $mechanic['example'] ?></span>
                    </div>
                    
                    <div class="code-example">
                        <pre><?= htmlspecialchars($mechanic['code']) ?></pre>
                    </div>
                    
                    <div class="pros-cons">
                        <div class="pros">
                            <h4>✓ Pros</h4>
                            <ul>
                                <?php foreach ($mechanic['pros'] as $pro): ?>
                                    <li><?= $pro ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <div class="cons">
                            <h4>✗ Contras</h4>
                            <ul>
                                <?php foreach ($mechanic['cons'] as $con): ?>
                                    <li><?= $con ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Interactive Demo -->
        <h2 class="section-title">🎮 Demo Interactivo</h2>
        <div class="demo-panel">
            <div class="demo-controls">
                <button class="demo-btn" onclick="simulateAction('project_complete')">
                    <i class="fas fa-check"></i>
                    Completar Proyecto
                </button>
                <button class="demo-btn" onclick="simulateAction('earn_points')">
                    <i class="fas fa-coins"></i>
                    Ganar 500 Puntos
                </button>
                <button class="demo-btn" onclick="simulateAction('level_up')">
                    <i class="fas fa-level-up-alt"></i>
                    Subir de Nivel
                </button>
                <button class="demo-btn" onclick="simulateAction('social_badge')">
                    <i class="fas fa-users"></i>
                    Badge Social
                </button>
            </div>
            <div class="demo-result" id="demoResult">
                Selecciona una acción para ver la simulación en tiempo real
            </div>
        </div>

        <!-- Implementation Models -->
        <h2 class="section-title">🏗️ Modelos de Implementación</h2>
        <div class="model-grid">
            <div class="model-card fade-in">
                <h3 class="model-title">
                    <i class="fas fa-database"></i>
                    Schema Base de Datos
                </h3>
                <div class="model-content">
                    <?php foreach ($implementationModels['database_schema'] as $table => $fields): ?>
                        <strong><?= $table ?>:</strong><br>
                        <?= $fields ?><br><br>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <div class="model-card fade-in">
                <h3 class="model-title">
                    <i class="fas fa-code"></i>
                    Clases PHP Core
                </h3>
                <div class="model-content">
                    <?php foreach ($implementationModels['php_classes'] as $class => $description): ?>
                        <strong><?= $class ?>:</strong><br>
                        <?= $description ?><br><br>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Demo interactions
        function simulateAction(action) {
            const result = document.getElementById('demoResult');
            
            const simulations = {
                'project_complete': {
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; margin-bottom: 1rem;">🎉 ¡Proyecto Completado!</div>
                            <div style="color: #4ade80;">+500 puntos ganados</div>
                            <div style="color: #60a5fa;">Badge "Finalizador" desbloqueado</div>
                            <div style="margin-top: 1rem; font-size: 0.9rem; color: #94a3b8;">
                                Event: ProjectCompleted → PointsAwarded → BadgeEvaluated → BadgeAwarded
                            </div>
                        </div>
                    `
                },
                'earn_points': {
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; margin-bottom: 1rem;">💰 +500 Puntos</div>
                            <div style="color: #fbbf24;">Total: ${<?= $demoUser['points'] ?> + 500} puntos</div>
                            <div style="color: #a78bfa;">Progreso hacia siguiente nivel: 85%</div>
                            <div style="margin-top: 1rem;">
                                <div style="background: rgba(0,0,0,0.3); height: 8px; border-radius: 4px;">
                                    <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); height: 100%; width: 85%; border-radius: 4px; transition: width 1s ease;"></div>
                                </div>
                            </div>
                        </div>
                    `
                },
                'level_up': {
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">⬆️ ¡LEVEL UP!</div>
                            <div style="color: #f472b6;">Nivel <?= $demoUser['level'] ?> → Nivel <?= $demoUser['level'] + 1 ?></div>
                            <div style="color: #4ade80;">Nuevos badges disponibles desbloqueados</div>
                            <div style="color: #60a5fa;">Bonus: +1000 puntos de nivel</div>
                            <div style="margin-top: 1rem; font-size: 0.9rem; color: #94a3b8;">
                                Trigger: PointThresholdReached → LevelCalculated → LevelUpEvent
                            </div>
                        </div>
                    `
                },
                'social_badge': {
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; margin-bottom: 1rem;">👥 Badge Social Desbloqueado</div>
                            <div style="color: #10b981;">"Colaborador" - Trabajo en equipo excepcional</div>
                            <div style="color: #f59e0b;">Endorsado por 5 compañeros</div>
                            <div style="margin-top: 1rem; font-size: 0.9rem; color: #94a3b8;">
                                Social Proof: PeerEndorsements ≥ 5 → CommunityValidation → BadgeAwarded
                            </div>
                        </div>
                    `
                }
            };
            
            result.innerHTML = simulations[action].html;
            
            // Add animation
            result.style.animation = 'none';
            setTimeout(() => {
                result.style.animation = 'fadeInUp 0.5s ease forwards';
            }, 10);
        }

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        }, observerOptions);

        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });

        console.log('🏆 Badge Research Showcase loaded!');
        console.log(`📊 GitHub alternatives: ${Object.keys(<?= json_encode($githubAlternatives) ?>).length}`);
        console.log(`⚙️ Badge mechanics: ${Object.keys(<?= json_encode($mechanics) ?>).length}`);
    </script>
</body>
</html>