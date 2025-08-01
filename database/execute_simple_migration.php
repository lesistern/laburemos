<?php
/**
 * Execute simple migration with error handling
 */

// Database configuration
$config = require __DIR__ . '/../config/database.php';
$dbConfig = $config['connections']['mysql'];

echo "🚀 EJECUTANDO MIGRACIÓN SIMPLIFICADA\n";
echo "====================================\n\n";

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true
        ]
    );
    
    echo "✅ Conectado a la base de datos\n\n";
    
    // Read and execute migration file
    $sqlFile = __DIR__ . '/migrations/007_simple_user_migration.sql';
    $sql = file_get_contents($sqlFile);
    
    // Execute the migration
    echo "📄 Ejecutando migración...\n";
    $pdo->exec($sql);
    
    echo "✅ Migración ejecutada exitosamente\n\n";
    
    // Verify results
    echo "📊 VERIFICANDO RESULTADOS:\n";
    echo "=========================\n";
    
    // Check user statistics
    $stmt = $pdo->query("
        SELECT 
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE THEN 1 END) as clients,
            COUNT(CASE WHEN user_category = 'public' AND is_freelancer = TRUE THEN 1 END) as freelancers,
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE THEN 1 END) as dual_role,
            COUNT(CASE WHEN user_category = 'team' THEN 1 END) as team_members
        FROM users
        WHERE is_active = TRUE
    ");
    $stats = $stmt->fetch();
    
    echo "👥 USUARIOS:\n";
    echo "- Clientes: {$stats['clients']}\n";
    echo "- Freelancers: {$stats['freelancers']}\n";
    echo "- Rol dual: {$stats['dual_role']}\n";
    echo "- Equipo técnico: {$stats['team_members']}\n\n";
    
    // Check team members
    $stmt = $pdo->query("
        SELECT 
            u.first_name,
            u.last_name,
            u.email,
            tm.position,
            tm.department,
            tm.role_level,
            tm.access_level
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE u.user_category = 'team' AND tm.is_active = TRUE
    ");
    $teamMembers = $stmt->fetchAll();
    
    echo "👨‍💻 EQUIPO TÉCNICO:\n";
    foreach ($teamMembers as $member) {
        echo "- {$member['first_name']} {$member['last_name']} ({$member['email']})\n";
        echo "  {$member['position']} - {$member['department']} - {$member['access_level']}\n\n";
    }
    
    // Check demo user
    $stmt = $pdo->query("
        SELECT 
            u.*,
            fp.title as freelancer_title
        FROM users u
        LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.email = 'demo.user@laburar.com'
    ");
    $demoUser = $stmt->fetch();
    
    if ($demoUser) {
        echo "🎭 USUARIO DEMO:\n";
        echo "- Nombre: {$demoUser['first_name']} {$demoUser['last_name']}\n";
        echo "- Email: {$demoUser['email']}\n";
        echo "- Es cliente: " . ($demoUser['is_client'] ? 'Sí' : 'No') . "\n";
        echo "- Es freelancer: " . ($demoUser['is_freelancer'] ? 'Sí' : 'No') . "\n";
        echo "- Título: " . ($demoUser['freelancer_title'] ?: 'N/A') . "\n";
        echo "- Password: password\n\n";
    }
    
    echo "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n";
    echo "===================================\n\n";
    
    echo "🔑 CREDENCIALES DE ACCESO:\n";
    echo "=========================\n";
    echo "ADMIN (Equipo técnico):\n";
    echo "- Email: admin@laburar.com\n";
    echo "- Password: admin123\n\n";
    
    echo "DEMO USER (Cliente + Freelancer):\n";
    echo "- Email: demo.user@laburar.com\n";
    echo "- Password: password\n\n";
    
    echo "CEO:\n";
    echo "- Email: ceo@laburar.com\n";
    echo "- Password: password\n\n";
    
    echo "LEAD DEVELOPER:\n";
    echo "- Email: lead.dev@laburar.com\n";
    echo "- Password: password\n\n";
    
    echo "QA MANAGER:\n";
    echo "- Email: qa.manager@laburar.com\n";
    echo "- Password: password\n\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    exit(1);
}
?>