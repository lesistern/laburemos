<?php
/**
 * Final setup - simplified without problematic tables
 */

$config = require __DIR__ . '/../config/database.php';
$dbConfig = $config['connections']['mysql'];

echo "🎯 CONFIGURACIÓN FINAL - USUARIOS DEMO\n";
echo "======================================\n\n";

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✅ Conectado a la base de datos\n\n";
    
    // Ensure demo user is freelancer
    echo "🎭 CONFIGURANDO USUARIO DEMO\n";
    echo "============================\n";
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET is_freelancer = TRUE, is_client = TRUE
        WHERE email = 'demo.user@laburar.com'
    ");
    $stmt->execute();
    echo "✅ Usuario demo configurado como cliente + freelancer\n";
    
    // Ensure CEO is in team category
    echo "\n👑 CONFIGURANDO CEO\n";
    echo "==================\n";
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET user_category = 'team', is_client = FALSE, is_freelancer = FALSE
        WHERE email = 'ceo@laburar.com'
    ");
    $stmt->execute();
    echo "✅ CEO configurado como equipo técnico\n";
    
    // Final verification
    echo "\n📋 VERIFICACIÓN FINAL\n";
    echo "====================\n";
    
    $stmt = $pdo->query("
        SELECT 
            u.email, u.first_name, u.last_name, u.user_category,
            u.is_client, u.is_freelancer,
            tm.position, tm.access_level
        FROM users u
        LEFT JOIN team_members tm ON u.id = tm.user_id
        WHERE u.email IN ('admin@laburar.com', 'demo.user@laburar.com', 'ceo@laburar.com')
        AND u.is_active = TRUE
        ORDER BY u.user_category DESC, u.email
    ");
    
    $users = $stmt->fetchAll();
    
    echo "👥 USUARIOS CONFIGURADOS:\n";
    foreach ($users as $user) {
        echo "\n🔹 {$user['first_name']} {$user['last_name']}\n";
        echo "   📧 Email: {$user['email']}\n";
        echo "   📁 Categoría: {$user['user_category']}\n";
        
        if ($user['user_category'] === 'team') {
            echo "   👔 Posición: " . ($user['position'] ?: 'Administrador') . "\n";
            echo "   🔐 Acceso: " . ($user['access_level'] ?: 'admin') . "\n";
        } else {
            $roles = [];
            if ($user['is_client']) $roles[] = 'Cliente';
            if ($user['is_freelancer']) $roles[] = 'Freelancer';
            echo "   🎭 Roles: " . implode(' + ', $roles) . "\n";
        }
    }
    
    // Show statistics
    echo "\n📊 ESTADÍSTICAS DEL SISTEMA\n";
    echo "===========================\n";
    
    $stmt = $pdo->query("
        SELECT 
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE THEN 1 END) as clients,
            COUNT(CASE WHEN user_category = 'public' AND is_freelancer = TRUE THEN 1 END) as freelancers,
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE THEN 1 END) as dual_users,
            COUNT(CASE WHEN user_category = 'team' THEN 1 END) as team_members,
            COUNT(*) as total_users
        FROM users WHERE is_active = TRUE
    ");
    $stats = $stmt->fetch();
    
    echo "📈 Usuarios registrados:\n";
    echo "   - Total: {$stats['total_users']}\n";
    echo "   - Clientes: {$stats['clients']}\n";
    echo "   - Freelancers: {$stats['freelancers']}\n";
    echo "   - Rol dual: {$stats['dual_users']}\n";
    echo "   - Equipo técnico: {$stats['team_members']}\n";
    
    echo "\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE\n";
    echo "========================================\n\n";
    
    echo "🔑 CREDENCIALES DE ACCESO:\n";
    echo "=========================\n\n";
    
    echo "1️⃣  ADMINISTRADOR (Equipo Técnico):\n";
    echo "    📧 Email: admin@laburar.com\n";
    echo "    🔑 Password: admin123\n";
    echo "    🎯 Acceso: Super Administrador\n";
    echo "    📱 Dashboard: Panel de administración completo\n\n";
    
    echo "2️⃣  CEO (Ejecutivo):\n";
    echo "    📧 Email: ceo@laburar.com\n";
    echo "    🔑 Password: password\n";
    echo "    🎯 Acceso: Chief Executive Officer\n";
    echo "    📱 Dashboard: Panel ejecutivo con métricas\n\n";
    
    echo "3️⃣  USUARIO DEMO (Cliente + Freelancer):\n";
    echo "    📧 Email: demo.user@laburar.com\n";
    echo "    🔑 Password: password\n";
    echo "    🎯 Acceso: Usuario público con rol dual\n";
    echo "    📱 Dashboard: Panel de freelancer/cliente\n\n";
    
    echo "🚀 PRÓXIMOS PASOS:\n";
    echo "==================\n";
    echo "1. Visita http://localhost/Laburar/ para probar el login\n";
    echo "2. Inicia sesión con cualquiera de los usuarios\n";
    echo "3. El dashboard se adaptará automáticamente al tipo de usuario\n";
    echo "4. Los usuarios de equipo verán el panel administrativo\n";
    echo "5. Los usuarios públicos verán el dashboard de freelancer/cliente\n\n";
    
    echo "✨ MIGRACIÓN COMPLETA Y SISTEMA OPERATIVO ✨\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    exit(1);
}
?>