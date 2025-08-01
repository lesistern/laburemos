<?php
/**
 * Database Migration Runner
 * LABUREMOS Complete Platform
 * Run: php database/migrate.php [up|down|reset|status]
 */

class MigrationRunner
{
    private $pdo;
    private $migrationsPath;
    private $migrations = [];
    
    public function __construct()
    {
        $this->migrationsPath = __DIR__ . '/migrations/';
        $this->loadMigrations();
        $this->connectDatabase();
        $this->createMigrationsTable();
    }
    
    private function loadMigrations()
    {
        $files = glob($this->migrationsPath . '*.php');
        sort($files);
        
        foreach ($files as $file) {
            $filename = basename($file, '.php');
            require_once $file;
            
            // Extract migration number and class name
            preg_match('/^(\d+)_(.+)$/', $filename, $matches);
            $number = $matches[1];
            $name = $matches[2];
            
            // Convert filename to class name
            $className = 'Migration_' . $number . '_' . str_replace(' ', '', ucwords(str_replace('_', ' ', $name)));
            
            $this->migrations[] = [
                'number' => $number,
                'name' => $name,
                'filename' => $filename,
                'class' => $className,
                'file' => $file
            ];
        }
    }
    
    private function connectDatabase()
    {
        $config = [
            'host' => 'localhost',
            'dbname' => 'laburar_platform',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ];
        
        try {
            $dsn = "mysql:host={$config['host']};charset={$config['charset']}";
            $this->pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            
            // Create database if it doesn't exist
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS {$config['dbname']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $this->pdo->exec("USE {$config['dbname']}");
            
        } catch (PDOException $e) {
            die("❌ Database connection failed: " . $e->getMessage() . "\n");
        }
    }
    
    private function createMigrationsTable()
    {
        $sql = "
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            batch INT NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_migration (migration)
        ) ENGINE=InnoDB";
        
        $this->pdo->exec($sql);
    }
    
    public function migrate($direction = 'up')
    {
        switch ($direction) {
            case 'up':
                $this->migrateUp();
                break;
            case 'down':
                $this->migrateDown();
                break;
            case 'reset':
                $this->reset();
                break;
            case 'status':
                $this->status();
                break;
            default:
                echo "❌ Invalid direction. Use: up, down, reset, or status\n";
        }
    }
    
    private function migrateUp()
    {
        echo "🚀 Running migrations...\n\n";
        
        $executedMigrations = $this->getExecutedMigrations();
        $batch = $this->getNextBatch();
        $executed = 0;
        
        foreach ($this->migrations as $migration) {
            if (!in_array($migration['filename'], $executedMigrations)) {
                echo "⏳ Running migration: {$migration['filename']}\n";
                
                try {
                    $migrationInstance = new $migration['class']($this->pdo);
                    $migrationInstance->up();
                    
                    // Record migration
                    $stmt = $this->pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
                    $stmt->execute([$migration['filename'], $batch]);
                    
                    echo "✅ Migration completed: {$migration['filename']}\n\n";
                    $executed++;
                    
                } catch (Exception $e) {
                    echo "❌ Migration failed: {$migration['filename']}\n";
                    echo "Error: " . $e->getMessage() . "\n\n";
                    return;
                }
            } else {
                echo "⏭️  Migration already executed: {$migration['filename']}\n";
            }
        }
        
        if ($executed > 0) {
            echo "🎉 Successfully executed $executed migrations!\n";
        } else {
            echo "ℹ️  No new migrations to execute.\n";
        }
    }
    
    private function migrateDown()
    {
        echo "⬇️  Rolling back migrations...\n\n";
        
        $lastBatch = $this->getLastBatch();
        if (!$lastBatch) {
            echo "ℹ️  No migrations to rollback.\n";
            return;
        }
        
        $migrationsToRollback = $this->getMigrationsByBatch($lastBatch);
        
        // Rollback in reverse order
        $migrationsToRollback = array_reverse($migrationsToRollback);
        
        foreach ($migrationsToRollback as $migrationName) {
            $migration = $this->findMigration($migrationName);
            if ($migration) {
                echo "⏳ Rolling back: {$migration['filename']}\n";
                
                try {
                    $migrationInstance = new $migration['class']($this->pdo);
                    $migrationInstance->down();
                    
                    // Remove migration record
                    $stmt = $this->pdo->prepare("DELETE FROM migrations WHERE migration = ?");
                    $stmt->execute([$migration['filename']]);
                    
                    echo "✅ Rollback completed: {$migration['filename']}\n\n";
                    
                } catch (Exception $e) {
                    echo "❌ Rollback failed: {$migration['filename']}\n";
                    echo "Error: " . $e->getMessage() . "\n\n";
                    return;
                }
            }
        }
        
        echo "🎉 Successfully rolled back batch $lastBatch!\n";
    }
    
    private function reset()
    {
        echo "🔄 Resetting all migrations...\n\n";
        
        $executedMigrations = $this->getExecutedMigrations();
        $migrationsToRollback = array_reverse($executedMigrations);
        
        foreach ($migrationsToRollback as $migrationName) {
            $migration = $this->findMigration($migrationName);
            if ($migration) {
                echo "⏳ Rolling back: {$migration['filename']}\n";
                
                try {
                    $migrationInstance = new $migration['class']($this->pdo);
                    $migrationInstance->down();
                    echo "✅ Rollback completed: {$migration['filename']}\n";
                    
                } catch (Exception $e) {
                    echo "❌ Rollback failed: {$migration['filename']}\n";
                    echo "Error: " . $e->getMessage() . "\n";
                }
            }
        }
        
        // Clear migrations table
        $this->pdo->exec("DELETE FROM migrations");
        echo "\n🎉 Database reset completed!\n";
        
        // Run migrations again
        echo "\n🚀 Re-running all migrations...\n\n";
        $this->migrateUp();
    }
    
    private function status()
    {
        echo "📊 Migration Status:\n";
        echo "==================\n\n";
        
        $executedMigrations = $this->getExecutedMigrations();
        
        foreach ($this->migrations as $migration) {
            $status = in_array($migration['filename'], $executedMigrations) ? '✅ Executed' : '⏸️  Pending';
            echo sprintf("%-50s %s\n", $migration['filename'], $status);
        }
        
        echo "\n📈 Summary:\n";
        echo "- Total migrations: " . count($this->migrations) . "\n";
        echo "- Executed: " . count($executedMigrations) . "\n";
        echo "- Pending: " . (count($this->migrations) - count($executedMigrations)) . "\n";
    }
    
    private function getExecutedMigrations()
    {
        $stmt = $this->pdo->query("SELECT migration FROM migrations ORDER BY id");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    private function getNextBatch()
    {
        $stmt = $this->pdo->query("SELECT MAX(batch) as max_batch FROM migrations");
        $result = $stmt->fetch();
        return ($result['max_batch'] ?? 0) + 1;
    }
    
    private function getLastBatch()
    {
        $stmt = $this->pdo->query("SELECT MAX(batch) as max_batch FROM migrations");
        $result = $stmt->fetch();
        return $result['max_batch'] ?? null;
    }
    
    private function getMigrationsByBatch($batch)
    {
        $stmt = $this->pdo->prepare("SELECT migration FROM migrations WHERE batch = ? ORDER BY id");
        $stmt->execute([$batch]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    private function findMigration($name)
    {
        foreach ($this->migrations as $migration) {
            if ($migration['filename'] === $name) {
                return $migration;
            }
        }
        return null;
    }
}

// CLI Interface
if (php_sapi_name() === 'cli') {
    $command = $argv[1] ?? 'up';
    
    echo "🏗️  LABUREMOS Database Migration Tool\n";
    echo "===================================\n\n";
    
    try {
        $runner = new MigrationRunner();
        $runner->migrate($command);
        
    } catch (Exception $e) {
        echo "❌ Migration runner failed: " . $e->getMessage() . "\n";
        exit(1);
    }
    
} else {
    echo "❌ This script must be run from command line.\n";
    echo "Usage: php database/migrate.php [up|down|reset|status]\n";
}
?>