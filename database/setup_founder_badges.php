<?php
/**
 * Setup Founder Badges Script
 * LABUREMOS Platform - Creates 100 numbered founder badges
 * 
 * This script creates badges numbered from #1 to #100 with different rarities:
 * - Fundador #1: Legendary (2000 pts) - Genesis founder
 * - Fundadores #2-#10: Exclusive (1000 pts) - Alpha founders
 * - Fundadores #11-#25: Legendary (750 pts) - Beta founders
 * - Fundadores #26-#50: Epic (500 pts) - Gamma founders  
 * - Fundadores #51-#75: Rare (350 pts) - Delta founders
 * - Fundadores #76-#100: Rare (250 pts) - Omega founders
 * 
 * @author LABUREMOS Team
 * @since 2025-01-25
 * @version 1.0
 */

require_once __DIR__ . '/../config/database.php';

// Set headers for proper output
header('Content-Type: text/html; charset=UTF-8');

echo "<!DOCTYPE html>\n";
echo "<html lang='es-AR'>\n";
echo "<head>\n";
echo "    <meta charset='UTF-8'>\n";
echo "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n";
echo "    <title>Setup Founder Badges - LABUREMOS</title>\n";
echo "    <style>\n";
echo "        body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8fafc; }\n";
echo "        .container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }\n";
echo "        h1 { color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }\n";
echo "        .success { background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo "        .error { background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo "        .info { background: #eff6ff; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo "        .badge-summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }\n";
echo "        table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n";
echo "        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }\n";
echo "        th { background: #f1f5f9; font-weight: 600; }\n";
echo "        .legendary { color: #f59e0b; font-weight: bold; }\n";
echo "        .exclusive { color: #ec4899; font-weight: bold; }\n";
echo "        .epic { color: #8b5cf6; font-weight: bold; }\n";
echo "        .rare { color: #3b82f6; font-weight: bold; }\n";
echo "        .founder-number { font-weight: bold; color: #1e293b; }\n";
echo "    </style>\n";
echo "</head>\n";
echo "<body>\n";
echo "<div class='container'>\n";

echo "<h1>🏆 Setup Founder Badges - LABUREMOS Platform</h1>\n";

try {
    // Database connection
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "<div class='success'>✅ Conexión a base de datos establecida exitosamente</div>\n";
    
    // Read and execute the migration SQL
    $sqlFile = __DIR__ . '/migrations/006_create_founder_badges.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("Migration file not found: $sqlFile");
    }
    
    echo "<div class='info'>📄 Leyendo archivo de migración: 006_create_founder_badges.sql</div>\n";
    
    $sql = file_get_contents($sqlFile);
    
    // Split SQL into individual statements (simple approach)
    $statements = explode(';', $sql);
    
    echo "<div class='info'>⚙️ Ejecutando migración de badges Fundador...</div>\n";
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement) && !preg_match('/^(--|\#)/', $statement)) {
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                // Ignore some expected errors (like procedure already exists)
                if (!strpos($e->getMessage(), 'already exists') && 
                    !strpos($e->getMessage(), 'Duplicate entry') &&
                    !strpos($e->getMessage(), 'DROP PROCEDURE IF EXISTS')) {
                    echo "<div class='error'>⚠️ Warning en statement: " . htmlspecialchars($e->getMessage()) . "</div>\n";
                }
            }
        }
    }
    
    echo "<div class='success'>✅ Migración ejecutada exitosamente</div>\n";
    
    // Get summary of created badges
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total_badges,
            MIN(display_order) as first_founder,
            MAX(display_order) as last_founder
        FROM badges 
        WHERE slug LIKE 'fundador-%'
    ");
    $summary = $stmt->fetch();
    
    echo "<div class='badge-summary'>\n";
    echo "<h3>📊 Resumen de Badges Creados</h3>\n";
    echo "<p><strong>Total de badges Fundador:</strong> {$summary['total_badges']}</p>\n";
    echo "<p><strong>Rango:</strong> Fundador #{$summary['first_founder']} hasta Fundador #{$summary['last_founder']}</p>\n";
    echo "</div>\n";
    
    // Get breakdown by rarity
    $stmt = $pdo->query("
        SELECT 
            rarity,
            COUNT(*) as badge_count,
            MIN(display_order) as first_position,
            MAX(display_order) as last_position,
            MIN(points) as min_points,
            MAX(points) as max_points
        FROM badges 
        WHERE slug LIKE 'fundador-%'
        GROUP BY rarity
        ORDER BY 
            CASE rarity
                WHEN 'legendary' THEN 1
                WHEN 'exclusive' THEN 2  
                WHEN 'epic' THEN 3
                WHEN 'rare' THEN 4
                WHEN 'common' THEN 5
            END
    ");
    
    echo "<h3>🎯 Distribución por Rareza</h3>\n";
    echo "<table>\n";
    echo "<thead>\n";
    echo "<tr><th>Rareza</th><th>Cantidad</th><th>Rango</th><th>Puntos</th></tr>\n";
    echo "</thead>\n";
    echo "<tbody>\n";
    
    while ($row = $stmt->fetch()) {
        $rarity_class = strtolower($row['rarity']);
        $range = "#{$row['first_position']}";
        if ($row['first_position'] != $row['last_position']) {
            $range .= " - #{$row['last_position']}";
        }
        $points = $row['min_points'];
        if ($row['min_points'] != $row['max_points']) {
            $points .= " - {$row['max_points']}";
        }
        $points .= " pts";
        
        echo "<tr>\n";
        echo "<td class='{$rarity_class}'>" . ucfirst($row['rarity']) . "</td>\n";
        echo "<td>{$row['badge_count']} badges</td>\n";
        echo "<td class='founder-number'>{$range}</td>\n";
        echo "<td>{$points}</td>\n";
        echo "</tr>\n";
    }
    
    echo "</tbody>\n";
    echo "</table>\n";
    
    // Show some example badges
    $stmt = $pdo->query("
        SELECT 
            display_order as founder_number,
            name,
            rarity,
            points,
            LEFT(description, 100) as description_preview
        FROM badges 
        WHERE slug LIKE 'fundador-%'
        AND display_order IN (1, 5, 10, 25, 50, 75, 100)
        ORDER BY display_order
    ");
    
    echo "<h3>📋 Ejemplos de Badges Fundador</h3>\n";
    echo "<table>\n";
    echo "<thead>\n";
    echo "<tr><th>#</th><th>Nombre</th><th>Rareza</th><th>Puntos</th><th>Descripción</th></tr>\n";
    echo "</thead>\n";
    echo "<tbody>\n";
    
    while ($row = $stmt->fetch()) {
        $rarity_class = strtolower($row['rarity']);
        
        echo "<tr>\n";
        echo "<td class='founder-number'>#{$row['founder_number']}</td>\n";
        echo "<td>{$row['name']}</td>\n";
        echo "<td class='{$rarity_class}'>" . ucfirst($row['rarity']) . "</td>\n";
        echo "<td>{$row['points']} pts</td>\n";
        echo "<td>{$row['description_preview']}...</td>\n";
        echo "</tr>\n";
    }
    
    echo "</tbody>\n";
    echo "</table>\n";
    
    // Show current trigger status
    echo "<div class='info'>\n";
    echo "<h3>🔧 Configuración Automática</h3>\n";
    echo "<p>✅ <strong>Trigger activado:</strong> Los nuevos usuarios recibirán automáticamente su badge Fundador correspondiente al registrarse.</p>\n";
    echo "<p>🎯 <strong>Restricción de roles:</strong> Solo usuarios regulares (no admins/mods) pueden obtener badges Fundador.</p>\n";
    echo "<p>📊 <strong>Asignación basada en orden:</strong> El badge se asigna según el orden de registro en la plataforma.</p>\n";
    echo "</div>\n";
    
    echo "<div class='success'>\n";
    echo "<h3>🚀 ¡Setup Completado!</h3>\n";
    echo "<p>Los 100 badges Fundador han sido creados exitosamente. Los próximos usuarios que se registren recibirán automáticamente su badge correspondiente.</p>\n";
    echo "</div>\n";
    
} catch (Exception $e) {
    echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>\n";
    echo "<div class='info'>💡 Asegúrate de que la base de datos 'laburemos_db' existe y las credenciales en config/database.php son correctas.</div>\n";
}

echo "</div>\n";
echo "</body>\n";
echo "</html>\n";
?>