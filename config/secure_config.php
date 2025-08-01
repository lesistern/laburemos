<?php
/**
 * Secure Configuration Loader
 * Loads environment variables safely with validation
 */

class SecureConfig {
    private static $instance = null;
    private $config = [];
    private $envLoaded = false;
    
    private function __construct() {
        $this->loadEnvironment();
        $this->validateConfig();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Load environment variables from .env file
     */
    private function loadEnvironment() {
        $envFile = __DIR__ . '/../.env';
        
        if (!file_exists($envFile)) {
            // Use defaults for development
            $this->setDefaults();
            return;
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue; // Skip comments
            
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $value = trim($parts[1], '"\'');
                $this->config[$key] = $value;
                
                // Set as environment variable if not already set
                if (!getenv($key)) {
                    putenv("$key=$value");
                }
            }
        }
        
        $this->envLoaded = true;
    }
    
    /**
     * Set secure defaults for development
     */
    private function setDefaults() {
        $this->config = [
            'APP_NAME' => 'LaburAR',
            'APP_ENV' => 'development',
            'APP_DEBUG' => 'true',
            'APP_URL' => 'http://localhost',
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => 'localhost',
            'DB_PORT' => '3306',
            'DB_DATABASE' => 'laburar_db',
            'DB_USERNAME' => 'root',
            'DB_PASSWORD' => '',
            'CORS_ALLOWED_ORIGINS' => 'http://localhost,http://127.0.0.1',
            'JWT_SECRET' => bin2hex(random_bytes(32)),
            'CSRF_TOKEN_NAME' => '_token',
            'ENCRYPTION_KEY' => bin2hex(random_bytes(16)),
            'RATE_LIMIT_LOGIN' => '5',
            'RATE_LIMIT_API' => '100',
            'RATE_LIMIT_WINDOW' => '60',
            'SESSION_LIFETIME' => '120',
            'SESSION_SECURE' => 'false', // false for HTTP in development
            'SESSION_HTTP_ONLY' => 'true',
            'SESSION_SAME_SITE' => 'lax',
            'LOG_LEVEL' => 'debug',
            'UPLOAD_MAX_SIZE' => '10485760',
            'UPLOAD_ALLOWED_TYPES' => 'jpg,jpeg,png,gif,pdf,doc,docx'
        ];
    }
    
    /**
     * Validate critical configuration values
     */
    private function validateConfig() {
        $required = [
            'DB_HOST', 'DB_DATABASE', 'DB_USERNAME',
            'JWT_SECRET', 'ENCRYPTION_KEY'
        ];
        
        foreach ($required as $key) {
            if (empty($this->config[$key])) {
                throw new Exception("Required configuration key '$key' is missing or empty");
            }
        }
        
        // Validate JWT secret length (minimum 256 bits = 32 bytes = 64 hex chars)
        if (strlen($this->config['JWT_SECRET']) < 32) {
            throw new Exception("JWT_SECRET must be at least 32 characters long");
        }
        
        // Validate encryption key length
        if (strlen($this->config['ENCRYPTION_KEY']) < 16) {
            throw new Exception("ENCRYPTION_KEY must be at least 16 characters long");
        }
        
        // Validate CORS origins format
        if (!empty($this->config['CORS_ALLOWED_ORIGINS'])) {
            $origins = explode(',', $this->config['CORS_ALLOWED_ORIGINS']);
            foreach ($origins as $origin) {
                $origin = trim($origin);
                if (!filter_var($origin, FILTER_VALIDATE_URL) && $origin !== '*') {
                    throw new Exception("Invalid CORS origin: $origin");
                }
            }
        }
    }
    
    /**
     * Get configuration value
     */
    public function get($key, $default = null) {
        return $this->config[$key] ?? $default;
    }
    
    /**
     * Get boolean configuration value
     */
    public function getBool($key, $default = false) {
        $value = $this->get($key, $default);
        if (is_bool($value)) return $value;
        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on']);
        }
        return (bool) $value;
    }
    
    /**
     * Get integer configuration value
     */
    public function getInt($key, $default = 0) {
        return (int) $this->get($key, $default);
    }
    
    /**
     * Get array configuration value (comma-separated)
     */
    public function getArray($key, $default = []) {
        $value = $this->get($key);
        if (empty($value)) return $default;
        
        return array_map('trim', explode(',', $value));
    }
    
    /**
     * Check if running in production
     */
    public function isProduction() {
        return $this->get('APP_ENV') === 'production';
    }
    
    /**
     * Check if debug mode is enabled
     */
    public function isDebug() {
        return $this->getBool('APP_DEBUG', false);
    }
    
    /**
     * Get database configuration array
     */
    public function getDatabaseConfig() {
        return [
            'default' => $this->get('DB_CONNECTION', 'mysql'),
            'connections' => [
                'mysql' => [
                    'driver' => 'mysql',
                    'host' => $this->get('DB_HOST'),
                    'port' => $this->get('DB_PORT', '3306'),
                    'database' => $this->get('DB_DATABASE'),
                    'username' => $this->get('DB_USERNAME'),
                    'password' => $this->get('DB_PASSWORD'),
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => 'InnoDB',
                    'options' => [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_STRINGIFY_FETCHES => false,
                        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                        PDO::MYSQL_ATTR_MULTI_STATEMENTS => false
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Get CORS allowed origins
     */
    public function getCorsOrigins() {
        $origins = $this->getArray('CORS_ALLOWED_ORIGINS', ['*']);
        
        // In production, never allow wildcard
        if ($this->isProduction() && in_array('*', $origins)) {
            throw new Exception("Wildcard CORS origin not allowed in production");
        }
        
        return $origins;
    }
    
    /**
     * Generate secure random key
     */
    public static function generateKey($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}