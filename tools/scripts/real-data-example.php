<?php
/**
 * Ejemplo de implementación de REGLA CRÍTICA: DATOS REALES OBLIGATORIOS
 * 
 * Este archivo demuestra cómo usar datos reales en lugar de placeholders
 * en todos los componentes de LaburAR
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/includes/DatabaseHelper.php';
require_once __DIR__ . '/components/TrustBadgeComponent.php';
require_once __DIR__ . '/components/ServiceCardProfessional.php';

// ✅ CORRECTO: Obtener datos reales de la base de datos
$platformStats = DatabaseHelper::getPlatformStats();
$realUsers = TrustBadgeComponent::getRealUsersData(5);
$realServices = ServiceCardProfessional::getRealServicesData(6);
$categoryStats = DatabaseHelper::getCategoryStats();
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ejemplo Datos Reales - LaburAR</title>
    
    <link rel="stylesheet" href="/Laburar/assets/css/design-system-pro.css">
    <link rel="stylesheet" href="/Laburar/assets/css/trust-badges.css">
    <link rel="stylesheet" href="/Laburar/assets/css/main.css">
    
    <style>
        body {
            margin: 0;
            font-family: var(--font-family-primary);
            background: var(--neutral-50);
        }
        
        .example-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: var(--space-8);
        }
        
        .example-section {
            background: white;
            border-radius: var(--radius-lg);
            padding: var(--space-8);
            margin-bottom: var(--space-8);
            border: 1px solid var(--neutral-200);
        }
        
        .example-title {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-bold);
            color: var(--neutral-900);
            margin-bottom: var(--space-4);
        }
        
        .code-example {
            background: var(--neutral-900);
            color: var(--neutral-100);
            padding: var(--space-4);
            border-radius: var(--radius-md);
            font-family: 'Courier New', monospace;
            font-size: var(--font-size-sm);
            margin: var(--space-4) 0;
            overflow-x: auto;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-4);
            margin: var(--space-4) 0;
        }
        
        .stat-card {
            background: var(--neutral-50);
            padding: var(--space-4);
            border-radius: var(--radius-md);
            text-align: center;
            border: 1px solid var(--neutral-200);
        }
        
        .stat-number {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-bold);
            color: var(--primary-blue);
            display: block;
        }
        
        .stat-label {
            font-size: var(--font-size-sm);
            color: var(--neutral-600);
            margin-top: var(--space-2);
        }
        
        .correct { color: var(--success-green); }
        .incorrect { color: var(--danger-red); }
        
        .nav-back {
            display: inline-flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--primary-blue);
            text-decoration: none;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-6);
            transition: color 0.2s ease;
        }
        
        .nav-back:hover {
            color: var(--primary-blue-hover);
        }
    </style>
</head>
<body>
    <div class="example-container">
        <a href="/Laburar/" class="nav-back">
            ← Volver a LaburAR
        </a>
        
        <h1 class="example-title">🛡️ Ejemplo: REGLA CRÍTICA - DATOS REALES OBLIGATORIOS</h1>
        
        <!-- Platform Stats Example -->
        <section class="example-section">
            <h2>📊 Estadísticas de Plataforma - DATOS REALES</h2>
            
            <div class="code-example">
<span class="incorrect">// ❌ INCORRECTO - Datos placeholder</span>
$stats = [
    'freelancers' => '5,000+',
    'projects' => '15,000+', 
    'rating' => '4.9★'
];

<span class="correct">// ✅ CORRECTO - Datos reales de base de datos</span>
$platformStats = DatabaseHelper::getPlatformStats();
            </div>
            
            <h3>Estadísticas Actuales (Datos Reales):</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number"><?= number_format($platformStats['freelancers_count']) ?></span>
                    <span class="stat-label">Freelancers Registrados</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= number_format($platformStats['clients_count']) ?></span>
                    <span class="stat-label">Clientes Registrados</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= number_format($platformStats['projects_completed']) ?></span>
                    <span class="stat-label">Proyectos Completados</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= $platformStats['average_rating'] > 0 ? number_format($platformStats['average_rating'], 1) . '★' : 'N/A' ?></span>
                    <span class="stat-label">Calificación Promedio</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= number_format($platformStats['active_services']) ?></span>
                    <span class="stat-label">Servicios Activos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= $platformStats['success_rate'] ?>%</span>
                    <span class="stat-label">Tasa de Éxito</span>
                </div>
            </div>
        </section>
        
        <!-- Real Users Example -->
        <section class="example-section">
            <h2>👥 Usuarios Reales del Sistema</h2>
            
            <div class="code-example">
<span class="incorrect">// ❌ INCORRECTO - Usuarios ficticios</span>
$users = [
    ['name' => 'Juan Ficticio', 'rating' => 4.8],
    ['name' => 'María Ejemplo', 'rating' => 4.9]
];

<span class="correct">// ✅ CORRECTO - Usuarios reales de DB</span>
$realUsers = TrustBadgeComponent::getRealUsersData(5);
            </div>
            
            <?php if (!empty($realUsers)): ?>
                <h3>Usuarios Reales Registrados:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
                    <?php foreach ($realUsers as $user): ?>
                        <div style="background: var(--neutral-50); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--neutral-200);">
                            <h4 style="margin: 0 0 var(--space-2) 0; color: var(--neutral-900);">
                                <?= htmlspecialchars($user['name']) ?>
                            </h4>
                            <p style="margin: 0; color: var(--neutral-600); font-size: var(--font-size-sm);">
                                ID: <?= $user['id'] ?> | 
                                Tipo: <?= ucfirst($user['user_type']) ?> |
                                Registrado: <?= date('d/m/Y', strtotime($user['created_at'])) ?>
                            </p>
                            <div style="margin-top: var(--space-3);">
                                <?= TrustBadgeComponent::render($user, ['size' => 'small', 'limit' => 2]) ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div style="padding: var(--space-6); text-align: center; background: var(--warning-amber-light); border-radius: var(--radius-md); border: 1px solid var(--warning-amber);">
                    <h3 style="color: var(--warning-amber-hover); margin-bottom: var(--space-2);">¡Perfecta implementación!</h3>
                    <p style="color: var(--warning-amber-hover); margin: 0;">
                        No hay usuarios registrados aún, por lo que se muestra este mensaje en lugar de datos ficticios.
                        Esto es exactamente lo que debe suceder según la REGLA CRÍTICA.
                    </p>
                    <a href="/Laburar/register.html" class="btn btn-primary" style="margin-top: var(--space-4);">
                        Ser el primer usuario
                    </a>
                </div>
            <?php endif; ?>
        </section>
        
        <!-- Categories Example -->
        <section class="example-section">
            <h2>📂 Categorías con Conteos Reales</h2>
            
            <div class="code-example">
<span class="incorrect">// ❌ INCORRECTO - Conteos inventados</span>
echo '&lt;p&gt;Diseño Gráfico: 1,234 servicios&lt;/p&gt;';

<span class="correct">// ✅ CORRECTO - Conteos reales de DB</span>
$categoryStats = DatabaseHelper::getCategoryStats();
foreach ($categoryStats as $category) {
    $count = (int)$category['service_count'];
    echo $count > 0 ? "$count servicios" : "Próximamente";
}
            </div>
            
            <?php if (!empty($categoryStats)): ?>
                <h3>Categorías con Datos Reales:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
                    <?php foreach (array_slice($categoryStats, 0, 6) as $category): ?>
                        <div style="background: var(--neutral-50); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--neutral-200);">
                            <h4 style="margin: 0 0 var(--space-2) 0; color: var(--neutral-900);">
                                <?= htmlspecialchars($category['name']) ?>
                            </h4>
                            <p style="margin: 0; color: var(--neutral-600);">
                                <?php 
                                $serviceCount = (int)$category['service_count'];
                                echo $serviceCount > 0 ? 
                                    number_format($serviceCount) . ' servicio' . ($serviceCount != 1 ? 's' : '') :
                                    'Próximamente';
                                ?>
                            </p>
                            <?php if (isset($category['avg_rating']) && $category['avg_rating'] > 0): ?>
                                <p style="margin: var(--space-1) 0 0 0; color: var(--warning-amber); font-size: var(--font-size-sm);">
                                    ★ <?= number_format($category['avg_rating'], 1) ?> promedio
                                </p>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div style="padding: var(--space-4); background: var(--neutral-100); border-radius: var(--radius-md); border: 1px solid var(--neutral-200);">
                    <p style="margin: 0; color: var(--neutral-600);">
                        No hay categorías con servicios registrados aún. 
                        <strong>Esto es correcto</strong> - mostramos la realidad en lugar de datos ficticios.
                    </p>
                </div>
            <?php endif; ?>
        </section>
        
        <!-- Implementation Guidelines -->
        <section class="example-section">
            <h2>🔧 Guías de Implementación</h2>
            
            <h3>✅ Hacer SIEMPRE:</h3>
            <ul style="color: var(--success-green);">
                <li>Usar <code>DatabaseHelper::getPlatformStats()</code> para estadísticas</li>
                <li>Consultar usuarios reales con <code>TrustBadgeComponent::getRealUsersData()</code></li>
                <li>Obtener servicios reales con <code>ServiceCardProfessional::getRealServicesData()</code></li>
                <li>Mostrar mensajes apropiados cuando no hay datos ("Próximamente", "Sé el primero")</li>
                <li>Usar contadores que reflejen la actividad real de la plataforma</li>
            </ul>
            
            <h3>❌ NUNCA hacer:</h3>
            <ul style="color: var(--danger-red);">
                <li>Hardcodear números como "5,000+" o "15,000+"</li>
                <li>Usar datos de ejemplo o placeholders en producción</li>
                <li>Mostrar ratings o estadísticas inventadas</li>
                <li>Crear usuarios ficticios para demos</li>
                <li>Usar contadores que no reflejen la realidad</li>
            </ul>
            
            <h3>💡 Beneficios de esta implementación:</h3>
            <ul style="color: var(--primary-blue);">
                <li><strong>Credibilidad real</strong>: Los usuarios ven datos auténticos</li>
                <li><strong>Transparencia</strong>: No engañamos sobre nuestro tamaño real</li>
                <li><strong>Crecimiento orgánico</strong>: Las métricas crecen naturalmente</li>
                <li><strong>Confianza</strong>: Los clientes saben que es una plataforma real</li>
                <li><strong>SEO honesto</strong>: No hay información falsa indexada</li>
            </ul>
        </section>
        
        <!-- Database Query Examples -->
        <section class="example-section">
            <h2>🗄️ Ejemplos de Consultas SQL</h2>
            
            <div class="code-example">
-- Estadísticas de freelancers activos
SELECT COUNT(*) as freelancers_count 
FROM users 
WHERE user_type = 'freelancer' AND status = 'active';

-- Proyectos completados reales
SELECT COUNT(*) as projects_completed 
FROM projects 
WHERE status = 'completed';

-- Calificación promedio real
SELECT AVG(rating) as average_rating 
FROM reviews 
WHERE status = 'approved';

-- Servicios activos por categoría
SELECT c.name, COUNT(s.id) as service_count
FROM categories c
LEFT JOIN services s ON c.id = s.category_id AND s.status = 'active'
GROUP BY c.id, c.name
ORDER BY service_count DESC;
            </div>
        </section>
        
        <!-- Cache Information -->
        <section class="example-section">
            <h2>⚡ Información de Cache</h2>
            
            <?php $cacheStats = DatabaseHelper::getCacheStats(); ?>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number"><?= $cacheStats['cached_queries'] ?></span>
                    <span class="stat-label">Consultas en Cache</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= $cacheStats['cache_timeout'] ?>s</span>
                    <span class="stat-label">Timeout de Cache</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number"><?= number_format($cacheStats['memory_usage'] / 1024 / 1024, 2) ?>MB</span>
                    <span class="stat-label">Uso de Memoria</span>
                </div>
            </div>
            
            <p style="color: var(--neutral-600); font-size: var(--font-size-sm); margin-top: var(--space-4);">
                <strong>Cache:</strong> Las consultas se cachean por 5 minutos para mejorar el rendimiento, 
                pero siempre reflejan datos reales y actualizados de la base de datos.
            </p>
        </section>
    </div>
</body>
</html>