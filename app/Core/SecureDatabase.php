<?php
/**
 * Secure Database Class
 * Enhanced security wrapper for database operations
 * Prevents SQL injection, sanitizes inputs, and logs security events
 */

namespace LaburAR\Core;

use PDO;
use PDOException;

class SecureDatabase {
    private static $instance = null;
    private $pdo;
    private $config;
    private $allowedTables = [];
    private $logFile;
    
    private function __construct() {
        $this->config = require __DIR__ . '/../../config/database.php';
        $this->logFile = __DIR__ . '/../../logs/security.log';
        $this->initializeAllowedTables();
        $this->connect();
    }
    
    /**
     * Initialize allowed tables whitelist
     */
    private function initializeAllowedTables() {
        $this->allowedTables = [
            'users', 'freelancer_profiles', 'company_profiles', 'categories',
            'services', 'projects', 'project_applications', 'messages',
            'transactions', 'reviews', 'wallets', 'notifications',
            'support_tickets', 'user_badges', 'badges', 'badge_assignments'
        ];
    }
    
    /**
     * Get secure database instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Connect to database with security options
     */
    private function connect() {
        $config = $this->config['connections']['mysql'];
        
        try {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
            
            // Enhanced security options
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => false // Prevent multiple statements
            ];
            
            $this->pdo = new PDO($dsn, $config['username'], $config['password'], $options);
            
        } catch (PDOException $e) {
            $this->logSecurityEvent('DATABASE_CONNECTION_FAILED', ['error' => $this->sanitizeForLog($e->getMessage())]);
            
            if (php_sapi_name() === 'cli') {
                echo "Database connection failed. Please check your configuration.\n";
            } else {
                die("Database connection error. Please try again later.");
            }
        }
    }
    
    /**
     * Secure query execution with parameter validation
     */
    public function secureQuery($sql, $params = [], $allowedTables = null) {
        // Validate SQL against injection patterns
        if (!$this->validateSQL($sql)) {
            $this->logSecurityEvent('SQL_INJECTION_ATTEMPT', ['sql' => $this->sanitizeForLog($sql)]);
            throw new \InvalidArgumentException("Invalid SQL detected");
        }
        
        // Validate table names if provided
        if ($allowedTables && !$this->validateTables($sql, $allowedTables)) {
            $this->logSecurityEvent('UNAUTHORIZED_TABLE_ACCESS', ['sql' => $this->sanitizeForLog($sql)]);
            throw new \InvalidArgumentException("Unauthorized table access");
        }
        
        // Validate parameters
        $params = $this->sanitizeParameters($params);
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $this->logSecurityEvent('QUERY_SUCCESS', [
                'query_type' => $this->getQueryType($sql),
                'params_count' => count($params)
            ]);
            
            return $stmt;
        } catch (PDOException $e) {
            $this->logSecurityEvent('QUERY_ERROR', [
                'error' => $this->sanitizeForLog($e->getMessage()),
                'sql' => $this->sanitizeForLog($sql)
            ]);
            throw $e;
        }
    }
    
    /**
     * Validate SQL for injection patterns
     */
    private function validateSQL($sql) {
        // Remove legitimate quoted strings and comments
        $cleanSQL = preg_replace([
            "/'([^'\\\\]|\\\\.)*'/", // Single quoted strings
            '/"([^"\\\\]|\\\\.)*"/', // Double quoted strings
            '/--.*$/m',              // Single line comments
            '/\/\*.*?\*\//s'         // Multi line comments
        ], '', $sql);
        
        // Check for dangerous patterns
        $dangerousPatterns = [
            '/\b(union|and|or)\s+.*\b(select|insert|update|delete|drop|create|alter|exec|execute)\b/i',
            '/\b(select|insert|update|delete|drop|create|alter)\s+.*\bfrom\s+information_schema\b/i',
            '/\b(benchmark|sleep|waitfor|pg_sleep)\s*\(/i',
            '/\b(load_file|into\s+outfile|into\s+dumpfile)\b/i',
            '/\b(sp_|xp_|cmdshell)\w*/i',
            '/[;\'"]\s*(union|select|insert|update|delete|drop)/i'
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $cleanSQL)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validate table names against whitelist
     */
    private function validateTables($sql, $allowedTables = null) {
        $tables = $allowedTables ?: $this->allowedTables;
        
        // Extract table names from SQL
        preg_match_all('/\b(?:from|join|into|update)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i', $sql, $matches);
        
        foreach ($matches[1] as $table) {
            if (!in_array(strtolower($table), array_map('strtolower', $tables))) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Sanitize parameters to prevent injection
     */
    private function sanitizeParameters($params) {
        $sanitized = [];
        
        foreach ($params as $key => $value) {
            if (is_string($value)) {
                // Remove null bytes and control characters
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
                // Limit length to prevent buffer overflow
                $value = substr($value, 0, 10000);
            }
            
            $sanitized[$key] = $value;
        }
        
        return $sanitized;
    }
    
    /**
     * Get query type for logging
     */
    private function getQueryType($sql) {
        if (preg_match('/^\s*(select|insert|update|delete|create|drop|alter)/i', $sql, $matches)) {
            return strtoupper($matches[1]);
        }
        return 'UNKNOWN';
    }
    
    /**
     * Sanitize data for logging (remove sensitive info)
     */
    private function sanitizeForLog($data) {
        if (is_string($data)) {
            // Remove potential passwords, tokens, and sensitive data
            $data = preg_replace([
                '/password[^,\s}]*[\'"][^\'",}]*[\'"]?/i',
                '/token[^,\s}]*[\'"][^\'",}]*[\'"]?/i',
                '/api[_-]?key[^,\s}]*[\'"][^\'",}]*[\'"]?/i',
                '/secret[^,\s}]*[\'"][^\'",}]*[\'"]?/i'
            ], '[REDACTED]', $data);
            
            // Limit length
            return substr($data, 0, 500);
        }
        
        return $data;
    }
    
    /**
     * Log security events
     */
    private function logSecurityEvent($event, $data = []) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'CLI',
            'user_agent' => $this->sanitizeForLog($_SERVER['HTTP_USER_AGENT'] ?? 'CLI'),
            'data' => $data
        ];
        
        $logLine = json_encode($logEntry) . "\n";
        
        // Ensure logs directory exists
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($this->logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Safe user lookup by ID
     */
    public function getUserById($id) {
        $sql = "SELECT id, email, first_name, last_name, user_type, created_at FROM users WHERE id = ? AND is_active = 1 LIMIT 1";
        $stmt = $this->secureQuery($sql, [$id], ['users']);
        $user = $stmt->fetch();
        
        if ($user) {
            // Map user_type to role for compatibility
            $user['role'] = $user['user_type'];
        }
        
        return $user;
    }
    
    /**
     * Safe user authentication
     */
    public function authenticateUser($email, $password) {
        $sql = "SELECT id, email, first_name, last_name, password_hash, user_type FROM users WHERE email = ? AND is_active = 1 LIMIT 1";
        $stmt = $this->secureQuery($sql, [$email], ['users']);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // Update last login time
            $this->secureQuery("UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']], ['users']);
            
            $this->logSecurityEvent('LOGIN_SUCCESS', ['user_id' => $user['id'], 'email' => $email]);
            
            // Return user data in expected format
            return [
                'id' => $user['id'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'role' => $user['user_type'] // Map user_type to role for compatibility
            ];
        }
        
        $this->logSecurityEvent('LOGIN_FAILED', ['email' => $email]);
        return false;
    }
    
    /**
     * Get PDO instance (restricted access)
     */
    public function getPDO() {
        return $this->pdo;
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->pdo->rollBack();
    }
    
    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }
}