<?php
/**
 * Script to add superadmin user and update database schema
 * Run this via: http://localhost/Laburar/database/execute-superadmin.php
 */

header('Content-Type: text/html; charset=utf-8');

// Database connection
$host = 'localhost';
$username = 'root';
$password = 'Tyr1945@';
$database = 'laburemos_db';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>🔧 Actualizando Base de Datos LaburAR</h2>";
    echo "<div style='font-family: monospace; background: #f0f0f0; padding: 10px; margin: 10px 0;'>";
    
    // Step 1: Update user_type enum
    echo "<h3>1. Actualizando tipos de usuario...</h3>";
    $sql1 = "ALTER TABLE users MODIFY COLUMN user_type ENUM('client', 'freelancer', 'admin', 'mod', 'superadmin') DEFAULT 'client'";
    $pdo->exec($sql1);
    echo "✅ Tipos de usuario actualizados (client, freelancer, admin, mod, superadmin)<br>";
    
    // Step 2: Generate password hash for 'Tyr1945@'
    echo "<h3>2. Generando hash de contraseña...</h3>";
    $password = 'Tyr1945@';
    $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    echo "✅ Hash generado para contraseña<br>";
    
    // Step 3: Insert/Update superadmin user
    echo "<h3>3. Creando usuario superadmin...</h3>";
    $sql2 = "INSERT INTO users (
        email, password_hash, user_type, first_name, last_name, phone,
        country, city, language, timezone, email_verified, phone_verified,
        identity_verified, is_active, created_at, updated_at
    ) VALUES (
        'lesistern@gmail.com', :password_hash, 'superadmin', 'System', 'Administrator',
        '+54911234567', 'Argentina', 'Buenos Aires', 'es', 'America/Argentina/Buenos_Aires',
        TRUE, TRUE, TRUE, TRUE, NOW(), NOW()
    ) ON DUPLICATE KEY UPDATE 
        password_hash = VALUES(password_hash),
        user_type = VALUES(user_type),
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        updated_at = NOW()";
    
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->bindParam(':password_hash', $password_hash);
    $stmt2->execute();
    echo "✅ Usuario superadmin creado/actualizado: lesistern@gmail.com<br>";
    
    // Step 4: Create sessions table
    echo "<h3>4. Creando tabla de sesiones...</h3>";
    $sql3 = "CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        INDEX idx_last_activity (last_activity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql3);
    echo "✅ Tabla user_sessions creada<br>";
    
    // Step 5: Create activity log table
    echo "<h3>5. Creando tabla de actividad...</h3>";
    $sql4 = "CREATE TABLE IF NOT EXISTS user_activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255),
        activity_type ENUM('login', 'logout', 'page_view', 'api_call', 'click', 'keyboard') DEFAULT 'page_view',
        page_url VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_session_token (session_token),
        INDEX idx_activity_type (activity_type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql4);
    echo "✅ Tabla user_activity_log creada<br>";
    
    // Step 6: Show created user
    echo "<h3>6. Usuario superadmin creado:</h3>";
    $stmt5 = $pdo->prepare("SELECT id, email, user_type, first_name, last_name, email_verified, is_active, created_at FROM users WHERE email = 'lesistern@gmail.com'");
    $stmt5->execute();
    $user = $stmt5->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr style='background: #e0e0e0;'>";
        foreach ($user as $key => $value) {
            echo "<th style='padding: 5px;'>$key</th>";
        }
        echo "</tr><tr>";
        foreach ($user as $key => $value) {
            echo "<td style='padding: 5px;'>$value</td>";
        }
        echo "</tr></table>";
    }
    
    // Step 7: Show user counts by type
    echo "<h3>7. Resumen de usuarios por tipo:</h3>";
    $stmt6 = $pdo->query("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type ORDER BY CASE user_type WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 WHEN 'mod' THEN 3 WHEN 'freelancer' THEN 4 WHEN 'client' THEN 5 END");
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr style='background: #e0e0e0;'><th style='padding: 5px;'>Tipo de Usuario</th><th style='padding: 5px;'>Cantidad</th></tr>";
    while ($row = $stmt6->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td style='padding: 5px;'>{$row['user_type']}</td><td style='padding: 5px;'>{$row['count']}</td></tr>";
    }
    echo "</table>";
    
    echo "</div>";
    echo "<h2>🎉 ¡Actualización completada exitosamente!</h2>";
    echo "<p><strong>Credenciales del superadmin:</strong></p>";
    echo "<ul>";
    echo "<li><strong>Email:</strong> lesistern@gmail.com</li>";
    echo "<li><strong>Password:</strong> Tyr1945@</li>";
    echo "<li><strong>Rol:</strong> superadmin</li>";
    echo "</ul>";
    echo "<p>Ahora puedes usar estas credenciales para acceder al panel de administración.</p>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error en la base de datos:</h2>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
} catch (Exception $e) {
    echo "<h2>❌ Error general:</h2>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
}
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
}
h2 { color: #2c3e50; }
h3 { color: #34495e; margin-top: 20px; }
.success { color: #27ae60; }
.error { color: #e74c3c; }
</style>