<?php
/**
 * Badge Migration Runner
 * Executes the badge system SQL migration
 */

// Database configuration
$config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '', // Default XAMPP password is empty
    'database' => 'laburemos_db',
    'charset' => 'utf8mb4'
];

echo "====================================\n";
echo "Badge System Migration\n";
echo "====================================\n\n";

try {
    // Connect to MySQL
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to MySQL server\n";
    
    // Read SQL file
    $sqlFile = __DIR__ . '/migrations/005_create_badge_system.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    echo "✓ SQL file loaded\n";
    
    // Remove the USE database statement since we're already connected
    $sql = preg_replace('/USE\s+laburemos_db;\s*/', '', $sql);
    
    // Split by DELIMITER statements to handle stored procedures correctly
    $parts = preg_split('/DELIMITER\s+[^\s;]+\s*/', $sql);
    $executedQueries = 0;
    $errors = [];
    
    echo "\nExecuting badge system migration...\n\n";
    
    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part)) continue;
        
        // Split individual queries by semicolon, but handle stored procedures
        if (strpos($part, 'CREATE PROCEDURE') !== false || strpos($part, 'CREATE TRIGGER') !== false) {
            // For procedures and triggers, execute as single block
            try {
                $pdo->exec($part);
                $executedQueries++;
                echo "✓ Stored procedure/trigger created\n";
            } catch (PDOException $e) {
                $errors[] = "Procedure/Trigger Error: " . $e->getMessage();
                echo "❌ Error creating procedure/trigger: " . $e->getMessage() . "\n";
            }
        } else {
            // Split by semicolon for regular queries
            $queries = array_filter(array_map('trim', explode(';', $part)));
            
            foreach ($queries as $query) {
                if (empty($query) || $query === 'DELIMITER') continue;
                
                try {
                    $pdo->exec($query);
                    $executedQueries++;
                    
                    // Check what was created
                    if (stripos($query, 'CREATE TABLE') !== false) {
                        preg_match('/CREATE TABLE.*?(\w+)\s*\(/i', $query, $matches);
                        $tableName = $matches[1] ?? 'unknown';
                        echo "✓ Table created: {$tableName}\n";
                    } elseif (stripos($query, 'INSERT INTO') !== false) {
                        preg_match('/INSERT INTO\s+(\w+)/i', $query, $matches);
                        $tableName = $matches[1] ?? 'unknown';
                        echo "✓ Data inserted into: {$tableName}\n";
                    } elseif (stripos($query, 'CREATE VIEW') !== false) {
                        preg_match('/CREATE VIEW\s+(\w+)/i', $query, $matches);
                        $viewName = $matches[1] ?? 'unknown';
                        echo "✓ View created: {$viewName}\n";
                    }
                    
                } catch (PDOException $e) {
                    $errors[] = "SQL Error: " . $e->getMessage() . " in query: " . substr($query, 0, 100) . "...";
                    echo "❌ Error: " . $e->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "\n====================================\n";
    echo "Migration Complete!\n";
    echo "====================================\n\n";
    
    echo "✓ Executed: {$executedQueries} queries\n";
    
    if (!empty($errors)) {
        echo "\n⚠ Errors encountered:\n";
        foreach ($errors as $error) {
            echo "- {$error}\n";
        }
    }
    
    // Verify badge system tables
    echo "\nVerifying badge system tables...\n";
    
    $tables = ['badge_categories', 'badges', 'user_badges', 'badge_milestones'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM {$table}");
            $count = $stmt->fetchColumn();
            echo "✓ {$table}: {$count} records\n";
        } catch (PDOException $e) {
            echo "❌ {$table}: Error - " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✅ Badge system is ready to use!\n";
    
} catch (Exception $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>