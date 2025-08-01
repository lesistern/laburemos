<?php
/**
 * Setup MFA Tables Script
 * Run this file to create MFA tables in the database
 */

echo "=== LaburAR MFA Tables Setup ===\n\n";

try {
    // Include database configuration
    require_once __DIR__ . '/config/database.php';
    
    $config = require __DIR__ . '/config/database.php';
    $dbConfig = $config['connections']['mysql'];
    
    // Create PDO connection
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    
    echo "✅ Connected to database: {$dbConfig['database']}\n\n";
    
    // Read and execute MFA migration
    $migrationFile = __DIR__ . '/database/migrations/007_create_mfa_tables.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^\s*--/', $stmt);
        }
    );
    
    echo "📝 Executing " . count($statements) . " SQL statements...\n\n";
    
    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            $pdo->exec($statement);
            
            // Extract table/procedure name for better output
            if (preg_match('/CREATE TABLE.*?(\w+)\s*\(/i', $statement, $matches)) {
                echo "✅ Created table: {$matches[1]}\n";
            } elseif (preg_match('/CREATE PROCEDURE.*?(\w+)\s*\(/i', $statement, $matches)) {
                echo "✅ Created procedure: {$matches[1]}\n";
            } elseif (preg_match('/CREATE EVENT.*?(\w+)\s/i', $statement, $matches)) {
                echo "✅ Created event: {$matches[1]}\n";
            } elseif (preg_match('/CREATE VIEW.*?(\w+)\s/i', $statement, $matches)) {
                echo "✅ Created view: {$matches[1]}\n";
            } elseif (preg_match('/ALTER TABLE.*?(\w+)\s/i', $statement, $matches)) {
                echo "✅ Modified table: {$matches[1]}\n";
            } else {
                echo "✅ Executed statement " . ($index + 1) . "\n";
            }
            
        } catch (PDOException $e) {
            // Ignore "already exists" errors for idempotent execution
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate column') === false) {
                echo "⚠️  Warning on statement " . ($index + 1) . ": " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n=== Verification ===\n";
    
    // Verify tables were created
    $tables = ['mfa_codes', 'mfa_verifications'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists\n";
            
            // Show table structure
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "   Columns: " . implode(', ', $columns) . "\n";
        } else {
            echo "❌ Table '$table' not found\n";
        }
    }
    
    // Check if MFA columns were added to users table
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'mfa_%'");
    $mfaColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($mfaColumns) > 0) {
        echo "✅ MFA columns added to users table: " . implode(', ', $mfaColumns) . "\n";
    } else {
        echo "⚠️  No MFA columns found in users table\n";
    }
    
    // Show MFA enabled users count
    $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(mfa_enabled) as mfa_enabled FROM users");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\n=== Statistics ===\n";
    echo "📊 Total users: {$stats['total']}\n";
    echo "🔐 MFA enabled users: {$stats['mfa_enabled']}\n";
    
    echo "\n🎉 MFA Tables Setup Complete! 🎉\n";
    echo "\nNext steps:\n";
    echo "1. Test MFA functionality with admin user\n";
    echo "2. Update login forms to include MFA check\n";
    echo "3. Add MFA settings to user dashboard\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}