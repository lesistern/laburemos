<?php
/**
 * SECURITY FIXES - IMMEDIATE IMPLEMENTATION
 * LaburAR Platform - Critical Security Patches
 * 
 * This file contains immediate security fixes that should be implemented
 * as soon as possible to address critical vulnerabilities found in the audit.
 * 
 * Date: July 25, 2025
 * Priority: CRITICAL
 */

// =============================================================================
// 1. CORS CONFIGURATION FIX
// =============================================================================

/**
 * Secure CORS Configuration
 * Replace all instances of 'Access-Control-Allow-Origin: *' with this function
 */
function setSecureCORS() {
    $allowedOrigins = [
        'https://laburar.com',
        'https://www.laburar.com',
        'http://localhost:3000', // For development only
        'http://localhost:8000'  // For development only
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400'); // 24 hours
}

// =============================================================================
// 2. SECURE LOGGING IMPLEMENTATION
// =============================================================================

/**
 * Sanitize data before logging to prevent sensitive information exposure
 */
function sanitizeForLog($data, $context = '') {
    if (is_string($data)) {
        $data = ['message' => $data];
    }
    
    if (!is_array($data)) {
        return $data;
    }
    
    $sensitive = [
        'password', 'password_confirmation', 
        'token', 'access_token', 'refresh_token',
        'secret', 'private_key', 'api_key',
        'jwt_secret', 'session_id',
        'credit_card', 'cvv', 'pin'
    ];
    
    $sanitized = $data;
    
    foreach ($sensitive as $field) {
        if (isset($sanitized[$field])) {
            $sanitized[$field] = '[REDACTED]';
        }
        
        // Check nested arrays
        if (is_array($sanitized)) {
            array_walk_recursive($sanitized, function(&$value, $key) use ($sensitive) {
                if (in_array(strtolower($key), $sensitive)) {
                    $value = '[REDACTED]';
                }
            });
        }
    }
    
    return $sanitized;
}

/**
 * Secure error logging wrapper
 */
function secureLog($level, $message, $context = []) {
    $sanitizedContext = sanitizeForLog($context);
    
    $logEntry = [
        'timestamp' => gmdate('c'),
        'level' => $level,
        'message' => $message,
        'context' => $sanitizedContext,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200),
        'request_id' => uniqid('req_', true)
    ];
    
    error_log('[SECURITY] ' . json_encode($logEntry, JSON_UNESCAPED_UNICODE));
}

// =============================================================================
// 3. IMPROVED CSP HEADERS
// =============================================================================

/**
 * Enhanced Content Security Policy with nonce support
 */
function setEnhancedCSP() {
    $nonce = base64_encode(random_bytes(16));
    
    // Store nonce in session for template use
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['csp_nonce'] = $nonce;
    
    $csp = [
        "default-src 'self'",
        "script-src 'self' https://cdn.jsdelivr.net https://sdk.mercadopago.com 'nonce-{$nonce}'",
        "style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net 'nonce-{$nonce}'",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.mercadopago.com",
        "media-src 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ];
    
    header('Content-Security-Policy: ' . implode('; ', $csp));
    header('X-Content-Security-Policy: ' . implode('; ', $csp)); // IE support
    header('X-WebKit-CSP: ' . implode('; ', $csp)); // WebKit support
}

// =============================================================================
// 4. SECURE ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Environment-based configuration loader
 */
class SecureConfig {
    private static $config = null;
    
    public static function load() {
        if (self::$config !== null) {
            return self::$config;
        }
        
        $envFile = __DIR__ . '/.env';
        if (!file_exists($envFile)) {
            throw new Exception('Environment file not found. Copy .env.example to .env');
        }
        
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $config = [];
        
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue; // Skip comments
            
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value, '"\'');
            
            $config[$key] = $value;
            
            // Set as environment variable if not already set
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
        
        return self::$config = $config;
    }
    
    public static function get($key, $default = null) {
        $config = self::load();
        return $config[$key] ?? getenv($key) ?: $default;
    }
}

// =============================================================================
// 5. ENHANCED JWT SECURITY
// =============================================================================

/**
 * Secure JWT token management with shorter TTL and rotation
 */
class SecureJWT {
    const ACCESS_TOKEN_TTL = 900;  // 15 minutes (reduced from 1 hour)
    const REFRESH_TOKEN_TTL = 86400 * 7; // 7 days (reduced from 30 days)
    
    public static function createSecureTokens($user) {
        $secret = SecureConfig::get('JWT_SECRET');
        if (!$secret || strlen($secret) < 32) {
            throw new Exception('JWT_SECRET must be at least 32 characters');
        }
        
        $now = time();
        $sessionId = 'sess_' . bin2hex(random_bytes(16)) . '_' . $now;
        
        // Access token (short-lived)
        $accessPayload = [
            'iss' => SecureConfig::get('APP_URL', 'laburar.com'),
            'aud' => SecureConfig::get('APP_URL', 'laburar.com'),
            'iat' => $now,
            'exp' => $now + self::ACCESS_TOKEN_TTL,
            'nbf' => $now,
            'user_id' => $user['id'],
            'session_id' => $sessionId,
            'user_type' => $user['user_type'],
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'jti' => bin2hex(random_bytes(16)) // Unique token ID
        ];
        
        // Refresh token (longer-lived)
        $refreshPayload = [
            'iss' => SecureConfig::get('APP_URL', 'laburar.com'),
            'aud' => SecureConfig::get('APP_URL', 'laburar.com'),
            'iat' => $now,
            'exp' => $now + self::REFRESH_TOKEN_TTL,
            'nbf' => $now,
            'user_id' => $user['id'],
            'session_id' => $sessionId,
            'type' => 'refresh',
            'jti' => bin2hex(random_bytes(16))
        ];
        
        // Use Firebase JWT library
        $accessToken = \Firebase\JWT\JWT::encode($accessPayload, $secret, 'HS256');
        $refreshToken = \Firebase\JWT\JWT::encode($refreshPayload, $secret, 'HS256');
        
        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => self::ACCESS_TOKEN_TTL,
            'token_type' => 'Bearer',
            'session_id' => $sessionId
        ];
    }
}

// =============================================================================
// 6. DATABASE CONNECTION SECURITY
// =============================================================================

/**
 * Secure database connection with proper credentials
 */
class SecureDatabase {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $host = SecureConfig::get('DB_HOST', 'localhost');
        $port = SecureConfig::get('DB_PORT', '3306');
        $dbname = SecureConfig::get('DB_DATABASE', 'laburar_db');
        $username = SecureConfig::get('DB_USERNAME', 'root');
        $password = SecureConfig::get('DB_PASSWORD', '');
        
        // Validate that we're not using default credentials in production
        if (SecureConfig::get('APP_ENV') === 'production') {
            if (empty($password) || $password === 'password' || $username === 'root') {
                throw new Exception('Cannot use default database credentials in production');
            }
        }
        
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_PERSISTENT => false,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'"
        ];
        
        try {
            $this->pdo = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            secureLog('error', 'Database connection failed', ['error' => $e->getMessage()]);
            throw new Exception('Database connection failed');
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->pdo;
    }
}

// =============================================================================
// 7. UPDATED API ENDPOINT TEMPLATE
// =============================================================================

/**
 * Secure API endpoint template with all fixes applied
 * Use this as template for all API endpoints
 */
function secureAPIEndpoint($callback) {
    // Set secure headers
    setSecureCORS();
    setEnhancedCSP();
    
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // HSTS for HTTPS
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
    
    try {
        // Load secure configuration
        SecureConfig::load();
        
        // Rate limiting check
        $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!checkRateLimit($clientIP)) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Rate limit exceeded',
                'retry_after' => 60
            ]);
            exit;
        }
        
        // Execute callback
        $result = $callback();
        
        // Ensure response is properly formatted
        if (!isset($result['success'])) {
            $result = ['success' => true, 'data' => $result];
        }
        
        echo json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        secureLog('error', 'API endpoint error', [
            'endpoint' => $_SERVER['REQUEST_URI'] ?? '',
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'error' => $e->getMessage()
        ]);
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error',
            'request_id' => uniqid('req_', true)
        ]);
    }
    
    exit;
}

// =============================================================================
// 8. RATE LIMITING IMPLEMENTATION
// =============================================================================

/**
 * Simple rate limiting using file-based storage
 * For production, use Redis or database
 */
function checkRateLimit($identifier, $maxRequests = 60, $windowMinutes = 1) {
    $rateLimitFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier);
    $window = $windowMinutes * 60; // Convert to seconds
    $now = time();
    
    if (file_exists($rateLimitFile)) {
        $data = json_decode(file_get_contents($rateLimitFile), true);
        
        // Clean old entries
        $data = array_filter($data, function($timestamp) use ($now, $window) {
            return ($now - $timestamp) < $window;
        });
        
        if (count($data) >= $maxRequests) {
            return false;
        }
        
        $data[] = $now;
    } else {
        $data = [$now];
    }
    
    file_put_contents($rateLimitFile, json_encode($data), LOCK_EX);
    return true;
}

// =============================================================================
// IMPLEMENTATION INSTRUCTIONS
// =============================================================================

/*
TO IMPLEMENT THESE FIXES:

1. Update all API endpoints to use secureAPIEndpoint() wrapper
2. Replace all CORS headers with setSecureCORS()
3. Replace all error_log() calls with secureLog()
4. Create .env file with proper credentials
5. Update database connections to use SecureDatabase
6. Implement CSP nonces in templates: <script nonce="<?= $_SESSION['csp_nonce'] ?>">
7. Update JWT token creation to use SecureJWT::createSecureTokens()

EXAMPLE USAGE:

// In your API endpoints:
secureAPIEndpoint(function() {
    // Your API logic here
    return ['message' => 'Success'];
});

// For logging:
secureLog('info', 'User logged in', ['user_id' => $userId]);

// For database:
$db = SecureDatabase::getInstance();
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);

TESTING:
1. Verify CORS only allows whitelisted domains
2. Check logs don't contain sensitive data
3. Confirm CSP blocks inline scripts
4. Test rate limiting functionality
5. Validate JWT tokens have shorter TTL

*/