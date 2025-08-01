<?php
/**
 * Check current state and apply migration incrementally
 */

$config = require __DIR__ . '/../config/database.php';
$dbConfig = $config['connections']['mysql'];

echo "🔍 VERIFICANDO ESTADO ACTUAL Y APLICANDO MIGRACIÓN\n";
echo "==================================================\n\n";

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✅ Conectado a la base de datos\n\n";
    
    // Step 1: Check if new columns exist
    echo "📋 PASO 1: Verificando columnas existentes\n";
    echo "==========================================\n";
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_client'");
    $hasIsClient = $stmt->rowCount() > 0;
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_freelancer'");
    $hasIsFreelancer = $stmt->rowCount() > 0;
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'user_category'");
    $hasUserCategory = $stmt->rowCount() > 0;
    
    echo "- is_client: " . ($hasIsClient ? "✅ Existe" : "❌ No existe") . "\n";
    echo "- is_freelancer: " . ($hasIsFreelancer ? "✅ Existe" : "❌ No existe") . "\n";
    echo "- user_category: " . ($hasUserCategory ? "✅ Existe" : "❌ No existe") . "\n\n";
    
    // Step 2: Add missing columns
    if (!$hasIsClient || !$hasIsFreelancer || !$hasUserCategory) {
        echo "🔧 PASO 2: Agregando columnas faltantes\n";
        echo "=======================================\n";
        
        if (!$hasIsClient) {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_client BOOLEAN DEFAULT FALSE COMMENT 'Can hire services'");
            echo "✅ Columna is_client agregada\n";
        }
        
        if (!$hasIsFreelancer) {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_freelancer BOOLEAN DEFAULT FALSE COMMENT 'Can offer services'");
            echo "✅ Columna is_freelancer agregada\n";
        }
        
        if (!$hasUserCategory) {
            $pdo->exec("ALTER TABLE users ADD COLUMN user_category ENUM('public', 'team') DEFAULT 'public' COMMENT 'User category'");
            echo "✅ Columna user_category agregada\n";
        }
        echo "\n";
    }
    
    // Step 3: Migrate existing data
    echo "📦 PASO 3: Migrando datos existentes\n";
    echo "====================================\n";
    
    // Update clients
    $stmt = $pdo->prepare("UPDATE users SET is_client = TRUE, user_category = 'public' WHERE user_type = 'client'");
    $stmt->execute();
    $clientsUpdated = $stmt->rowCount();
    echo "✅ Actualizados $clientsUpdated clientes\n";
    
    // Update freelancers
    $stmt = $pdo->prepare("UPDATE users SET is_freelancer = TRUE, user_category = 'public' WHERE user_type = 'freelancer'");
    $stmt->execute();
    $freelancersUpdated = $stmt->rowCount();
    echo "✅ Actualizados $freelancersUpdated freelancers\n";
    
    // Update admins
    $stmt = $pdo->prepare("UPDATE users SET is_client = FALSE, is_freelancer = FALSE, user_category = 'team' WHERE user_type = 'admin'");
    $stmt->execute();
    $adminsUpdated = $stmt->rowCount();
    echo "✅ Actualizados $adminsUpdated admins a equipo técnico\n\n";
    
    // Step 4: Check if team_members table exists
    echo "🏢 PASO 4: Verificando tabla team_members\n";
    echo "=========================================\n";
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'team_members'");
    $hasTeamMembersTable = $stmt->rowCount() > 0;
    echo "- team_members: " . ($hasTeamMembersTable ? "✅ Existe" : "❌ No existe") . "\n\n";
    
    if (!$hasTeamMembersTable) {
        echo "🔨 Creando tabla team_members...\n";
        $pdo->exec("
        CREATE TABLE team_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            employee_id VARCHAR(20) UNIQUE,
            department ENUM(
                'development', 'design', 'qa_testing', 'devops', 
                'marketing', 'sales', 'support', 'management', 
                'executive', 'operations', 'security', 'data_analytics'
            ) NOT NULL DEFAULT 'management',
            position VARCHAR(100) NOT NULL DEFAULT 'Administrator',
            role_level ENUM('junior', 'mid', 'senior', 'lead', 'manager', 'director', 'ceo') DEFAULT 'manager',
            access_level ENUM('basic', 'advanced', 'admin', 'super_admin') DEFAULT 'admin',
            permissions JSON,
            hire_date DATE DEFAULT (CURDATE()),
            employment_type ENUM('full_time', 'part_time', 'contractor', 'intern') DEFAULT 'full_time',
            work_location ENUM('remote', 'office', 'hybrid') DEFAULT 'remote',
            office_location VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            can_login BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_department (department),
            INDEX idx_role_level (role_level),
            INDEX idx_access_level (access_level)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "✅ Tabla team_members creada\n\n";
    }
    
    // Step 5: Migrate admin users to team_members
    echo "👨‍💼 PASO 5: Migrando admins a team_members\n";
    echo "===========================================\n";
    
    $stmt = $pdo->query("
        SELECT u.id FROM users u 
        LEFT JOIN team_members tm ON u.id = tm.user_id 
        WHERE u.user_category = 'team' AND tm.user_id IS NULL
    ");
    $unmigrated = $stmt->fetchAll();
    
    foreach ($unmigrated as $user) {
        $employeeId = 'EMP' . str_pad($user['id'], 4, '0', STR_PAD_LEFT);
        $permissions = json_encode([
            'user_management', 'project_management', 'financial_management',
            'system_administration', 'support_access', 'analytics_access'
        ]);
        
        $pdo->prepare("
            INSERT INTO team_members (
                user_id, employee_id, department, position, role_level, 
                access_level, permissions, hire_date
            ) VALUES (?, ?, 'management', 'Platform Administrator', 'manager', 'super_admin', ?, CURDATE())
        ")->execute([$user['id'], $employeeId, $permissions]);
    }
    
    echo "✅ Migrados " . count($unmigrated) . " usuarios admin a team_members\n\n";
    
    // Step 6: Create demo users
    echo "🎭 PASO 6: Creando usuarios demo\n";
    echo "================================\n";
    
    // Create demo public user
    try {
        $pdo->prepare("
            INSERT INTO users (
                email, password_hash, first_name, last_name, phone, country, city,
                user_category, is_client, is_freelancer, email_verified, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'public', TRUE, TRUE, TRUE, TRUE)
        ")->execute([
            'demo.user@laburar.com',
            '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
            'Juan', 'Pérez', '+54 11 1234-5678', 'Argentina', 'Buenos Aires'
        ]);
        
        // Get the demo user ID and create freelancer profile
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'demo.user@laburar.com'");
        $stmt->execute();
        $demoUserId = $stmt->fetchColumn();
        
        // Check if freelancer profile exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM freelancer_profiles WHERE user_id = ?");
        $stmt->execute([$demoUserId]);
        
        if ($stmt->fetchColumn() == 0) {
            $pdo->prepare("
                INSERT INTO freelancer_profiles (
                    user_id, title, professional_overview, skills, availability, created_at
                ) VALUES (?, ?, ?, ?, 'full_time', NOW())
            ")->execute([
                $demoUserId,
                'Desarrollador Full Stack',
                'Desarrollador experimentado con 5+ años en desarrollo web.',
                json_encode(['PHP', 'JavaScript', 'MySQL', 'Laravel', 'React'])
            ]);
        }
        
        echo "✅ Usuario demo creado: demo.user@laburar.com / password\n";
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            echo "ℹ️  Usuario demo ya existe\n";
        } else {
            echo "⚠️  Error creando usuario demo: " . $e->getMessage() . "\n";
        }
    }
    
    // Create CEO demo user
    try {
        $pdo->prepare("
            INSERT INTO users (
                email, password_hash, first_name, last_name, 
                user_category, is_client, is_freelancer, email_verified, is_active
            ) VALUES (?, ?, ?, ?, 'team', FALSE, FALSE, TRUE, TRUE)
        ")->execute([
            'ceo@laburar.com',
            '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
            'Ana', 'Rodriguez'
        ]);
        
        // Get CEO user ID and create team member record
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'ceo@laburar.com'");
        $stmt->execute();
        $ceoUserId = $stmt->fetchColumn();
        
        $employeeId = 'EMP' . str_pad($ceoUserId, 4, '0', STR_PAD_LEFT);
        $permissions = json_encode([
            'full_access', 'financial_management', 'strategic_decisions', 'user_management'
        ]);
        
        $pdo->prepare("
            INSERT INTO team_members (
                user_id, employee_id, department, position, role_level, 
                access_level, permissions, hire_date
            ) VALUES (?, ?, 'executive', 'Chief Executive Officer', 'ceo', 'super_admin', ?, CURDATE())
        ")->execute([$ceoUserId, $employeeId, $permissions]);
        
        echo "✅ Usuario CEO creado: ceo@laburar.com / password\n";
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            echo "ℹ️  Usuario CEO ya existe\n";
        } else {
            echo "⚠️  Error creando usuario CEO: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n";
    
    // Step 7: Show final statistics
    echo "📊 PASO 7: Estadísticas finales\n";
    echo "===============================\n";
    
    $stmt = $pdo->query("
        SELECT 
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE THEN 1 END) as clients,
            COUNT(CASE WHEN user_category = 'public' AND is_freelancer = TRUE THEN 1 END) as freelancers,
            COUNT(CASE WHEN user_category = 'public' AND is_client = TRUE AND is_freelancer = TRUE THEN 1 END) as dual_role,
            COUNT(CASE WHEN user_category = 'team' THEN 1 END) as team_members,
            COUNT(*) as total_users
        FROM users WHERE is_active = TRUE
    ");
    $stats = $stmt->fetch();
    
    echo "👥 USUARIOS ACTIVOS:\n";
    echo "- Clientes: {$stats['clients']}\n";
    echo "- Freelancers: {$stats['freelancers']}\n";
    echo "- Rol dual (cliente + freelancer): {$stats['dual_role']}\n";
    echo "- Equipo técnico: {$stats['team_members']}\n";
    echo "- Total: {$stats['total_users']}\n\n";
    
    // Show team members
    $stmt = $pdo->query("
        SELECT 
            u.first_name, u.last_name, u.email, 
            tm.position, tm.department, tm.access_level
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE u.user_category = 'team' AND tm.is_active = TRUE
        ORDER BY tm.role_level DESC, u.first_name
    ");
    $teamMembers = $stmt->fetchAll();
    
    echo "👨‍💻 EQUIPO TÉCNICO:\n";
    foreach ($teamMembers as $member) {
        echo "- {$member['first_name']} {$member['last_name']} ({$member['email']})\n";
        echo "  {$member['position']} - {$member['department']} - {$member['access_level']}\n\n";
    }
    
    // Show demo users
    $stmt = $pdo->query("
        SELECT u.*, fp.title as freelancer_title
        FROM users u
        LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.email IN ('demo.user@laburar.com', 'ceo@laburar.com')
        ORDER BY u.user_category
    ");
    $demoUsers = $stmt->fetchAll();
    
    echo "🎭 USUARIOS DEMO CREADOS:\n";
    foreach ($demoUsers as $user) {
        echo "- {$user['first_name']} {$user['last_name']} ({$user['email']})\n";
        echo "  Password: password\n";
        echo "  Categoría: {$user['user_category']}\n";
        if ($user['user_category'] === 'public') {
            echo "  Cliente: " . ($user['is_client'] ? 'Sí' : 'No') . "\n";
            echo "  Freelancer: " . ($user['is_freelancer'] ? 'Sí' : 'No') . "\n";
            if ($user['freelancer_title']) {
                echo "  Título: {$user['freelancer_title']}\n";
            }
        }
        echo "\n";
    }
    
    echo "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE\n";
    echo "===================================\n\n";
    
    echo "🔑 CREDENCIALES DE ACCESO:\n";
    echo "=========================\n";
    echo "ADMIN ORIGINAL:\n";
    echo "- Email: admin@laburar.com\n";
    echo "- Password: admin123\n";
    echo "- Tipo: Equipo técnico (Super Admin)\n\n";
    
    echo "USUARIO DEMO (Cliente + Freelancer):\n";
    echo "- Email: demo.user@laburar.com\n";
    echo "- Password: password\n";
    echo "- Tipo: Usuario público con rol dual\n\n";
    
    echo "CEO DEMO:\n";
    echo "- Email: ceo@laburar.com\n";
    echo "- Password: password\n";
    echo "- Tipo: Equipo técnico (CEO)\n\n";
    
    echo "✨ SISTEMA LISTO PARA USAR ✨\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    exit(1);
}
?>