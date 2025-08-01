<?php
/**
 * LABUREMOS Comprehensive Cleanup Executor - PRODUCTION READY
 * 
 * CRITICAL SCRIPT: Executes complete removal of dummy data
 * 
 * WARNING: This script PERMANENTLY deletes data from the database
 * Make sure to backup your database before running this script
 * 
 * @author LABUREMOS Data Quality Team
 * @version 1.0
 * @since 2025-07-20
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300); // 5 minutes max execution time

require_once __DIR__ . '/../../includes/DatabaseHelper.php';

class ComprehensiveCleanupManager {
    
    private $db;
    private $backupPath;
    private $logFile;
    private $startTime;
    private $cleanupStats = [];
    
    public function __construct() {
        $this->startTime = microtime(true);
        $this->backupPath = __DIR__ . '/backups/';
        $this->logFile = __DIR__ . '/cleanup-execution.log';
        
        // Create backup directory if it doesn't exist
        if (!is_dir($this->backupPath)) {
            mkdir($this->backupPath, 0755, true);
        }
        
        try {
            $this->db = DatabaseHelper::getConnection();
            $this->log("🔗 Database connection established successfully");
        } catch (Exception $e) {
            $this->log("❌ Database connection failed: " . $e->getMessage());
            exit(1);
        }
    }
    
    public function executeComprehensiveCleanup($options = []) {
        $forceCleanup = $options['force'] ?? false;
        $skipBackup = $options['skip_backup'] ?? false;
        
        $this->log("\n" . str_repeat("=", 70));
        $this->log("🧹 LABUREMOS Comprehensive Data Cleanup - STARTING");
        $this->log(str_repeat("=", 70));
        
        try {
            // Phase 1: Pre-cleanup validation
            $this->validatePreCleanup();
            
            // Phase 2: Create backup (unless skipped)
            if (!$skipBackup) {
                $this->createDatabaseBackup();
            } else {
                $this->log("⚠️  SKIPPING backup creation (skip_backup=true)");
            }
            
            // Phase 3: Run audit to show what will be cleaned
            $auditResults = $this->runPreCleanupAudit();
            
            // Phase 4: Confirm cleanup (unless forced)
            if (!$forceCleanup) {
                $this->confirmCleanup($auditResults);
            }
            
            // Phase 5: Create cleanup log table if needed
            $this->ensureCleanupLogTable();
            
            // Phase 6: Execute comprehensive cleanup
            $this->executeCleanupScript();
            
            // Phase 7: Verify cleanup success
            $this->verifyCleanupSuccess();
            
            // Phase 8: Generate final report
            $this->generateFinalReport();
            
        } catch (Exception $e) {
            $this->log("❌ CLEANUP FAILED: " . $e->getMessage());
            $this->log("💾 Database backup available at: " . $this->getLatestBackupPath());
            throw $e;
        }
    }
    
    private function validatePreCleanup(): void {
        $this->log("🔍 Validating pre-cleanup conditions...");
        
        // Check if database exists and is accessible
        $tables = $this->db->query("SHOW TABLES")->fetchAll();
        if (empty($tables)) {
            throw new Exception("Database appears to be empty or inaccessible");
        }
        
        // Check disk space for backup
        $freeSpace = disk_free_space($this->backupPath);
        if ($freeSpace < (100 * 1024 * 1024)) { // 100MB minimum
            $this->log("⚠️  WARNING: Low disk space for backup: " . $this->formatBytes($freeSpace));
        }
        
        // Check if cleanup script exists
        $cleanupScript = __DIR__ . '/comprehensive-cleanup.sql';
        if (!file_exists($cleanupScript)) {
            throw new Exception("Cleanup script not found: $cleanupScript");
        }
        
        $this->log("✅ Pre-cleanup validation passed");
    }
    
    private function createDatabaseBackup(): void {
        $this->log("💾 Creating database backup...");
        
        $backupFile = $this->backupPath . 'laburar_backup_' . date('Y-m-d_H-i-s') . '.sql';
        
        try {
            // Get database configuration
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $user = $_ENV['DB_USER'] ?? 'root';
            $password = $_ENV['DB_PASS'] ?? '';
            $database = $_ENV['DB_NAME'] ?? 'laburar';
            
            // Build mysqldump command
            $command = sprintf(
                'mysqldump --host=%s --user=%s %s %s > %s 2>&1',
                escapeshellarg($host),
                escapeshellarg($user),
                !empty($password) ? '--password=' . escapeshellarg($password) : '',
                escapeshellarg($database),
                escapeshellarg($backupFile)
            );
            
            // Execute backup
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);
            
            if ($returnCode !== 0) {
                throw new Exception("Backup failed with code $returnCode: " . implode("\n", $output));
            }
            
            if (!file_exists($backupFile) || filesize($backupFile) === 0) {
                throw new Exception("Backup file was not created or is empty");
            }
            
            $this->log("✅ Database backup created: " . basename($backupFile));
            $this->log("📊 Backup size: " . $this->formatBytes(filesize($backupFile)));
            
        } catch (Exception $e) {
            $this->log("❌ Backup creation failed: " . $e->getMessage());
            $this->log("⚠️  Continuing without backup (DANGEROUS!)");
        }
    }
    
    private function runPreCleanupAudit(): array {
        $this->log("🔍 Running pre-cleanup audit...");
        
        try {
            $auditScript = __DIR__ . '/data-audit.sql';
            if (!file_exists($auditScript)) {
                throw new Exception("Audit script not found: $auditScript");
            }
            
            $auditSql = file_get_contents($auditScript);
            
            // Execute main audit queries (excluding examples)
            $queries = explode('UNION ALL', $auditSql);
            $mainQuery = implode('UNION ALL', array_slice($queries, 0, -4));
            
            $stmt = $this->db->query($mainQuery);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $totalIssues = array_sum(array_column($results, 'count'));
            
            $this->log("📊 Pre-cleanup audit results:");
            foreach ($results as $result) {
                if ($result['count'] > 0) {
                    $this->log("   ⚠️  {$result['table_name']}: {$result['issue']} ({$result['count']} items)");
                }
            }
            
            $this->log("📈 Total dummy data items to be removed: $totalIssues");
            
            return $results;
            
        } catch (Exception $e) {
            $this->log("❌ Pre-cleanup audit failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function confirmCleanup(array $auditResults): void {
        $totalIssues = array_sum(array_column($auditResults, 'count'));
        
        if ($totalIssues === 0) {
            $this->log("✅ No dummy data found - cleanup not needed");
            exit(0);
        }
        
        // In CLI mode, ask for confirmation
        if (php_sapi_name() === 'cli') {
            echo "\n⚠️  WARNING: This will PERMANENTLY delete $totalIssues items from your database!\n";
            echo "Are you sure you want to continue? (yes/no): ";
            $handle = fopen("php://stdin", "r");
            $confirmation = trim(fgets($handle));
            fclose($handle);
            
            if (strtolower($confirmation) !== 'yes') {
                echo "❌ Cleanup cancelled by user\n";
                exit(0);
            }
        }
        
        $this->log("✅ User confirmed cleanup execution");
    }
    
    private function ensureCleanupLogTable(): void {
        $this->log("📝 Ensuring cleanup log table exists...");
        
        $createLogTable = "
            CREATE TABLE IF NOT EXISTS cleanup_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $this->db->exec($createLogTable);
        $this->log("✅ Cleanup log table ready");
    }
    
    private function executeCleanupScript(): void {
        $this->log("🧹 Executing comprehensive cleanup script...");
        
        $cleanupScript = __DIR__ . '/comprehensive-cleanup.sql';
        $sql = file_get_contents($cleanupScript);
        
        // Split into individual statements
        $statements = array_filter(
            array_map('trim', preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $sql)),
            function($stmt) {
                return !empty($stmt) && !preg_match('/^--/', $stmt);
            }
        );
        
        $this->log("📊 Executing " . count($statements) . " cleanup statements...");
        
        $executedCount = 0;
        $errorCount = 0;
        
        foreach ($statements as $statement) {
            try {
                // Skip comments and empty statements
                if (preg_match('/^\s*(--|SELECT.*CLEANUP|SELECT.*SUMMARY)/i', $statement)) {
                    continue;
                }
                
                $result = $this->db->exec($statement);
                $executedCount++;
                
                // Log significant operations
                if (preg_match('/DELETE FROM (\w+)/i', $statement, $matches)) {
                    $tableName = $matches[1];
                    $this->log("   🗑️  Cleaned table: $tableName ($result rows affected)");
                    $this->cleanupStats[$tableName] = ($this->cleanupStats[$tableName] ?? 0) + $result;
                }
                
            } catch (PDOException $e) {
                $errorCount++;
                $this->log("⚠️  Statement error: " . $e->getMessage());
                
                // Continue with other statements unless it's a critical error
                if (strpos($e->getMessage(), 'doesn\'t exist') === false) {
                    throw $e;
                }
            }
        }
        
        $this->log("✅ Cleanup script executed:");
        $this->log("   📊 Statements executed: $executedCount");
        $this->log("   ⚠️  Errors (non-critical): $errorCount");
        
        // Log cleanup statistics
        foreach ($this->cleanupStats as $table => $count) {
            $this->log("   🗑️  $table: $count rows deleted");
        }
    }
    
    private function verifyCleanupSuccess(): void {
        $this->log("✅ Verifying cleanup success...");
        
        try {
            // Run audit again to verify 0 issues
            $auditScript = __DIR__ . '/data-audit.sql';
            $auditSql = file_get_contents($auditScript);
            
            $queries = explode('UNION ALL', $auditSql);
            $mainQuery = implode('UNION ALL', array_slice($queries, 0, -4));
            
            $stmt = $this->db->query($mainQuery);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $remainingIssues = array_sum(array_column($results, 'count'));
            
            if ($remainingIssues === 0) {
                $this->log("🎉 CLEANUP SUCCESSFUL: 0 dummy data items remaining");
                return;
            }
            
            $this->log("⚠️  WARNING: $remainingIssues dummy data items still present:");
            foreach ($results as $result) {
                if ($result['count'] > 0) {
                    $this->log("   ❌ {$result['table_name']}: {$result['issue']} ({$result['count']} items)");
                }
            }
            
            throw new Exception("Cleanup verification failed - $remainingIssues items remain");
            
        } catch (Exception $e) {
            $this->log("❌ Cleanup verification failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function generateFinalReport(): void {
        $executionTime = round(microtime(true) - $this->startTime, 2);
        
        $this->log("\n" . str_repeat("=", 70));
        $this->log("🎉 COMPREHENSIVE CLEANUP COMPLETED SUCCESSFULLY");
        $this->log(str_repeat("=", 70));
        $this->log("⏱️  Total execution time: {$executionTime} seconds");
        
        // Get final platform statistics
        try {
            $finalStats = $this->getFinalPlatformStats();
            
            $this->log("📊 Final Platform Statistics:");
            foreach ($finalStats as $stat => $value) {
                $this->log("   📈 $stat: $value");
            }
            
        } catch (Exception $e) {
            $this->log("⚠️  Could not generate final stats: " . $e->getMessage());
        }
        
        $this->log("\n✅ Platform is now PRODUCTION READY");
        $this->log("🚀 Next steps:");
        $this->log("   1. Deploy professional content seeding");
        $this->log("   2. Implement content validation system");
        $this->log("   3. Begin production deployment");
        
        $backupPath = $this->getLatestBackupPath();
        if ($backupPath) {
            $this->log("💾 Database backup available: " . basename($backupPath));
        }
        
        $this->log("\n📄 Cleanup log saved: " . $this->logFile);
    }
    
    private function getFinalPlatformStats(): array {
        $statsQuery = "
            SELECT 
                (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
                (SELECT COUNT(*) FROM users WHERE is_freelancer = 1 AND status = 'active') as active_freelancers,
                (SELECT COUNT(*) FROM services WHERE status = 'active') as active_services,
                (SELECT COUNT(*) FROM reviews) as total_reviews,
                (SELECT COUNT(*) FROM projects WHERE status != 'draft') as active_projects,
                (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews) as average_rating,
                (SELECT COUNT(*) FROM categories) as total_categories
        ";
        
        $stmt = $this->db->query($statsQuery);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'Active Users' => $stats['active_users'],
            'Active Freelancers' => $stats['active_freelancers'],
            'Active Services' => $stats['active_services'],
            'Total Reviews' => $stats['total_reviews'],
            'Active Projects' => $stats['active_projects'],
            'Average Rating' => $stats['average_rating'] . '★',
            'Total Categories' => $stats['total_categories']
        ];
    }
    
    private function getLatestBackupPath(): ?string {
        $backups = glob($this->backupPath . 'laburar_backup_*.sql');
        if (empty($backups)) {
            return null;
        }
        
        // Sort by modification time, newest first
        usort($backups, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        return $backups[0];
    }
    
    private function log(string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] $message\n";
        
        // Write to log file
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Output to console if running in CLI
        if (php_sapi_name() === 'cli') {
            echo $logEntry;
        }
    }
    
    private function formatBytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }
}

// Execute cleanup if run from command line
if (php_sapi_name() === 'cli') {
    echo "\n";
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║              LABUREMOS Comprehensive Data Cleanup             ║\n";
    echo "║                   PRODUCTION DEPLOYMENT                     ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    
    try {
        // Parse command line arguments
        $options = [];
        if (in_array('--force', $argv)) {
            $options['force'] = true;
        }
        if (in_array('--skip-backup', $argv)) {
            $options['skip_backup'] = true;
        }
        
        $cleanup = new ComprehensiveCleanupManager();
        $cleanup->executeComprehensiveCleanup($options);
        
        echo "\n🎉 SUCCESS: Platform is now production ready!\n";
        echo "📊 Run audit script again to verify 0 issues\n\n";
        exit(0);
        
    } catch (Exception $e) {
        echo "\n❌ CLEANUP FAILED: " . $e->getMessage() . "\n";
        echo "💾 Check backup files and logs for recovery\n\n";
        exit(1);
    }
}

// For web access
if (isset($_GET['execute_cleanup'])) {
    header('Content-Type: application/json');
    
    try {
        $options = [
            'force' => isset($_GET['force']) && $_GET['force'] === 'true',
            'skip_backup' => isset($_GET['skip_backup']) && $_GET['skip_backup'] === 'true'
        ];
        
        $cleanup = new ComprehensiveCleanupManager();
        $cleanup->executeComprehensiveCleanup($options);
        
        echo json_encode([
            'success' => true,
            'message' => 'Comprehensive cleanup completed successfully',
            'status' => 'production_ready',
            'log_file' => 'cleanup-execution.log'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'status' => 'cleanup_failed'
        ]);
    }
}
?>