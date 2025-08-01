<?php
/**
 * Badge Test - Research Implementation
 * LaburAR Platform - Clean badge testing interface
 * 
 * @author LaburAR Team
 * @version 1.0
 */

// Get badges from directory
$badgeDir = './assets/img/badges/';
$badges = [];
if (is_dir($badgeDir)) {
    $files = scandir($badgeDir);
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
            $badges[] = $file;
        }
    }
}

// Research findings - simplified
$systems = [
    ['name' => 'Stack Overflow', 'badges' => array_slice($badges, 0, 3), 'color' => '#f48024'],
    ['name' => 'GitHub', 'badges' => array_slice($badges, 3, 3), 'color' => '#2dba4e'],
    ['name' => 'Duolingo', 'badges' => array_slice($badges, 6, 3), 'color' => '#58cc02'],
    ['name' => 'PlayStation', 'badges' => array_slice($badges, 9, 3), 'color' => '#0070d1'],
    ['name' => 'Xbox', 'badges' => array_slice($badges, 12, 3), 'color' => '#107c10'],
    ['name' => 'LinkedIn', 'badges' => array_slice($badges, 15, 3), 'color' => '#0077b5']
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Badge Test - LaburAR</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #64748b;
            font-size: 1rem;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: 600;
            color: #3b82f6;
        }
        
        .stat-label {
            font-size: 0.8rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .systems {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
        }
        
        .system {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid var(--system-color);
            transition: transform 0.2s ease;
        }
        
        .system:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .system-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .system-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--system-color);
        }
        
        .badges {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .badge {
            position: relative;
            transition: transform 0.2s ease;
        }
        
        .badge:hover {
            transform: scale(1.05);
        }
        
        .badge img {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid #e2e8f0;
            object-fit: cover;
            transition: border-color 0.2s ease;
        }
        
        .badge:hover img {
            border-color: var(--system-color);
        }
        
        .badge-name {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        }
        
        .badge:hover .badge-name {
            opacity: 1;
        }
        
        .actions {
            margin-top: 3rem;
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .actions h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
        }
        
        .btn-group {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 0.6rem 1.2rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #374151;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-1px);
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .btn-primary:hover {
            background: #2563eb;
            border-color: #2563eb;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .stats {
                gap: 1rem;
            }
            
            .systems {
                grid-template-columns: 1fr;
            }
            
            .btn-group {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                width: 100%;
                max-width: 200px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Badge Research Test</h1>
            <p>Implementación de mejores prácticas de sistemas de badges</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number"><?= count($badges) ?></div>
                    <div class="stat-label">Badges</div>
                </div>
                <div class="stat">
                    <div class="stat-number">6</div>
                    <div class="stat-label">Sistemas</div>
                </div>
                <div class="stat">
                    <div class="stat-number">64px</div>
                    <div class="stat-label">Tamaño</div>
                </div>
            </div>
        </div>
        
        <div class="systems">
            <?php foreach ($systems as $system): ?>
                <div class="system" style="--system-color: <?= $system['color'] ?>">
                    <div class="system-name">
                        <div class="system-color"></div>
                        <?= $system['name'] ?>
                    </div>
                    <div class="badges">
                        <?php foreach ($system['badges'] as $badge): ?>
                            <div class="badge">
                                <img src="<?= $badgeDir . $badge ?>" alt="<?= pathinfo($badge, PATHINFO_FILENAME) ?>">
                                <div class="badge-name"><?= pathinfo($badge, PATHINFO_FILENAME) ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <div class="actions">
            <h3>Explorar Sistema</h3>
            <div class="btn-group">
                <a href="BADGE-SYSTEM-RESEARCH-REPORT.md" class="btn" target="_blank">
                    📄 Research Report
                </a>
                <a href="/public/api/badges.php" class="btn">
                    🔌 API Badges
                </a>
                <a href="/" class="btn btn-primary">
                    🏠 Inicio
                </a>
            </div>
        </div>
    </div>
</body>
</html>