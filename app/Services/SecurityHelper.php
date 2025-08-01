<?php
/**
 * SecurityHelper - Sistema de Seguridad Enterprise
 * 
 * Proporciona funciones de seguridad avanzadas incluyendo:
 * - Validación y sanitización de inputs
 * - Protección CSRF
 * - Rate limiting
 * - Prevención de ataques
 * - Logging de seguridad
 * - JWT y autenticación
 * - 2FA/TOTP
 * 
 * @version 3.0.0
 * @package LaburAR\Security
 */

require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PragmaRX\Google2FA\Google2FA;

class SecurityHelper {
    
    private static $instance = null;
    private static $configCache = null;
    private $config;
    private $db;
    private $redis;
    private $jwtSecret;
    private $google2fa;
    private $validationCache = [];
    private $performanceMetrics = [];
    
    // Security constants
    const CSRF_TOKEN_LENGTH = 32;
    const CSRF_TOKEN_EXPIRY = 3600; // 1 hour
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 900; // 15 minutes
    const PASSWORD_MIN_LENGTH = 8;
    const PASSWORD_MAX_LENGTH = 128;
    
    // JWT Configuration
    const JWT_ALGORITHM = 'HS256';
    const ACCESS_TOKEN_EXPIRE = 3600; // 1 hour
    const REFRESH_TOKEN_EXPIRE = 86400 * 30; // 30 days
    
    // Redis prefixes
    const SESSION_PREFIX = 'laburar:session:';
    const REFRESH_PREFIX = 'laburar:refresh:';
    const BLACKLIST_PREFIX = 'laburar:blacklist:';
    
    // Rate limiting constants
    const RATE_LIMIT_WINDOW = 3600; // 1 hour
    const DEFAULT_RATE_LIMIT = 100; // requests per hour
    
    // Security levels
    const SECURITY_LOW = 1;
    const SECURITY_MEDIUM = 2;
    const SECURITY_HIGH = 3;
    const SECURITY_CRITICAL = 4;
    
    private function __construct() {
        $startTime = microtime(true);
        
        // Use cached config for better performance
        $this->config = self::$configCache ?? (self::$configCache = $this->getSecurityConfig());
        $this->db = \Database::getInstance();
        $this->initializeRedis();
        
        // Strengthen JWT secret generation
        $this->jwtSecret = $this->initializeJWTSecret();
        $this->google2fa = new Google2FA();
        $this->initializeSecurity();
        
        $this->performanceMetrics['initialization_time'] = microtime(true) - $startTime;
    }
    
    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Prevent cloning of the singleton instance
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization of the singleton instance
     */
    public function __wakeup() {
        throw new \Exception("Cannot unserialize a singleton.");
    }
    
    /**
     * Initialize JWT secret with enhanced security
     */
    private function initializeJWTSecret(): string {
        // Priority order: ENV variable, secure file, generated
        if (!empty($_ENV['JWT_SECRET']) && strlen($_ENV['JWT_SECRET']) >= 32) {
            return $_ENV['JWT_SECRET'];
        }
        
        $secretFile = __DIR__ . '/../.jwt_secret';
        if (file_exists($secretFile) && is_readable($secretFile)) {
            $secret = trim(file_get_contents($secretFile));
            if (strlen($secret) >= 32) {
                return $secret;
            }
        }
        
        // Generate new secure secret
        $secret = base64_encode(random_bytes(64));
        
        // Try to save it securely
        if (is_writable(dirname($secretFile))) {
            file_put_contents($secretFile, $secret, LOCK_EX);
            chmod($secretFile, 0600); // Owner read/write only
        }
        
        return $secret;
    }
    
    /**
     * Enhanced security configuration with caching
     */
    private function getSecurityConfig(): array {
        return [
            'csrf_protection' => true,
            'rate_limiting' => true,
            'sql_injection_protection' => true,
            'xss_protection' => true,
            'session_security' => true,
            'password_policy_strict' => true,
            'failed_login_tracking' => true,
            'suspicious_activity_detection' => true,
            'log_security_events' => true,
            'encrypt_sensitive_data' => true,
            'secure_headers' => true,
            'ip_whitelist_enabled' => false,
            'two_factor_required' => false,
            'session_timeout' => 3600, // 1 hour
            'max_file_upload_size' => 10485760, // 10MB
            'allowed_file_types' => ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
            'blocked_user_agents' => ['bot', 'crawler', 'spider'],
            'honeypot_enabled' => true
        ];
    }
    
    /**
     * Initialize Redis with enhanced error handling and connection pooling
     */
    private function initializeRedis(): void {
        try {
            $this->redis = new \Redis();
            
            // Configure connection options for better performance
            $this->redis->connect(
                $_ENV['REDIS_HOST'] ?? '127.0.0.1',
                (int)($_ENV['REDIS_PORT'] ?? 6379),
                2.0, // 2 second timeout
                null,
                100, // retry interval in milliseconds
                2.0  // read timeout
            );
            
            // Set authentication if configured
            if (!empty($_ENV['REDIS_PASSWORD'])) {
                $this->redis->auth($_ENV['REDIS_PASSWORD']);
            }
            
            // Select database
            $this->redis->select((int)($_ENV['REDIS_DB'] ?? 0));
            
            // Test connection
            if (!$this->redis->ping()) {
                throw new \Exception('Redis ping failed');
            }
            
        } catch (\Exception $e) {
            error_log('[SecurityHelper] Redis connection failed: ' . $e->getMessage());
            // Fallback to session-based storage
            $this->redis = null;
        }
    }
    
    /**
     * Inicializar configuración de seguridad
     */
    private function initializeSecurity() {
        // Set secure session configuration
        if ($this->config['session_security']) {
            $this->configureSecureSessions();
        }
        
        // Set security headers
        if ($this->config['secure_headers']) {
            $this->setSecurityHeaders();
        }
        
        // Start session securely
        $this->startSecureSession();
    }
    
    /**
     * ========== JWT & SESSION MANAGEMENT ==========
     */
    
    /**
     * Create user session with JWT tokens and Redis storage
     */
    public function createSession($user) {
        $sessionId = $this->generateSessionId();
        $now = time();
        
        // Generate access token (short-lived)
        $accessPayload = [
            'iss' => 'laburar.com',
            'aud' => 'laburar.com',
            'iat' => $now,
            'exp' => $now + self::ACCESS_TOKEN_EXPIRE,
            'user_id' => $user['id'],
            'session_id' => $sessionId,
            'user_type' => $user['user_type'],
            'permissions' => $this->getUserPermissions($user)
        ];
        
        // Generate refresh token (long-lived)
        $refreshPayload = [
            'iss' => 'laburar.com',
            'aud' => 'laburar.com',
            'iat' => $now,
            'exp' => $now + self::REFRESH_TOKEN_EXPIRE,
            'user_id' => $user['id'],
            'session_id' => $sessionId,
            'type' => 'refresh'
        ];
        
        $accessToken = JWT::encode($accessPayload, $this->jwtSecret, self::JWT_ALGORITHM);
        $refreshToken = JWT::encode($refreshPayload, $this->jwtSecret, self::JWT_ALGORITHM);
        
        // Store session data
        $sessionData = [
            'user_id' => $user['id'],
            'session_id' => $sessionId,
            'user_type' => $user['user_type'],
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'created_at' => $now,
            'last_activity' => $now,
            'access_token_hash' => hash('sha256', $accessToken),
            'refresh_token_hash' => hash('sha256', $refreshToken)
        ];
        
        if ($this->redis) {
            // Store in Redis
            $this->redis->setex(
                self::SESSION_PREFIX . $sessionId,
                self::ACCESS_TOKEN_EXPIRE,
                json_encode($sessionData)
            );
            
            $this->redis->setex(
                self::REFRESH_PREFIX . $sessionId,
                self::REFRESH_TOKEN_EXPIRE,
                json_encode([
                    'user_id' => $user['id'],
                    'session_id' => $sessionId,
                    'refresh_token_hash' => hash('sha256', $refreshToken),
                    'created_at' => $now
                ])
            );
        } else {
            // Fallback to database storage
            $this->storeSessionInDatabase($sessionData);
        }
        
        return [
            'session_id' => $sessionId,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => self::ACCESS_TOKEN_EXPIRE
        ];
    }
    
    /**
     * Validate JWT token and check session
     */
    public function validateJWT($token) {
        try {
            // Decode JWT
            $decoded = JWT::decode($token, new Key($this->jwtSecret, self::JWT_ALGORITHM));
            $payload = (array) $decoded;
            
            // Check if token is blacklisted
            if ($this->isTokenBlacklisted($token)) {
                return false;
            }
            
            // For refresh tokens, validate differently
            if (isset($payload['type']) && $payload['type'] === 'refresh') {
                return $this->validateRefreshToken($token, $payload);
            }
            
            // Validate session exists
            $sessionData = $this->getSessionData($payload['session_id']);
            if (!$sessionData) {
                return false;
            }
            
            // Verify token hash matches stored hash
            if ($sessionData['access_token_hash'] !== hash('sha256', $token)) {
                return false;
            }
            
            // Update last activity
            $this->updateSessionActivity($payload['session_id']);
            
            return $payload;
            
        } catch (Exception $e) {
            error_log('[SecurityHelper] JWT validation failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * ========== CSRF PROTECTION ==========
     */
    
    public function generateCSRFToken() {
        if (!$this->config['csrf_protection']) {
            return null;
        }
        
        $token = bin2hex(random_bytes(self::CSRF_TOKEN_LENGTH));
        $expiry = time() + self::CSRF_TOKEN_EXPIRY;
        
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['csrf_tokens'][$token] = $expiry;
        
        // Clean expired tokens
        $this->cleanExpiredCSRFTokens();
        
        return $token;
    }
    
    public function validateCSRFToken($token) {
        if (!$this->config['csrf_protection']) {
            return true;
        }
        
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (empty($token) || empty($_SESSION['csrf_tokens'][$token])) {
            $this->logSecurityEvent('csrf_validation_failed', [
                'token' => substr($token, 0, 8) . '...',
                'ip' => $this->getClientIP()
            ]);
            return false;
        }
        
        // Check if token is expired
        if ($_SESSION['csrf_tokens'][$token] < time()) {
            unset($_SESSION['csrf_tokens'][$token]);
            $this->logSecurityEvent('csrf_token_expired', [
                'token' => substr($token, 0, 8) . '...',
                'ip' => $this->getClientIP()
            ]);
            return false;
        }
        
        // Token is valid, remove it (one-time use)
        unset($_SESSION['csrf_tokens'][$token]);
        return true;
    }
    
    private function cleanExpiredCSRFTokens() {
        if (empty($_SESSION['csrf_tokens'])) {
            return;
        }
        
        $current_time = time();
        foreach ($_SESSION['csrf_tokens'] as $token => $expiry) {
            if ($expiry < $current_time) {
                unset($_SESSION['csrf_tokens'][$token]);
            }
        }
    }
    
    /**
     * ========== INPUT VALIDATION & SANITIZATION ==========
     */
    
    public function validateInput($input, string $type, array $options = []): bool {
        $startTime = microtime(true);
        
        // Quick null/empty check
        if ($input === null || $input === '') {
            $this->recordValidationMetric($type, microtime(true) - $startTime);
            return empty($options['required']);
        }
        
        // Check validation cache for identical inputs (security risk for passwords)
        if ($type !== 'password') {
            $cacheKey = hash('xxh3', $type . serialize($input) . serialize($options));
            if (isset($this->validationCache[$cacheKey])) {
                $this->recordValidationMetric($type, microtime(true) - $startTime, 'cached');
                return $this->validationCache[$cacheKey];
            }
        }
        
        $result = match ($type) {
            'email' => $this->validateEmail($input, $options),
            'password' => $this->validatePassword($input, $options),
            'phone' => $this->validatePhone($input, $options),
            'name' => $this->validateName($input, $options),
            'text' => $this->validateText($input, $options),
            'url' => $this->validateURL($input, $options),
            'numeric' => $this->validateNumeric($input, $options),
            'date' => $this->validateDate($input, $options),
            'file' => $this->validateFile($input, $options),
            'cuit' => $this->validateCUIT($input, $options),
            'argentine_phone' => $this->validateArgentinePhone($input, $options),
            default => false
        };
        
        // Cache non-password validations
        if ($type !== 'password' && isset($cacheKey)) {
            $this->validationCache[$cacheKey] = $result;
            
            // Limit cache size to prevent memory issues
            if (count($this->validationCache) > 1000) {
                $this->validationCache = array_slice($this->validationCache, -500, null, true);
            }
        }
        
        $this->recordValidationMetric($type, microtime(true) - $startTime);
        return $result;
    }
    
    public function sanitizeInput($input, string $type, array $options = []) {
        if ($input === null || $input === '') {
            return $input;
        }
        
        // Prevent extremely long inputs that could cause DoS
        $maxLength = $options['max_length'] ?? 10000;
        if (is_string($input) && strlen($input) > $maxLength) {
            $this->logSecurityEvent('input_length_exceeded', [
                'type' => $type,
                'length' => strlen($input),
                'max_allowed' => $maxLength
            ]);
            $input = substr($input, 0, $maxLength);
        }
        
        // Basic XSS protection
        if ($this->config['xss_protection'] && $type !== 'password') {
            $input = $this->sanitizeXSS($input);
        }
        
        return match ($type) {
            'email' => filter_var(trim($input), FILTER_SANITIZE_EMAIL),
            'name' => trim(preg_replace('/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\']/u', '', $input)),
            'text' => trim(htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8')),
            'url' => filter_var(trim($input), FILTER_SANITIZE_URL),
            'numeric' => preg_replace('/[^0-9\.\-]/', '', $input),
            'phone' => preg_replace('/[^0-9\+\-\s\(\)]/', '', $input),
            'cuit' => preg_replace('/[^0-9\-]/', '', $input),
            'argentine_phone' => preg_replace('/[^0-9\+\-\s\(\)]/', '', $input),
            'password' => $input, // Don't sanitize passwords
            default => trim(htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8'))
        };
    }
    
    private function validateEmail(string $email, array $options): bool {
        // Basic format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Check length (RFC 5321 limit)
        if (strlen($email) > 254) {
            return false;
        }
        
        // Extract domain for additional checks
        $domain = substr(strrchr($email, "@"), 1);
        if (!$domain) {
            return false;
        }
        
        // Check for blocked domains
        if (!empty($options['blocked_domains']) && in_array($domain, $options['blocked_domains'])) {
            return false;
        }
        
        // Check for common disposable email providers (if option enabled)
        if (!empty($options['block_disposable'])) {
            $disposableDomains = [
                '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
                'mailinator.com', 'yopmail.com', 'temp-mail.org'
            ];
            if (in_array($domain, $disposableDomains)) {
                $this->logSecurityEvent('disposable_email_blocked', ['email' => $email]);
                return false;
            }
        }
        
        // Check for suspicious patterns
        if (preg_match('/[+].*[+]/', $email)) { // Multiple + signs
            $this->logSecurityEvent('suspicious_email_pattern', ['email' => $email]);
            return false;
        }
        
        return true;
    }
    
    private function validatePassword(string $password, array $options): bool {
        $minLength = $options['min_length'] ?? self::PASSWORD_MIN_LENGTH;
        $maxLength = $options['max_length'] ?? self::PASSWORD_MAX_LENGTH;
        
        // Length check
        $length = strlen($password);
        if ($length < $minLength || $length > $maxLength) {
            return false;
        }
        
        // Basic policy - just length requirement
        if (!$this->config['password_policy_strict']) {
            return true;
        }
        
        // Strict policy requirements
        $requirements = 0;
        $patterns = [
            '/[A-Z]/' => 'uppercase',
            '/[a-z]/' => 'lowercase', 
            '/[0-9]/' => 'number',
            '/[^a-zA-Z0-9]/' => 'special'
        ];
        
        foreach ($patterns as $pattern => $type) {
            if (preg_match($pattern, $password)) {
                $requirements++;
            }
        }
        
        // Require at least 3 of 4 character types
        $minRequirements = $options['min_requirements'] ?? 3;
        if ($requirements < $minRequirements) {
            return false;
        }
        
        // Check entropy (randomness)
        if ($this->calculatePasswordEntropy($password) < 50) {
            return false;
        }
        
        // Check for common weak passwords
        if ($this->isCommonPassword($password)) {
            return false;
        }
        
        // Check for repeated patterns
        if ($this->hasRepeatedPatterns($password)) {
            return false;
        }
        
        return true;
    }
    
    private function validatePhone($phone, $options) {
        // Remove formatting
        $clean_phone = preg_replace('/[^0-9\+]/', '', $phone);
        
        // Argentine phone format
        if (isset($options['country']) && $options['country'] === 'AR') {
            return preg_match('/^(\+54)?[0-9]{10,11}$/', $clean_phone);
        }
        
        // General international format
        return preg_match('/^[\+]?[0-9]{7,15}$/', $clean_phone);
    }
    
    private function validateName($name, $options) {
        $min_length = $options['min_length'] ?? 2;
        $max_length = $options['max_length'] ?? 50;
        
        if (strlen($name) < $min_length || strlen($name) > $max_length) {
            return false;
        }
        
        // Only letters, spaces, hyphens, apostrophes, and accented characters
        return preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\']+$/u', $name);
    }
    
    private function validateText($text, $options) {
        $max_length = $options['max_length'] ?? 1000;
        
        if (strlen($text) > $max_length) {
            return false;
        }
        
        // Check for potentially malicious content
        $dangerous_patterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/vbscript:/i',
            '/on\w+\s*=/i'
        ];
        
        foreach ($dangerous_patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                $this->logSecurityEvent('malicious_content_detected', [
                    'pattern' => $pattern,
                    'content' => substr($text, 0, 100) . '...'
                ]);
                return false;
            }
        }
        
        return true;
    }
    
    private function validateURL($url, $options) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        
        // Check allowed schemes
        $allowed_schemes = $options['allowed_schemes'] ?? ['http', 'https'];
        $scheme = parse_url($url, PHP_URL_SCHEME);
        
        return in_array($scheme, $allowed_schemes);
    }
    
    private function validateNumeric($value, $options) {
        if (!is_numeric($value)) {
            return false;
        }
        
        $min = $options['min'] ?? null;
        $max = $options['max'] ?? null;
        
        if ($min !== null && $value < $min) {
            return false;
        }
        
        if ($max !== null && $value > $max) {
            return false;
        }
        
        return true;
    }
    
    private function validateDate($date, $options) {
        $format = $options['format'] ?? 'Y-m-d';
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    private function validateFile($file, $options) {
        if (!is_array($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        
        // Check file size
        $max_size = $options['max_size'] ?? $this->config['max_file_upload_size'];
        if ($file['size'] > $max_size) {
            return false;
        }
        
        // Check file type
        $allowed_types = $options['allowed_types'] ?? $this->config['allowed_file_types'];
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file_extension, $allowed_types)) {
            return false;
        }
        
        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowed_mimes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (isset($allowed_mimes[$file_extension]) && $mime_type !== $allowed_mimes[$file_extension]) {
            $this->logSecurityEvent('file_mime_type_mismatch', [
                'expected' => $allowed_mimes[$file_extension],
                'actual' => $mime_type,
                'filename' => $file['name']
            ]);
            return false;
        }
        
        return true;
    }
    
    /**
     * ========== XSS PROTECTION ==========
     */
    
    private function sanitizeXSS($input) {
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        // Remove dangerous HTML tags
        $dangerous_tags = ['script', 'iframe', 'object', 'embed', 'form', 'meta', 'link'];
        foreach ($dangerous_tags as $tag) {
            $input = preg_replace('/<' . $tag . '[^>]*>.*?<\/' . $tag . '>/is', '', $input);
            $input = preg_replace('/<' . $tag . '[^>]*\/?>/is', '', $input);
        }
        
        // Remove dangerous attributes
        $input = preg_replace('/\son\w+\s*=\s*["\'][^"\']*["\']/i', '', $input);
        $input = preg_replace('/javascript:/i', '', $input);
        $input = preg_replace('/vbscript:/i', '', $input);
        
        return $input;
    }
    
    /**
     * ========== RATE LIMITING ==========
     */
    
    public function checkRateLimit($identifier, $action = 'general', $limit = null) {
        if (!$this->config['rate_limiting']) {
            return true;
        }
        
        $limit = $limit ?? self::DEFAULT_RATE_LIMIT;
        $window_start = time() - self::RATE_LIMIT_WINDOW;
        
        // Clean old entries
        $this->cleanOldRateLimitEntries($window_start);
        
        // Count current requests
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as request_count 
            FROM rate_limits 
            WHERE identifier = ? AND action = ? AND created_at > ?
        ");
        $stmt->execute([$identifier, $action, date('Y-m-d H:i:s', $window_start)]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($result['request_count'] >= $limit) {
            $this->logSecurityEvent('rate_limit_exceeded', [
                'identifier' => $identifier,
                'action' => $action,
                'count' => $result['request_count'],
                'limit' => $limit
            ]);
            return false;
        }
        
        // Record this request
        $this->recordRateLimitRequest($identifier, $action);
        
        return true;
    }
    
    private function recordRateLimitRequest($identifier, $action) {
        $stmt = $this->db->prepare("
            INSERT INTO rate_limits (identifier, action, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $identifier,
            $action,
            $this->getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
    
    private function cleanOldRateLimitEntries($cutoff_time) {
        $stmt = $this->db->prepare("
            DELETE FROM rate_limits WHERE created_at < ?
        ");
        $stmt->execute([date('Y-m-d H:i:s', $cutoff_time)]);
    }
    
    /**
     * ========== FAILED LOGIN TRACKING ==========
     */
    
    public function recordFailedLogin($identifier, $reason = 'invalid_credentials') {
        if (!$this->config['failed_login_tracking']) {
            return;
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO failed_logins (identifier, ip_address, user_agent, reason, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $identifier,
            $this->getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $reason
        ]);
        
        $this->logSecurityEvent('failed_login', [
            'identifier' => $identifier,
            'reason' => $reason,
            'ip' => $this->getClientIP()
        ]);
    }
    
    public function isAccountLocked($identifier) {
        if (!$this->config['failed_login_tracking']) {
            return false;
        }
        
        $lockout_start = time() - self::LOCKOUT_DURATION;
        
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as failed_attempts 
            FROM failed_logins 
            WHERE identifier = ? AND created_at > ?
        ");
        $stmt->execute([$identifier, date('Y-m-d H:i:s', $lockout_start)]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        $is_locked = $result['failed_attempts'] >= self::MAX_LOGIN_ATTEMPTS;
        
        if ($is_locked) {
            $this->logSecurityEvent('account_locked', [
                'identifier' => $identifier,
                'failed_attempts' => $result['failed_attempts']
            ]);
        }
        
        return $is_locked;
    }
    
    public function clearFailedLogins($identifier) {
        $stmt = $this->db->prepare("
            DELETE FROM failed_logins WHERE identifier = ?
        ");
        $stmt->execute([$identifier]);
    }
    
    /**
     * ========== 2FA/TOTP METHODS ==========
     */
    
    public function generateTOTPSecret() {
        return $this->google2fa->generateSecretKey();
    }
    
    public function generateQRCode($email, $secret) {
        return $this->google2fa->getQRCodeUrl(
            'LaburAR',
            $email,
            $secret
        );
    }
    
    public function verifyTOTP($secret, $code) {
        return $this->google2fa->verifyKey($secret, $code, 2); // 2 * 30sec window
    }
    
    public function generateBackupCodes($count = 10) {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)) . '-' . bin2hex(random_bytes(4)));
        }
        return $codes;
    }
    
    /**
     * ========== UTILITY METHODS ==========
     */
    
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID);
    }
    
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    public function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    public function getBearerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (strpos($auth, 'Bearer ') === 0) {
                return substr($auth, 7);
            }
        }
        
        return null;
    }
    
    private function getClientIP() {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function generateSessionId() {
        return 'sess_' . bin2hex(random_bytes(16)) . '_' . time();
    }
    
    private function isCommonPassword(string $password): bool {
        // Expanded list of common passwords
        $common_passwords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '111111', 'dragon', 'sunshine', 'princess', 'football',
            '1234567890', 'iloveyou', 'rockyou', 'baseball', 'trustno1',
            // Spanish common passwords
            'contraseña', 'clave123', 'password', 'administrador'
        ];
        
        $lowercase = strtolower($password);
        
        // Exact match check
        if (in_array($lowercase, $common_passwords)) {
            return true;
        }
        
        // Check for variations (password with numbers at end)
        $base = preg_replace('/\d+$/', '', $lowercase);
        if (in_array($base, $common_passwords)) {
            return true;
        }
        
        // Check for keyboard patterns
        $patterns = ['qwerty', 'asdf', '1234', 'abcd'];
        foreach ($patterns as $pattern) {
            if (strpos($lowercase, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Calculate password entropy for strength assessment
     */
    private function calculatePasswordEntropy(string $password): float {
        $length = strlen($password);
        if ($length === 0) return 0;
        
        $charset_size = 0;
        
        // Determine character set size
        if (preg_match('/[a-z]/', $password)) $charset_size += 26;
        if (preg_match('/[A-Z]/', $password)) $charset_size += 26; 
        if (preg_match('/[0-9]/', $password)) $charset_size += 10;
        if (preg_match('/[^a-zA-Z0-9]/', $password)) $charset_size += 32;
        
        // Calculate entropy: log2(charset_size) × length
        return log($charset_size, 2) * $length;
    }
    
    /**
     * Check for repeated patterns in password
     */
    private function hasRepeatedPatterns(string $password): bool {
        $length = strlen($password);
        
        // Check for repeating characters (more than 2 in a row)
        if (preg_match('/(.)\1{2,}/', $password)) {
            return true;
        }
        
        // Check for repeating substrings
        for ($i = 2; $i <= $length / 2; $i++) {
            for ($j = 0; $j <= $length - $i * 2; $j++) {
                $substring = substr($password, $j, $i);
                $next = substr($password, $j + $i, $i);
                if ($substring === $next) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Validate Argentine CUIT format
     */
    private function validateCUIT(string $cuit, array $options): bool {
        // Remove formatting
        $clean_cuit = preg_replace('/[^0-9]/', '', $cuit);
        
        // Check length (11 digits)
        if (strlen($clean_cuit) !== 11) {
            return false;
        }
        
        // CUIT validation algorithm
        $multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $sum += intval($clean_cuit[$i]) * $multipliers[$i];
        }
        
        $remainder = $sum % 11;
        $checkDigit = $remainder < 2 ? $remainder : 11 - $remainder;
        
        return intval($clean_cuit[10]) === $checkDigit;
    }
    
    /**
     * Validate Argentine phone number format
     */
    private function validateArgentinePhone(string $phone, array $options): bool {
        // Remove formatting
        $clean_phone = preg_replace('/[^0-9\+]/', '', $phone);
        
        // Check for international format (+54)
        if (strpos($clean_phone, '+54') === 0) {
            $clean_phone = substr($clean_phone, 3);
        } elseif (strpos($clean_phone, '54') === 0 && strlen($clean_phone) > 10) {
            $clean_phone = substr($clean_phone, 2);
        }
        
        // Argentine mobile: area code (2-4 digits) + number (6-8 digits)
        // Total: 10 digits (with area code 11 for Buenos Aires)
        return preg_match('/^(11|[2-9]\d{1,3})\d{6,8}$/', $clean_phone);
    }
    
    /**
     * Record validation performance metrics
     */
    private function recordValidationMetric(string $type, float $duration, string $source = 'computed'): void {
        if (!isset($this->performanceMetrics['validations'])) {
            $this->performanceMetrics['validations'] = [];
        }
        
        if (!isset($this->performanceMetrics['validations'][$type])) {
            $this->performanceMetrics['validations'][$type] = [
                'count' => 0,
                'total_time' => 0,
                'avg_time' => 0,
                'cached_count' => 0
            ];
        }
        
        $this->performanceMetrics['validations'][$type]['count']++;
        $this->performanceMetrics['validations'][$type]['total_time'] += $duration;
        $this->performanceMetrics['validations'][$type]['avg_time'] = 
            $this->performanceMetrics['validations'][$type]['total_time'] / 
            $this->performanceMetrics['validations'][$type]['count'];
            
        if ($source === 'cached') {
            $this->performanceMetrics['validations'][$type]['cached_count']++;
        }
    }
    
    private function getUserPermissions($user) {
        $permissions = ['authenticated'];
        
        switch ($user['user_type']) {
            case 'freelancer':
                $permissions[] = 'freelancer';
                $permissions[] = 'create_proposals';
                $permissions[] = 'manage_portfolio';
                break;
                
            case 'client':
                $permissions[] = 'client';
                $permissions[] = 'post_projects';
                $permissions[] = 'hire_freelancers';
                break;
                
            case 'admin':
                $permissions[] = 'admin';
                $permissions[] = 'manage_users';
                $permissions[] = 'moderate_content';
                break;
        }
        
        // Add verified permissions
        if ($user['email_verified_at']) {
            $permissions[] = 'email_verified';
        }
        
        if ($user['phone_verified_at']) {
            $permissions[] = 'phone_verified';
        }
        
        return $permissions;
    }
    
    /**
     * ========== SESSION MANAGEMENT HELPERS ==========
     */
    
    private function configureSecureSessions() {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_strict_mode', 1);
        ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
        ini_set('session.cookie_samesite', 'Strict');
        ini_set('session.gc_maxlifetime', $this->config['session_timeout']);
    }
    
    private function startSecureSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Regenerate session ID on login
        if (!isset($_SESSION['initialized'])) {
            session_regenerate_id(true);
            $_SESSION['initialized'] = true;
            $_SESSION['created_at'] = time();
        }
        
        // Check session timeout
        if (isset($_SESSION['last_activity']) && 
            (time() - $_SESSION['last_activity']) > $this->config['session_timeout']) {
            $this->destroySession();
            return false;
        }
        
        $_SESSION['last_activity'] = time();
        return true;
    }
    
    public function destroySession() {
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
    }
    
    private function setSecurityHeaders() {
        // Prevent XSS
        header('X-XSS-Protection: 1; mode=block');
        
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Prevent framing
        header('X-Frame-Options: DENY');
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Content Security Policy
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " .
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
               "font-src 'self' https://fonts.gstatic.com; " .
               "img-src 'self' data: https:; " .
               "connect-src 'self';";
        header('Content-Security-Policy: ' . $csp);
        
        // HTTPS enforcement (if on HTTPS)
        if (isset($_SERVER['HTTPS'])) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }
    
    /**
     * ========== SECURITY LOGGING ==========
     */
    
    private function logSecurityEvent($event_type, $details = []) {
        if (!$this->config['log_security_events']) {
            return;
        }
        
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event_type' => $event_type,
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'session_id' => session_id(),
            'details' => $details
        ];
        
        // Log to database
        try {
            $stmt = $this->db->prepare("
                INSERT INTO security_logs (event_type, ip_address, user_agent, session_id, details, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $event_type,
                $log_entry['ip_address'],
                $log_entry['user_agent'],
                $log_entry['session_id'],
                json_encode($details)
            ]);
        } catch (\Exception $e) {
            // Fallback to file logging
            error_log('[SecurityHelper] ' . json_encode($log_entry));
        }
        
        // Log to file as well
        $log_file = __DIR__ . '/../logs/security/' . date('Y-m-d') . '.log';
        $log_dir = dirname($log_file);
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        file_put_contents($log_file, json_encode($log_entry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * ========== ADDITIONAL HELPER METHODS ==========
     */
    
    private function getSessionData($sessionId) {
        if ($this->redis) {
            $data = $this->redis->get(self::SESSION_PREFIX . $sessionId);
            return $data ? json_decode($data, true) : null;
        } else {
            // Fallback to database
            $stmt = $this->db->prepare("SELECT * FROM user_sessions WHERE session_id = ?");
            $stmt->execute([$sessionId]);
            return $stmt->fetch(\PDO::FETCH_ASSOC);
        }
    }
    
    private function updateSessionActivity($sessionId) {
        if ($this->redis) {
            $sessionData = $this->getSessionData($sessionId);
            if ($sessionData) {
                $sessionData['last_activity'] = time();
                $this->redis->setex(
                    self::SESSION_PREFIX . $sessionId,
                    self::ACCESS_TOKEN_EXPIRE,
                    json_encode($sessionData)
                );
            }
        } else {
            $stmt = $this->db->prepare("
                UPDATE user_sessions 
                SET last_activity = NOW() 
                WHERE session_id = ?
            ");
            $stmt->execute([$sessionId]);
        }
    }
    
    private function storeSessionInDatabase($sessionData) {
        $stmt = $this->db->prepare("
            INSERT INTO user_sessions (session_id, user_id, user_type, ip_address, user_agent, access_token_hash, refresh_token_hash, created_at, last_activity)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $sessionData['session_id'],
            $sessionData['user_id'],
            $sessionData['user_type'],
            $sessionData['ip_address'],
            $sessionData['user_agent'],
            $sessionData['access_token_hash'],
            $sessionData['refresh_token_hash']
        ]);
    }
    
    private function validateRefreshToken($token, $payload) {
        if ($this->redis) {
            $refreshData = $this->redis->get(self::REFRESH_PREFIX . $payload['session_id']);
            if (!$refreshData) {
                return false;
            }
            
            $refresh = json_decode($refreshData, true);
            
            // Verify token hash matches
            if ($refresh['refresh_token_hash'] !== hash('sha256', $token)) {
                return false;
            }
        } else {
            // Database fallback
            $stmt = $this->db->prepare("
                SELECT * FROM user_sessions 
                WHERE session_id = ? AND refresh_token_hash = ?
            ");
            $stmt->execute([$payload['session_id'], hash('sha256', $token)]);
            if (!$stmt->fetch()) {
                return false;
            }
        }
        
        return $payload;
    }
    
    private function isTokenBlacklisted($token) {
        if ($this->redis) {
            return $this->redis->exists(self::BLACKLIST_PREFIX . hash('sha256', $token));
        } else {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM blacklisted_tokens 
                WHERE token_hash = ? AND expires_at > NOW()
            ");
            $stmt->execute([hash('sha256', $token)]);
            return $stmt->fetchColumn() > 0;
        }
    }
    
    public function blacklistToken(string $token): bool {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, self::JWT_ALGORITHM));
            $payload = (array) $decoded;
            
            // Store token hash in blacklist until it would naturally expire
            $ttl = max(0, $payload['exp'] - time());
            if ($ttl > 0) {
                $tokenHash = hash('sha256', $token);
                
                if ($this->redis) {
                    $this->redis->setex(
                        self::BLACKLIST_PREFIX . $tokenHash,
                        $ttl,
                        json_encode([
                            'blacklisted_at' => time(),
                            'user_id' => $payload['user_id'] ?? null,
                            'reason' => 'manual_blacklist'
                        ])
                    );
                } else {
                    $stmt = $this->db->prepare("
                        INSERT INTO blacklisted_tokens (token_hash, user_id, reason, expires_at, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE blacklisted_at = NOW()
                    ");
                    $stmt->execute([
                        $tokenHash,
                        $payload['user_id'] ?? null,
                        'manual_blacklist',
                        date('Y-m-d H:i:s', $payload['exp'])
                    ]);
                }
                
                $this->logSecurityEvent('token_blacklisted', [
                    'user_id' => $payload['user_id'] ?? null,
                    'token_hash' => substr($tokenHash, 0, 8) . '...',
                    'expires_at' => $payload['exp']
                ]);
                
                return true;
            }
        } catch (\Exception $e) {
            error_log('[SecurityHelper] Token blacklist failed: ' . $e->getMessage());
        }
        
        return false;
    }
    
    /**
     * Invalidate user session and associated tokens
     */
    public function invalidateSession(int $userId): bool {
        try {
            if ($this->redis) {
                // Get all session keys for the user
                $sessionKeys = $this->redis->keys(self::SESSION_PREFIX . '*');
                foreach ($sessionKeys as $key) {
                    $sessionData = $this->redis->get($key);
                    if ($sessionData) {
                        $data = json_decode($sessionData, true);
                        if ($data && $data['user_id'] == $userId) {
                            $this->redis->del($key);
                        }
                    }
                }
                
                // Remove refresh tokens
                $refreshKeys = $this->redis->keys(self::REFRESH_PREFIX . '*');
                foreach ($refreshKeys as $key) {
                    $refreshData = $this->redis->get($key);
                    if ($refreshData) {
                        $data = json_decode($refreshData, true);
                        if ($data && $data['user_id'] == $userId) {
                            $this->redis->del($key);
                        }
                    }
                }
            } else {
                // Database fallback
                $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE user_id = ?");
                $stmt->execute([$userId]);
            }
            
            $this->logSecurityEvent('session_invalidated', ['user_id' => $userId]);
            return true;
            
        } catch (\Exception $e) {
            error_log('[SecurityHelper] Session invalidation failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Invalidate all user sessions (for password reset, security breach, etc.)
     */
    public function invalidateAllUserSessions(int $userId): bool {
        return $this->invalidateSession($userId);
    }
    
    /**
     * Get performance metrics for monitoring
     */
    public function getPerformanceMetrics(): array {
        return $this->performanceMetrics;
    }
    
    /**
     * Reset performance metrics
     */
    public function resetPerformanceMetrics(): void {
        $this->performanceMetrics = [];
        $this->validationCache = [];
    }
    
    /**
     * Advanced rate limiting with different strategies
     */
    public function checkAdvancedRateLimit(string $identifier, string $action, array $options = []): bool {
        if (!$this->config['rate_limiting']) {
            return true;
        }
        
        $strategy = $options['strategy'] ?? 'sliding_window';
        $limit = $options['limit'] ?? self::DEFAULT_RATE_LIMIT;
        $window = $options['window'] ?? self::RATE_LIMIT_WINDOW;
        
        switch ($strategy) {
            case 'token_bucket':
                return $this->tokenBucketRateLimit($identifier, $action, $limit, $window);
            case 'sliding_window':
                return $this->slidingWindowRateLimit($identifier, $action, $limit, $window);
            case 'fixed_window':
            default:
                return $this->checkRateLimit($identifier, $action, $limit);
        }
    }
    
    /**
     * Token bucket rate limiting implementation
     */
    private function tokenBucketRateLimit(string $identifier, string $action, int $limit, int $window): bool {
        $key = "token_bucket:{$identifier}:{$action}";
        $now = time();
        
        if ($this->redis) {
            $bucket = $this->redis->hGetAll($key);
            
            if (empty($bucket)) {
                // Initialize bucket
                $bucket = [
                    'tokens' => $limit,
                    'last_refill' => $now
                ];
            } else {
                // Refill tokens based on time elapsed
                $elapsed = $now - $bucket['last_refill'];
                $refill_rate = $limit / $window; // tokens per second
                $tokens_to_add = floor($elapsed * $refill_rate);
                
                $bucket['tokens'] = min($limit, $bucket['tokens'] + $tokens_to_add);
                $bucket['last_refill'] = $now;
            }
            
            if ($bucket['tokens'] >= 1) {
                $bucket['tokens']--;
                $this->redis->hMSet($key, $bucket);
                $this->redis->expire($key, $window);
                return true;
            } else {
                $this->redis->hMSet($key, $bucket);
                $this->redis->expire($key, $window);
                return false;
            }
        }
        
        // Fallback to simple rate limiting
        return $this->checkRateLimit($identifier, $action, $limit);
    }
    
    /**
     * Sliding window rate limiting implementation
     */
    private function slidingWindowRateLimit(string $identifier, string $action, int $limit, int $window): bool {
        $key = "sliding_window:{$identifier}:{$action}";
        $now = time();
        $window_start = $now - $window;
        
        if ($this->redis) {
            // Remove old entries
            $this->redis->zRemRangeByScore($key, 0, $window_start);
            
            // Count current requests
            $current_requests = $this->redis->zCard($key);
            
            if ($current_requests < $limit) {
                // Add new request
                $this->redis->zAdd($key, $now, uniqid('', true));
                $this->redis->expire($key, $window);
                return true;
            }
            
            return false;
        }
        
        // Fallback to simple rate limiting
        return $this->checkRateLimit($identifier, $action, $limit);
    }
    
    /**
     * Check if IP is in whitelist (if enabled)
     */
    public function isIPWhitelisted(string $ip): bool {
        if (!$this->config['ip_whitelist_enabled']) {
            return true; // Whitelist disabled, allow all
        }
        
        $whitelist = $this->getIPWhitelist();
        return in_array($ip, $whitelist);
    }
    
    /**
     * Get IP whitelist from configuration
     */
    private function getIPWhitelist(): array {
        // This would typically be stored in database or config file
        return $_ENV['IP_WHITELIST'] ? explode(',', $_ENV['IP_WHITELIST']) : [];
    }
    
    /**
     * Detect suspicious activity patterns
     */
    public function detectSuspiciousActivity(string $identifier, string $action): bool {
        if (!$this->config['suspicious_activity_detection']) {
            return false;
        }
        
        $patterns = [
            'rapid_requests' => $this->checkRapidRequests($identifier),
            'unusual_user_agent' => $this->checkUnusualUserAgent(),
            'geo_anomaly' => $this->checkGeographicAnomaly($identifier),
            'time_anomaly' => $this->checkTimeAnomaly($identifier)
        ];
        
        $suspicious_count = array_sum($patterns);
        
        if ($suspicious_count >= 2) {
            $this->logSecurityEvent('suspicious_activity_detected', [
                'identifier' => $identifier,
                'action' => $action,
                'patterns' => array_keys(array_filter($patterns)),
                'score' => $suspicious_count
            ]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Check for rapid requests pattern
     */
    private function checkRapidRequests(string $identifier): bool {
        // Check if requests are coming too rapidly (more than 10 per minute)
        return !$this->checkAdvancedRateLimit($identifier, 'rapid_check', [
            'limit' => 10,
            'window' => 60,
            'strategy' => 'sliding_window'
        ]);
    }
    
    /**
     * Check for unusual user agent
     */
    private function checkUnusualUserAgent(): bool {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Empty user agent
        if (empty($user_agent)) {
            return true;
        }
        
        // Check against blocked user agents
        foreach ($this->config['blocked_user_agents'] as $blocked) {
            if (stripos($user_agent, $blocked) !== false) {
                return true;
            }
        }
        
        // Check for unusual patterns
        if (strlen($user_agent) > 1000 || strlen($user_agent) < 10) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check for geographic anomalies (placeholder - would need GeoIP service)
     */
    private function checkGeographicAnomaly(string $identifier): bool {
        // This would typically integrate with a GeoIP service
        // For now, just return false
        return false;
    }
    
    /**
     * Check for time-based anomalies
     */
    private function checkTimeAnomaly(string $identifier): bool {
        $hour = (int)date('H');
        
        // Suspicious if active during typical sleeping hours (2 AM - 6 AM local time)
        // This is a simple heuristic and could be improved with user behavior analysis
        return $hour >= 2 && $hour <= 6;
    }
}
?>