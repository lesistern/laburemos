<?php
/**
 * Setup Script para Servicios Argentinos
 * 
 * Este script ejecuta el schema de servicios argentinos
 * y crea las tablas necesarias para el Sprint 1-2
 * 
 * @author LaburAR Team
 * @version 1.0
 */

require_once '../includes/Database.php';

echo "=== LaburAR - Setup Servicios Argentinos ===\n";
echo "Este script creará las tablas para el sistema ServicioLaR\n\n";

try {
    // Obtener conexión a la base de datos
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    echo "✓ Conexión a base de datos establecida\n";
    
    // Leer el archivo SQL
    $sqlFile = __DIR__ . '/schema/servicios_argentinos_schema.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("No se encontró el archivo SQL: $sqlFile");
    }
    
    echo "✓ Archivo SQL encontrado\n";
    
    // Leer contenido del archivo
    $sql = file_get_contents($sqlFile);
    
    // Dividir el SQL en statements individuales
    // Primero remover los delimitadores personalizados
    $sql = preg_replace('/DELIMITER\s+\$\$/', '', $sql);
    $sql = preg_replace('/DELIMITER\s+;/', '', $sql);
    $sql = str_replace('$$', ';', $sql);
    
    // Dividir por punto y coma, pero ignorar los que están dentro de strings
    $statements = preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sql);
    
    $successCount = 0;
    $errorCount = 0;
    
    echo "\nEjecutando statements SQL...\n\n";
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        
        if (empty($statement)) {
            continue;
        }
        
        try {
            // Mostrar qué se está ejecutando (primeras 60 caracteres)
            $preview = substr(preg_replace('/\s+/', ' ', $statement), 0, 60);
            echo "Ejecutando: $preview... ";
            
            $pdo->exec($statement);
            echo "✓\n";
            $successCount++;
            
        } catch (PDOException $e) {
            echo "✗\n";
            echo "  Error: " . $e->getMessage() . "\n";
            $errorCount++;
            
            // Si es un error crítico (no es "already exists"), detener
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate column') === false) {
                throw $e;
            }
        }
    }
    
    echo "\n=== Resumen de Ejecución ===\n";
    echo "Statements ejecutados exitosamente: $successCount\n";
    echo "Statements con errores: $errorCount\n";
    
    // Verificar tablas creadas
    echo "\n=== Verificando Tablas Creadas ===\n";
    
    $tablesToCheck = [
        'service_packages',
        'argentina_trust_signals',
        'service_package_features'
    ];
    
    foreach ($tablesToCheck as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Tabla '$table' creada correctamente\n";
        } else {
            echo "✗ Tabla '$table' NO encontrada\n";
        }
    }
    
    // Verificar columnas agregadas a services
    echo "\n=== Verificando Columnas en tabla 'services' ===\n";
    
    $columnsToCheck = [
        'service_type',
        'argentina_features',
        'monotributo_verified',
        'videollamada_available',
        'cuotas_disponibles',
        'talento_argentino_badge',
        'ubicacion_argentina'
    ];
    
    $stmt = $pdo->query("DESCRIBE services");
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($columnsToCheck as $column) {
        if (in_array($column, $existingColumns)) {
            echo "✓ Columna '$column' existe\n";
        } else {
            echo "✗ Columna '$column' NO encontrada\n";
        }
    }
    
    // Verificar vista
    echo "\n=== Verificando Vista ===\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'v_servicios_argentinos'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Vista 'v_servicios_argentinos' creada correctamente\n";
    } else {
        echo "✗ Vista 'v_servicios_argentinos' NO encontrada\n";
    }
    
    echo "\n✅ Setup completado exitosamente!\n";
    echo "\nPuedes ejecutar los tests con:\n";
    echo "php tests/models/ServiceArgentinoTest.php\n";
    
} catch (Exception $e) {
    echo "\n❌ Error durante el setup:\n";
    echo $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
?>