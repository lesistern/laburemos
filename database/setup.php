<?php
/**
 * Database Setup Script
 * LaburAR Complete Platform - One-click database setup
 * Run: php database/setup.php
 */

echo "🚀 LaburAR Database Setup\n";
echo "=========================\n\n";

echo "This script will:\n";
echo "1. Create the database\n";
echo "2. Run all migrations\n";
echo "3. Seed demo data\n\n";

echo "⚠️  WARNING: This will reset your database if it exists!\n";
echo "Continue? (y/N): ";

$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim($line) !== 'y' && trim($line) !== 'Y') {
    echo "❌ Setup cancelled.\n";
    exit(0);
}

echo "\n🏗️  Starting database setup...\n\n";

try {
    // Step 1: Run migrations
    echo "📋 Step 1: Running migrations...\n";
    require_once __DIR__ . '/migrate.php';
    
    $runner = new MigrationRunner();
    $runner->migrate('reset'); // Reset and run all migrations
    
    echo "\n📋 Step 2: Seeding demo data...\n";
    require_once __DIR__ . '/seeders/DemoDataSeeder.php';
    
    // Database connection for seeder
    $pdo = new PDO(
        "mysql:host=localhost;dbname=laburar_platform;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    
    $seeder = new DemoDataSeeder($pdo);
    $seeder->run();
    
    echo "\n🎉 Database setup completed successfully!\n\n";
    
    echo "✅ Summary:\n";
    echo "- Database: laburar_platform created\n";
    echo "- Tables: 15+ tables with indexes and relationships\n";
    echo "- Demo users: 7 accounts (4 freelancers, 3 clients)\n";
    echo "- Skills: 50+ skills across multiple categories\n";
    echo "- Portfolio: Sample portfolio items\n";
    echo "- Categories: Service categories structure\n\n";
    
    echo "🔐 Demo Login Credentials:\n";
    echo "Freelancers:\n";
    echo "- maria.dev@gmail.com (Full Stack Developer)\n";
    echo "- carlos.designer@outlook.com (UX/UI Designer)\n";
    echo "- ana.marketing@yahoo.com (Marketing Specialist)\n";
    echo "- luciana.writer@gmail.com (Copywriter)\n\n";
    
    echo "Clients:\n";
    echo "- admin@techstartup.com.ar (Tech Startup)\n";
    echo "- proyectos@agenciadigital.com (Digital Agency)\n";
    echo "- rrhh@empresagrande.com.ar (Large Company)\n\n";
    
    echo "Password for all accounts: 123456\n\n";
    
    echo "🔧 Next Steps:\n";
    echo "1. Start XAMPP Apache server\n";
    echo "2. Navigate to http://localhost/Laburar\n";
    echo "3. Begin implementing TASK-AUTH-003 (PHP Models)\n\n";
    
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
    echo "Please check your XAMPP MySQL is running and try again.\n";
    exit(1);
}
?>