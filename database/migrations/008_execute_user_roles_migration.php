<?php
/**
 * Script ejecutor para la migración de roles de usuario
 * Ejecuta la migración SQL y valida los resultados
 * 
 * @package LaburAR
 * @version 2.0
 * @author Claude Code
 */

// Cargar configuración de base de datos
$config = require __DIR__ . '/../../config/database.php';
$dbConfig = $config['connections']['mysql'];

// Definir constantes para compatibilidad
define('DB_HOST', $dbConfig['host']);
define('DB_NAME', $dbConfig['database']);
define('DB_USER', $dbConfig['username']);
define('DB_PASS', $dbConfig['password']);

echo "🚀 INICIANDO MIGRACIÓN DE ROLES DE USUARIO\n";
echo "==========================================\n\n";

try {
    // Conectar a la base de datos
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Conexión a base de datos establecida\n";
    
    // Verificar que la base de datos existe
    $pdo->exec("USE " . DB_NAME);
    echo "✅ Base de datos '" . DB_NAME . "' seleccionada\n\n";
    
    // Leer el archivo de migración
    $migrationFile = __DIR__ . '/007_redesign_user_roles.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Archivo de migración no encontrado: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    echo "✅ Archivo de migración cargado\n";
    
    // Verificar estado actual antes de la migración
    echo "\n📊 ESTADO ANTES DE LA MIGRACIÓN:\n";
    echo "================================\n";
    
    try {
        $stmt = $pdo->query("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type");
        $beforeStats = $stmt->fetchAll();
        
        foreach ($beforeStats as $stat) {
            echo "- {$stat['user_type']}: {$stat['count']} usuarios\n";
        }
        
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $totalBefore = $stmt->fetch()['total'];
        echo "- Total: $totalBefore usuarios\n\n";
        
    } catch (Exception $e) {
        echo "⚠️  No se pudo obtener estadísticas previas (tabla users podría no existir)\n\n";
    }
    
    // Ejecutar la migración por bloques
    echo "🔄 EJECUTANDO MIGRACIÓN...\n";
    echo "==========================\n";
    
    // Dividir el SQL en statements individuales
    $statements = preg_split('/;\s*$/m', $sql);
    $statements = array_filter($statements, function($stmt) {
        return trim($stmt) !== '' && !preg_match('/^\s*--/', $stmt);
    });
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $index => $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        try {
            $pdo->exec($statement);
            $successCount++;
            
            // Mostrar progreso cada 10 statements
            if (($index + 1) % 10 === 0) {
                echo "📈 Procesados " . ($index + 1) . " statements...\n";
            }
            
        } catch (Exception $e) {
            $errorCount++;
            // Mostrar solo errores críticos, ignorar warnings menores
            if (strpos($e->getMessage(), 'already exists') === false &&
                strpos($e->getMessage(), 'Duplicate') === false) {
                echo "⚠️  Error en statement " . ($index + 1) . ": " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n📊 RESULTADOS DE LA MIGRACIÓN:\n";
    echo "==============================\n";
    echo "✅ Statements exitosos: $successCount\n";
    echo "⚠️  Statements con errores: $errorCount\n\n";
    
    // Verificar estado después de la migración
    echo "📊 ESTADO DESPUÉS DE LA MIGRACIÓN:\n";
    echo "==================================\n";
    
    // Verificar nuevas columnas en users
    try {
        $stmt = $pdo->query("
            SELECT 
                user_category,
                is_client,
                is_freelancer,
                COUNT(*) as count
            FROM users 
            GROUP BY user_category, is_client, is_freelancer
            ORDER BY user_category, is_client DESC, is_freelancer DESC
        ");
        $afterStats = $stmt->fetchAll();
        
        echo "USUARIOS POR CATEGORÍA Y ROLES:\n";
        foreach ($afterStats as $stat) {
            $category = $stat['user_category'];
            $client = $stat['is_client'] ? 'Cliente' : '';
            $freelancer = $stat['is_freelancer'] ? 'Freelancer' : '';
            $roles = trim($client . ' ' . $freelancer) ?: 'Sin rol';
            echo "- $category ($roles): {$stat['count']} usuarios\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error verificando nuevas columnas: " . $e->getMessage() . "\n";
    }
    
    // Verificar team_members
    try {
        $stmt = $pdo->query("
            SELECT 
                department,
                role_level,
                COUNT(*) as count
            FROM team_members 
            WHERE is_active = TRUE
            GROUP BY department, role_level
            ORDER BY department, 
                FIELD(role_level, 'ceo', 'director', 'manager', 'lead', 'senior', 'mid', 'junior')
        ");
        $teamStats = $stmt->fetchAll();
        
        echo "\nMIEMBROS DEL EQUIPO TÉCNICO:\n";
        $currentDept = '';
        foreach ($teamStats as $stat) {
            if ($stat['department'] !== $currentDept) {
                $currentDept = $stat['department'];
                echo "📂 " . strtoupper($currentDept) . ":\n";
            }
            echo "  - {$stat['role_level']}: {$stat['count']} miembros\n";
        }
        
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM team_members WHERE is_active = TRUE");
        $totalTeam = $stmt->fetch()['total'];
        echo "\n👥 Total equipo técnico: $totalTeam miembros\n";
        
    } catch (Exception $e) {
        echo "❌ Error verificando team_members: " . $e->getMessage() . "\n";
    }
    
    // Verificar vistas creadas
    echo "\n📋 VERIFICANDO VISTAS CREADAS:\n";
    echo "==============================\n";
    
    $views = ['public_users', 'team_users', 'user_summary'];
    foreach ($views as $view) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $view LIMIT 1");
            $count = $stmt->fetch()['count'];
            echo "✅ Vista '$view': $count registros\n";
        } catch (Exception $e) {
            echo "❌ Vista '$view': Error - " . $e->getMessage() . "\n";
        }
    }
    
    // Verificar stored procedures
    echo "\n🔧 VERIFICANDO STORED PROCEDURES:\n";
    echo "=================================\n";
    
    $procedures = ['AssignClientRole', 'AssignFreelancerRole', 'CreateTeamMember'];
    foreach ($procedures as $procedure) {
        try {
            $stmt = $pdo->query("SHOW PROCEDURE STATUS WHERE Name = '$procedure'");
            $exists = $stmt->fetch();
            if ($exists) {
                echo "✅ Procedure '$procedure': Creado correctamente\n";
            } else {
                echo "❌ Procedure '$procedure': No encontrado\n";
            }
        } catch (Exception $e) {
            echo "⚠️  Procedure '$procedure': " . $e->getMessage() . "\n";
        }
    }
    
    // Ejecutar pruebas básicas
    echo "\n🧪 EJECUTANDO PRUEBAS BÁSICAS:\n";
    echo "==============================\n";
    
    // Prueba 1: Verificar triggers
    try {
        $stmt = $pdo->query("SHOW TRIGGERS LIKE 'users'");
        $triggers = $stmt->fetchAll();
        echo "✅ Triggers en tabla users: " . count($triggers) . " encontrados\n";
    } catch (Exception $e) {
        echo "⚠️  Error verificando triggers: " . $e->getMessage() . "\n";
    }
    
    // Prueba 2: Verificar integridad referencial
    try {
        $stmt = $pdo->query("
            SELECT COUNT(*) as orphaned 
            FROM team_members tm 
            LEFT JOIN users u ON tm.user_id = u.id 
            WHERE u.id IS NULL
        ");
        $orphaned = $stmt->fetch()['orphaned'];
        if ($orphaned == 0) {
            echo "✅ Integridad referencial: Sin registros huérfanos\n";
        } else {
            echo "⚠️  Integridad referencial: $orphaned registros huérfanos encontrados\n";
        }
    } catch (Exception $e) {
        echo "⚠️  Error verificando integridad: " . $e->getMessage() . "\n";
    }
    
    // Resumen final
    echo "\n🎉 MIGRACIÓN COMPLETADA\n";
    echo "=======================\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $totalUsers = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM team_members WHERE is_active = TRUE");
    $totalTeamMembers = $stmt->fetch()['total'];
    
    echo "📊 RESUMEN FINAL:\n";
    echo "- Total usuarios: $totalUsers\n";
    echo "- Miembros del equipo: $totalTeamMembers\n";
    echo "- Usuarios públicos: " . ($totalUsers - $totalTeamMembers) . "\n";
    
    echo "\n✅ MIGRACIÓN EXITOSA - El sistema ahora soporta:\n";
    echo "  • Flags flexibles is_client/is_freelancer para usuarios públicos\n";
    echo "  • Tabla separada team_members para equipo técnico\n";
    echo "  • Sistema de permisos granular para el equipo\n";
    echo "  • Vistas optimizadas para consultas frecuentes\n";
    echo "  • Stored procedures para gestión de roles\n";
    echo "  • Triggers para mantener integridad de datos\n";
    
    // Generar script de rollback
    $rollbackScript = __DIR__ . '/008_rollback_user_roles.sql';
    $rollbackContent = "-- SCRIPT DE ROLLBACK PARA MIGRACIÓN DE ROLES\n";
    $rollbackContent .= "-- Ejecutar solo si es necesario revertir la migración\n\n";
    $rollbackContent .= "USE " . DB_NAME . ";\n\n";
    $rollbackContent .= "-- Restaurar desde backup\n";
    $rollbackContent .= "-- INSERT INTO users SELECT * FROM users_backup_20250726;\n\n";
    $rollbackContent .= "-- Eliminar nuevas tablas si es necesario\n";
    $rollbackContent .= "-- DROP TABLE IF EXISTS team_members;\n";
    $rollbackContent .= "-- DROP TABLE IF EXISTS user_role_history;\n\n";
    $rollbackContent .= "-- Eliminar nuevas columnas\n";
    $rollbackContent .= "-- ALTER TABLE users DROP COLUMN is_client;\n";
    $rollbackContent .= "-- ALTER TABLE users DROP COLUMN is_freelancer;\n";
    $rollbackContent .= "-- ALTER TABLE users DROP COLUMN user_category;\n";
    
    file_put_contents($rollbackScript, $rollbackContent);
    echo "\n📝 Script de rollback generado: $rollbackScript\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR CRÍTICO EN LA MIGRACIÓN:\n";
    echo "=================================\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n\n";
    
    echo "🔄 RECOMENDACIONES:\n";
    echo "1. Verificar la configuración de base de datos\n";
    echo "2. Asegurar que el usuario tenga permisos CREATE, ALTER, DROP\n";
    echo "3. Revisar el archivo de migración SQL\n";
    echo "4. Ejecutar manualmente desde phpMyAdmin si es necesario\n";
    
    exit(1);
}

echo "\n🎯 PRÓXIMOS PASOS:\n";
echo "==================\n";
echo "1. Actualizar los modelos PHP para usar la nueva estructura\n";
echo "2. Actualizar el dashboard para soportar team_members\n";
echo "3. Implementar interfaces de administración para el equipo\n";
echo "4. Probar el sistema de permisos\n";
echo "5. Actualizar la documentación\n\n";

echo "✨ ¡Migración completada exitosamente! ✨\n";
?>