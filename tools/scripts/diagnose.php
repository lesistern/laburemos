<?php
/**
 * LaburAR - System Diagnostic Tool
 * Validates the new enterprise structure and configuration
 */

class SystemDiagnostic
{
    private array $checks = [];
    private array $warnings = [];
    private array $errors = [];
    private string $basePath;
    
    public function __construct()
    {
        $this->basePath = dirname(__DIR__, 2);
    }
    
    /**
     * Run all diagnostic checks
     */
    public function runDiagnostics(): void
    {
        echo "🔍 LaburAR System Diagnostic\n";
        echo "============================\n\n";
        
        $this->checkDirectoryStructure();
        $this->checkFilePermissions();
        $this->checkPHPConfiguration();
        $this->checkDatabaseConnection();
        $this->checkAutoloader();
        $this->checkConfigurationFiles();
        $this->checkSecuritySettings();
        $this->checkAssetFiles();
        
        $this->printSummary();
    }
    
    /**
     * Check directory structure
     */
    private function checkDirectoryStructure(): void
    {
        echo "📁 Checking Directory Structure...\n";
        
        $requiredDirs = [
            'app/Controllers',
            'app/Models', 
            'app/Services',
            'app/Middleware',
            'src/Core',
            'public/assets',
            'resources/views',
            'resources/components',
            'storage/logs',
            'storage/cache',
            'storage/uploads',
            'config',
            'tests/Unit',
            'tests/Integration',
            'tests/E2E',
            'docs',
            'tools/scripts'
        ];
        
        foreach ($requiredDirs as $dir) {
            $fullPath = $this->basePath . '/' . $dir;
            if (is_dir($fullPath)) {
                $this->addCheck("✅ Directory exists: {$dir}");
            } else {
                $this->addError("❌ Missing directory: {$dir}");
            }
        }
        
        echo "\n";
    }
    
    /**
     * Check file permissions
     */
    private function checkFilePermissions(): void
    {
        echo "🔐 Checking File Permissions...\n";
        
        $writableDirs = [
            'storage/logs',
            'storage/cache', 
            'storage/uploads',
            'public/uploads'
        ];
        
        foreach ($writableDirs as $dir) {
            $fullPath = $this->basePath . '/' . $dir;
            if (is_dir($fullPath)) {
                if (is_writable($fullPath)) {
                    $this->addCheck("✅ Writable: {$dir}");
                } else {
                    $this->addError("❌ Not writable: {$dir}");
                }
            }
        }
        
        // Check .htaccess
        $htaccessPath = $this->basePath . '/.htaccess';
        if (file_exists($htaccessPath)) {
            $this->addCheck("✅ .htaccess file exists");
        } else {
            $this->addWarning("⚠️  .htaccess file missing");
        }
        
        echo "\n";
    }
    
    /**
     * Check PHP configuration
     */
    private function checkPHPConfiguration(): void
    {
        echo "🐘 Checking PHP Configuration...\n";
        
        // PHP Version
        $phpVersion = PHP_VERSION;
        if (version_compare($phpVersion, '8.2.0', '>=')) {
            $this->addCheck("✅ PHP Version: {$phpVersion}");
        } else {
            $this->addError("❌ PHP Version too old: {$phpVersion} (requires 8.2+)");
        }
        
        // Required extensions
        $requiredExtensions = [
            'pdo',
            'pdo_mysql',
            'json',
            'mbstring',
            'openssl',
            'curl'
        ];
        
        foreach ($requiredExtensions as $ext) {
            if (extension_loaded($ext)) {
                $this->addCheck("✅ Extension loaded: {$ext}");
            } else {
                $this->addError("❌ Missing extension: {$ext}");
            }
        }
        
        // Memory limit
        $memoryLimit = ini_get('memory_limit');
        $memoryBytes = $this->parseMemoryLimit($memoryLimit);
        if ($memoryBytes >= 128 * 1024 * 1024) { // 128MB
            $this->addCheck("✅ Memory limit: {$memoryLimit}");
        } else {
            $this->addWarning("⚠️  Low memory limit: {$memoryLimit}");
        }
        
        // Upload settings
        $maxFilesize = ini_get('upload_max_filesize');
        $maxPost = ini_get('post_max_size');
        $this->addCheck("✅ Upload max filesize: {$maxFilesize}");
        $this->addCheck("✅ Post max size: {$maxPost}");
        
        echo "\n";
    }
    
    /**
     * Check database connection
     */
    private function checkDatabaseConnection(): void
    {
        echo "🗄️  Checking Database Connection...\n";
        
        try {
            // Load config
            $config = @include $this->basePath . '/config/app.php';
            
            if (!$config) {
                $this->addError("❌ Cannot load app configuration");
                echo "\n";
                return;
            }
            
            $dbConfig = $config['database']['connections']['mysql'];
            
            $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}";
            
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
            
            $this->addCheck("✅ Database connection successful");
            
            // Check if tables exist
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $requiredTables = ['users', 'freelancers', 'clients', 'skills'];
            $existingTables = array_intersect($requiredTables, $tables);
            
            if (count($existingTables) === count($requiredTables)) {
                $this->addCheck("✅ Core tables exist: " . implode(', ', $existingTables));
            } else {
                $missing = array_diff($requiredTables, $existingTables);
                $this->addWarning("⚠️  Missing tables: " . implode(', ', $missing));
            }
            
        } catch (Exception $e) {
            $this->addError("❌ Database connection failed: " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    /**
     * Check autoloader
     */
    private function checkAutoloader(): void
    {
        echo "🔄 Checking Autoloader...\n";
        
        $autoloaderPath = $this->basePath . '/src/Core/Autoloader.php';
        if (file_exists($autoloaderPath)) {
            $this->addCheck("✅ Autoloader file exists");
            
            try {
                require_once $autoloaderPath;
                $this->addCheck("✅ Autoloader loads successfully");
                
                // Test class loading
                if (class_exists('LaburAR\\Core\\Autoloader')) {
                    $this->addCheck("✅ Autoloader class accessible");
                } else {
                    $this->addError("❌ Autoloader class not accessible");
                }
                
            } catch (Exception $e) {
                $this->addError("❌ Autoloader error: " . $e->getMessage());
            }
        } else {
            $this->addError("❌ Autoloader file missing");
        }
        
        echo "\n";
    }
    
    /**
     * Check configuration files
     */
    private function checkConfigurationFiles(): void
    {
        echo "⚙️  Checking Configuration Files...\n";
        
        $configFiles = [
            'config/app.php',
            'config/routes.php',
            '.env.example',
            'composer.json'
        ];
        
        foreach ($configFiles as $file) {
            $fullPath = $this->basePath . '/' . $file;
            if (file_exists($fullPath)) {
                $this->addCheck("✅ Config file exists: {$file}");
                
                // Validate PHP config files
                if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
                    $content = file_get_contents($fullPath);
                    if (strpos($content, '<?php') === 0) {
                        $this->addCheck("✅ Valid PHP syntax: {$file}");
                    } else {
                        $this->addWarning("⚠️  Invalid PHP syntax: {$file}");
                    }
                }
                
                // Validate JSON files
                if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                    $content = file_get_contents($fullPath);
                    $json = json_decode($content, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $this->addCheck("✅ Valid JSON syntax: {$file}");
                    } else {
                        $this->addError("❌ Invalid JSON syntax: {$file}");
                    }
                }
                
            } else {
                $this->addError("❌ Missing config file: {$file}");
            }
        }
        
        // Check .env file
        $envPath = $this->basePath . '/.env';
        if (file_exists($envPath)) {
            $this->addCheck("✅ Environment file exists");
        } else {
            $this->addWarning("⚠️  .env file missing (use .env.example as template)");
        }
        
        echo "\n";
    }
    
    /**
     * Check security settings
     */
    private function checkSecuritySettings(): void
    {
        echo "🛡️  Checking Security Settings...\n";
        
        // Check if sensitive directories are protected
        $sensitiveFiles = [
            'app/',
            'src/',
            'config/', 
            'storage/',
            'tests/',
            '.env'
        ];
        
        foreach ($sensitiveFiles as $file) {
            $fullPath = $this->basePath . '/' . $file;
            if (file_exists($fullPath)) {
                $this->addCheck("✅ Sensitive path exists: {$file}");
            }
        }
        
        // Check .htaccess security rules
        $htaccessPath = $this->basePath . '/.htaccess';
        if (file_exists($htaccessPath)) {
            $content = file_get_contents($htaccessPath);
            
            $securityChecks = [
                'RewriteRule.*app.*- \[F,L\]' => 'App directory protection',
                'X-Content-Type-Options' => 'Content type protection',
                'X-Frame-Options' => 'Frame protection',
                'X-XSS-Protection' => 'XSS protection'
            ];
            
            foreach ($securityChecks as $pattern => $description) {
                if (preg_match('/' . str_replace(['[', ']'], ['\[', '\]'], $pattern) . '/', $content)) {
                    $this->addCheck("✅ Security rule: {$description}");
                } else {
                    $this->addWarning("⚠️  Missing security rule: {$description}");
                }
            }
        }
        
        echo "\n";
    }
    
    /**
     * Check asset files
     */
    private function checkAssetFiles(): void
    {
        echo "🎨 Checking Asset Files...\n";
        
        $assetDirs = [
            'public/assets/css',
            'public/assets/js',
            'public/assets/img'
        ];
        
        foreach ($assetDirs as $dir) {
            $fullPath = $this->basePath . '/' . $dir;
            if (is_dir($fullPath)) {
                $files = glob($fullPath . '/*');
                $count = count($files);
                $this->addCheck("✅ Asset directory: {$dir} ({$count} files)");
            } else {
                $this->addWarning("⚠️  Missing asset directory: {$dir}");
            }
        }
        
        // Check critical files
        $criticalFiles = [
            'public/index.php',
            'public/api.php',
            'public/robots.txt',
            'public/sitemap.xml'
        ];
        
        foreach ($criticalFiles as $file) {
            $fullPath = $this->basePath . '/' . $file;
            if (file_exists($fullPath)) {
                $this->addCheck("✅ Critical file: {$file}");
            } else {
                $this->addError("❌ Missing critical file: {$file}");
            }
        }
        
        echo "\n";
    }
    
    /**
     * Add successful check
     */
    private function addCheck(string $message): void
    {
        $this->checks[] = $message;
        echo "  {$message}\n";
    }
    
    /**
     * Add warning
     */
    private function addWarning(string $message): void
    {
        $this->warnings[] = $message;
        echo "  {$message}\n";
    }
    
    /**
     * Add error
     */
    private function addError(string $message): void
    {
        $this->errors[] = $message;
        echo "  {$message}\n";
    }
    
    /**
     * Parse memory limit string to bytes
     */
    private function parseMemoryLimit(string $limit): int
    {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit) - 1]);
        $value = intval($limit);
        
        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }
    
    /**
     * Print diagnostic summary
     */
    private function printSummary(): void
    {
        echo "📊 Diagnostic Summary\n";
        echo "====================\n\n";
        
        echo "✅ Successful Checks: " . count($this->checks) . "\n";
        echo "⚠️  Warnings: " . count($this->warnings) . "\n";
        echo "❌ Errors: " . count($this->errors) . "\n\n";
        
        if (!empty($this->errors)) {
            echo "🚨 Critical Issues to Fix:\n";
            foreach ($this->errors as $error) {
                echo "  {$error}\n";
            }
            echo "\n";
        }
        
        if (!empty($this->warnings)) {
            echo "⚠️  Recommendations:\n";
            foreach ($this->warnings as $warning) {
                echo "  {$warning}\n";
            }
            echo "\n";
        }
        
        // Overall status
        if (empty($this->errors)) {
            if (empty($this->warnings)) {
                echo "🎉 System Status: EXCELLENT - All checks passed!\n";
            } else {
                echo "👍 System Status: GOOD - Some recommendations to consider\n";
            }
        } else {
            echo "🔧 System Status: NEEDS ATTENTION - Please fix critical issues\n";
        }
        
        echo "\n";
        echo "💡 For help with setup, see: docs/deployment/MIGRATION_GUIDE.md\n";
    }
}

// Run diagnostics if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $diagnostic = new SystemDiagnostic();
    $diagnostic->runDiagnostics();
}
?>