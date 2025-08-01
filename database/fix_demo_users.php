<?php
/**
 * Fix demo users and complete setup
 */

$config = require __DIR__ . '/../config/database.php';
$dbConfig = $config['connections']['mysql'];

echo "🔧 CORRIGIENDO USUARIOS DEMO\n";
echo "============================\n\n";

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✅ Conectado a la base de datos\n\n";
    
    // Fix 1: Update demo user to have freelancer role
    echo "🎭 PASO 1: Corrigiendo roles del usuario demo\n";
    echo "=============================================\n";
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET is_freelancer = TRUE 
        WHERE email = 'demo.user@laburar.com'
    ");
    $stmt->execute();
    echo "✅ Usuario demo actualizado a freelancer\n";
    
    // Fix 2: Create freelancer profile for demo user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'demo.user@laburar.com'");
    $stmt->execute();
    $demoUserId = $stmt->fetchColumn();
    
    if ($demoUserId) {
        // Check if profile exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM freelancer_profiles WHERE user_id = ?");
        $stmt->execute([$demoUserId]);
        
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("
                INSERT INTO freelancer_profiles (
                    user_id, title, professional_overview, skills, 
                    availability, rating_average, total_projects, created_at
                ) VALUES (?, ?, ?, ?, 'full_time', 4.5, 12, NOW())
            ");
            
            $stmt->execute([
                $demoUserId,
                'Desarrollador Full Stack',
                'Desarrollador experimentado con 5+ años en desarrollo web. Especializado en PHP, JavaScript, MySQL y frameworks modernos. Experiencia en proyectos e-commerce, sistemas de gestión y aplicaciones web.',
                json_encode(['PHP', 'JavaScript', 'MySQL', 'Laravel', 'React', 'Vue.js', 'Bootstrap', 'Git'])
            ]);
            
            echo "✅ Perfil de freelancer creado para usuario demo\n";
        } else {
            echo "ℹ️  Perfil de freelancer ya existe\n";
        }
    }
    
    // Fix 3: Move CEO to team category
    echo "\n👑 PASO 2: Corrigiendo usuario CEO\n";
    echo "==================================\n";
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET user_category = 'team', is_client = FALSE, is_freelancer = FALSE
        WHERE email = 'ceo@laburar.com'
    ");
    $stmt->execute();
    echo "✅ CEO movido a categoría team\n";
    
    // Create team member record for CEO if not exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'ceo@laburar.com'");
    $stmt->execute();
    $ceoUserId = $stmt->fetchColumn();
    
    if ($ceoUserId) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE user_id = ?");
        $stmt->execute([$ceoUserId]);
        
        if ($stmt->fetchColumn() == 0) {
            $employeeId = 'EMP' . str_pad($ceoUserId, 4, '0', STR_PAD_LEFT);
            $permissions = json_encode([
                'full_access', 'financial_management', 'strategic_decisions', 
                'user_management', 'team_management', 'business_analytics'
            ]);
            
            $stmt = $pdo->prepare("
                INSERT INTO team_members (
                    user_id, employee_id, department, position, role_level, 
                    access_level, permissions, hire_date, employment_type, work_location
                ) VALUES (?, ?, 'executive', 'Chief Executive Officer', 'ceo', 'super_admin', ?, CURDATE(), 'full_time', 'remote')
            ");
            
            $stmt->execute([$ceoUserId, $employeeId, $permissions]);
            echo "✅ Registro de equipo creado para CEO\n";
        } else {
            echo "ℹ️  Registro de equipo ya existe para CEO\n";
        }
    }
    
    // Fix 4: Add some sample projects and transactions for demo
    echo "\n📊 PASO 3: Agregando datos de ejemplo\n";
    echo "====================================\n";
    
    // Add sample projects for demo user
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE freelancer_id = ?");
    $stmt->execute([$demoUserId]);
    $projectCount = $stmt->fetchColumn();
    
    if ($projectCount == 0) {
        // Create sample projects
        $sampleProjects = [
            [
                'title' => 'Desarrollo de E-commerce con Laravel',
                'description' => 'Desarrollo completo de tienda online con sistema de pagos integrado',
                'budget' => 85000,
                'status' => 'completed'
            ],
            [
                'title' => 'Aplicación Web React + API',
                'description' => 'Dashboard administrativo con React frontend y Laravel API backend',
                'budget' => 120000,
                'status' => 'completed'
            ],
            [
                'title' => 'Sistema de Gestión Empresarial',
                'description' => 'Desarrollo de sistema CRM personalizado para empresa mediana',
                'budget' => 95000,
                'status' => 'active'
            ]
        ];
        
        foreach ($sampleProjects as $project) {
            $stmt = $pdo->prepare("
                INSERT INTO projects (
                    title, description, budget, status, freelancer_id, 
                    client_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            ");
            
            $stmt->execute([
                $project['title'],
                $project['description'],
                $project['budget'],
                $project['status'],
                $demoUserId
            ]);
        }
        
        echo "✅ Proyectos de ejemplo creados\n";
        
        // Add sample transactions
        $completedProjects = array_filter($sampleProjects, function($p) { return $p['status'] === 'completed'; });
        
        foreach ($completedProjects as $project) {
            $stmt = $pdo->prepare("
                INSERT INTO transactions (
                    user_id, amount, type, status, description, created_at
                ) VALUES (?, ?, 'earning', 'completed', ?, NOW())
            ");
            
            $stmt->execute([
                $demoUserId,
                $project['budget'],
                'Pago por proyecto: ' . $project['title']
            ]);
        }
        
        echo "✅ Transacciones de ejemplo creadas\n";
    } else {
        echo "ℹ️  Ya existen proyectos para el usuario demo\n";
    }
    
    // Fix 5: Create a sample review
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM reviews WHERE freelancer_id = ?");
    $stmt->execute([$demoUserId]);
    $reviewCount = $stmt->fetchColumn();
    
    if ($reviewCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO reviews (
                freelancer_id, client_id, rating, comment, created_at
            ) VALUES (?, 1, 5, 'Excelente trabajo, muy profesional y cumplió todos los plazos. Altamente recomendado.', NOW())
        ");
        $stmt->execute([$demoUserId]);
        
        $stmt = $pdo->prepare("
            INSERT INTO reviews (
                freelancer_id, client_id, rating, comment, created_at
            ) VALUES (?, 1, 4, 'Muy buen desarrollador, código limpio y bien documentado.', NOW())
        ");
        $stmt->execute([$demoUserId]);
        echo "✅ Reviews de ejemplo creadas\n";
    } else {
        echo "ℹ️  Ya existen reviews para el usuario demo\n";
    }
    
    // Step 6: Final verification
    echo "\n📋 PASO 4: Verificación final\n";
    echo "=============================\n";
    
    // Check final user states
    $stmt = $pdo->query("
        SELECT 
            u.email, u.first_name, u.last_name, u.user_category,
            u.is_client, u.is_freelancer,
            tm.position, tm.access_level,
            fp.title as freelancer_title
        FROM users u
        LEFT JOIN team_members tm ON u.id = tm.user_id
        LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.email IN ('admin@laburar.com', 'demo.user@laburar.com', 'ceo@laburar.com')
        ORDER BY u.user_category, u.email
    ");
    
    $users = $stmt->fetchAll();
    
    echo "👥 USUARIOS FINALES:\n";
    foreach ($users as $user) {
        echo "- {$user['first_name']} {$user['last_name']} ({$user['email']})\n";
        echo "  Categoría: {$user['user_category']}\n";
        
        if ($user['user_category'] === 'team') {
            echo "  Posición: {$user['position']} - {$user['access_level']}\n";
        } else {
            $roles = [];
            if ($user['is_client']) $roles[] = 'Cliente';
            if ($user['is_freelancer']) $roles[] = 'Freelancer';
            echo "  Roles: " . implode(' + ', $roles) . "\n";
            if ($user['freelancer_title']) {
                echo "  Título: {$user['freelancer_title']}\n";
            }
        }
        echo "\n";
    }
    
    // Show metrics for demo user
    $stmt = $pdo->prepare("
        SELECT 
            (SELECT COUNT(*) FROM projects WHERE freelancer_id = ? AND status = 'completed') as completed_projects,
            (SELECT COUNT(*) FROM projects WHERE freelancer_id = ? AND status = 'active') as active_projects,
            (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND status = 'completed') as total_earnings,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE freelancer_id = ?) as avg_rating
    ");
    $stmt->execute([$demoUserId, $demoUserId, $demoUserId, $demoUserId]);
    $metrics = $stmt->fetch();
    
    echo "📊 MÉTRICAS DEL USUARIO DEMO:\n";
    echo "- Proyectos completados: {$metrics['completed_projects']}\n";
    echo "- Proyectos activos: {$metrics['active_projects']}\n";
    echo "- Ganancias totales: $" . number_format($metrics['total_earnings']) . "\n";
    echo "- Rating promedio: " . round($metrics['avg_rating'], 1) . "/5\n\n";
    
    echo "🎉 CONFIGURACIÓN COMPLETADA\n";
    echo "===========================\n\n";
    
    echo "🔑 CREDENCIALES FINALES:\n";
    echo "========================\n";
    echo "1. ADMIN (Equipo técnico - Super Admin):\n";
    echo "   📧 Email: admin@laburar.com\n";
    echo "   🔑 Password: admin123\n";
    echo "   🎯 Dashboard: Panel de administración completo\n\n";
    
    echo "2. CEO (Equipo técnico - Ejecutivo):\n";
    echo "   📧 Email: ceo@laburar.com\n";
    echo "   🔑 Password: password\n";
    echo "   🎯 Dashboard: Panel ejecutivo con métricas del negocio\n\n";
    
    echo "3. USUARIO DEMO (Cliente + Freelancer):\n";
    echo "   📧 Email: demo.user@laburar.com\n";
    echo "   🔑 Password: password\n";
    echo "   🎯 Dashboard: Panel de freelancer con proyectos y ganancias\n";
    echo "   💼 Perfil: Desarrollador Full Stack con historial completo\n\n";
    
    echo "✨ SISTEMA COMPLETAMENTE CONFIGURADO Y LISTO ✨\n";
    echo "==============================================\n";
    echo "Ahora puedes probar el login con cualquiera de estos usuarios\n";
    echo "y ver cómo el dashboard se adapta según el tipo de usuario.\n\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    exit(1);
}
?>