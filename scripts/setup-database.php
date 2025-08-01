<?php
/**
 * Setup Database for LaburAR
 * Ejecuta este archivo una vez que XAMPP esté funcionando
 * URL: http://localhost/Laburar/setup-database.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🚀 LaburAR - Configuración de Base de Datos</h1>";

// Configuración de la base de datos
$host = 'localhost';
$username = 'root';
$password = '';  // XAMPP por defecto no tiene password
$database = 'laburar';

try {
    // Conectar a MySQL sin seleccionar base de datos
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Conexión a MySQL exitosa</p>";
    
    // Crear base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p>✅ Base de datos '$database' creada/verificada</p>";
    
    // Seleccionar la base de datos
    $pdo->exec("USE `$database`");
    
    // Lista de archivos SQL a ejecutar en orden
    $sqlFiles = [
        'database/schema/complete_database_schema.sql',
        'database/schema/marketplace_schema.sql',
        'database/schema/projects_schema.sql',
        'database/schema/payments_schema.sql',
        'database/schema/reviews_schema.sql',
        'database/schema/notifications_schema.sql',
        'database/schema/chat_schema.sql'
    ];
    
    foreach ($sqlFiles as $file) {
        $filePath = __DIR__ . '/' . $file;
        if (file_exists($filePath)) {
            echo "<h3>📄 Ejecutando: $file</h3>";
            $sql = file_get_contents($filePath);
            
            // Dividir en declaraciones individuales
            $statements = explode(';', $sql);
            
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (!empty($statement)) {
                    try {
                        $pdo->exec($statement);
                    } catch (PDOException $e) {
                        // Ignorar errores de "tabla ya existe"
                        if (strpos($e->getMessage(), 'already exists') === false) {
                            echo "<p>⚠️ Warning en $file: " . $e->getMessage() . "</p>";
                        }
                    }
                }
            }
            echo "<p>✅ $file ejecutado correctamente</p>";
        } else {
            echo "<p>❌ Archivo no encontrado: $file</p>";
        }
    }
    
    echo "<h2>🎉 ¡Configuración Completada!</h2>";
    echo "<p>La base de datos LaburAR ha sido configurada exitosamente.</p>";
    echo "<h3>🔗 Enlaces Útiles:</h3>";
    echo "<ul>";
    echo "<li><a href='index.php'>🏠 Página Principal</a></li>";
    echo "<li><a href='login.html'>🔐 Iniciar Sesión</a></li>";
    echo "<li><a href='register.html'>📝 Registrarse</a></li>";
    echo "<li><a href='marketplace.html'>🛒 Marketplace</a></li>";
    echo "<li><a href='chat.html'>💬 Chat</a></li>";
    echo "<li><a href='notifications.html'>🔔 Notificaciones</a></li>";
    echo "</ul>";
    
    echo "<h3>📊 Información del Sistema:</h3>";
    echo "<ul>";
    echo "<li><strong>Base de datos:</strong> $database</li>";
    echo "<li><strong>Host:</strong> $host</li>";
    echo "<li><strong>Usuario:</strong> $username</li>";
    echo "<li><strong>Charset:</strong> utf8mb4</li>";
    echo "</ul>";
    
    // Verificar algunas tablas
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<h3>📋 Tablas Creadas (" . count($tables) . "):</h3>";
    echo "<div style='columns: 3; column-gap: 20px;'>";
    foreach ($tables as $table) {
        echo "<div>• $table</div>";
    }
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error de Conexión</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<h3>🔧 Posibles Soluciones:</h3>";
    echo "<ul>";
    echo "<li>Verificar que MySQL esté corriendo en XAMPP</li>";
    echo "<li>Verificar el usuario y contraseña</li>";
    echo "<li>Verificar que el puerto 3306 esté disponible</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><small>LaburAR Platform v1.0 - " . date('Y-m-d H:i:s') . "</small></p>";
?>

<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
    background: #f5f5f5;
}

h1 {
    color: #0078D4;
    border-bottom: 3px solid #0078D4;
    padding-bottom: 10px;
}

h2 {
    color: #106ebe;
}

h3 {
    color: #2c3e50;
}

p, li {
    line-height: 1.6;
}

a {
    color: #0078D4;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

ul {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>