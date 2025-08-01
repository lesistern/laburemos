<?php
/**
 * Database Setup Script for LABUREMOS
 * This script creates the database and all necessary tables
 * Run this from command line or browser to set up the database
 */

// Database configuration
$config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '', // Default XAMPP password is empty
    'charset' => 'utf8mb4'
];

echo "====================================\n";
echo "LABUREMOS Database Setup Script\n";
echo "====================================\n\n";

try {
    // Connect to MySQL without selecting a database
    $dsn = "mysql:host={$config['host']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to MySQL server\n";
    
    // Read SQL file
    $sqlFile = __DIR__ . '/create_laburemos_db.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    echo "✓ SQL file loaded\n";
    
    // Split SQL file into individual queries
    $queries = array_filter(array_map('trim', explode(';', $sql)));
    
    // Track progress
    $totalQueries = count($queries);
    $executedQueries = 0;
    $errors = [];
    
    echo "\nExecuting $totalQueries queries...\n\n";
    
    // Execute each query
    foreach ($queries as $query) {
        if (empty($query)) continue;
        
        try {
            // Add semicolon back
            $query = $query . ';';
            
            // Special handling for DELIMITER commands
            if (stripos($query, 'DELIMITER') === 0) {
                continue; // Skip DELIMITER commands as PDO doesn't support them
            }
            
            // Execute query
            $pdo->exec($query);
            $executedQueries++;
            
            // Show progress for important operations
            if (stripos($query, 'CREATE DATABASE') !== false) {
                echo "✓ Database created: laburemos_db\n";
            } elseif (stripos($query, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $query, $matches);
                if (isset($matches[1])) {
                    echo "✓ Table created: {$matches[1]}\n";
                }
            } elseif (stripos($query, 'INSERT INTO categories') !== false) {
                echo "✓ Default categories inserted\n";
            } elseif (stripos($query, 'INSERT INTO users') !== false) {
                echo "✓ Admin user created\n";
            } elseif (stripos($query, 'CREATE PROCEDURE') !== false) {
                echo "✓ Stored procedure created\n";
            } elseif (stripos($query, 'CREATE TRIGGER') !== false) {
                echo "✓ Trigger created\n";
            }
            
        } catch (PDOException $e) {
            $errors[] = [
                'query' => substr($query, 0, 100) . '...',
                'error' => $e->getMessage()
            ];
        }
    }
    
    echo "\n====================================\n";
    echo "Setup Complete!\n";
    echo "====================================\n\n";
    
    echo "✓ Executed: $executedQueries/$totalQueries queries\n";
    
    if (!empty($errors)) {
        echo "\n⚠ Errors encountered:\n";
        foreach ($errors as $error) {
            echo "- Query: {$error['query']}\n";
            echo "  Error: {$error['error']}\n\n";
        }
    }
    
    // Verify database exists
    $result = $pdo->query("SHOW DATABASES LIKE 'laburemos_db'")->fetch();
    if ($result) {
        echo "\n✓ Database 'laburemos_db' verified successfully!\n";
        
        // Show table count
        $pdo->exec("USE laburemos_db");
        $tableCount = $pdo->query("SHOW TABLES")->rowCount();
        echo "✓ Total tables created: $tableCount\n";
    }
    
    echo "\n====================================\n";
    echo "Next Steps:\n";
    echo "====================================\n";
    echo "1. Database is ready to use\n";
    echo "2. Default admin credentials:\n";
    echo "   Email: admin@laburar.com\n";
    echo "   Password: admin123\n";
    echo "3. Update database credentials in your config files\n";
    echo "\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n\n";
    echo "Please check:\n";
    echo "1. XAMPP MySQL service is running\n";
    echo "2. MySQL root password is correct\n";
    echo "3. You have necessary privileges\n";
    exit(1);
}

// Create a simple HTML output if running from browser
if (php_sapi_name() !== 'cli') {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>LABUREMOS Database Setup</title>
        <style>
            body {
                font-family: monospace;
                background: #1a1a1a;
                color: #0f0;
                padding: 20px;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
    <script>
        // Auto-scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
    </script>
    </body>
    </html>
    <?php
}
?>