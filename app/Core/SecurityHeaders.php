<?php
/**
 * Security Headers Manager
 * Configures secure HTTP headers and CORS policies
 */

namespace LaburAR\Core;

class SecurityHeaders {
    private $config;
    private $nonce;
    
    public function __construct() {
        require_once __DIR__ . '/../../config/secure_config.php';
        $this->config = \SecureConfig::getInstance();
        $this->nonce = base64_encode(random_bytes(16));
    }
    
    /**
     * Set all security headers
     */
    public function setSecurityHeaders() {
        // Remove server information
        header_remove('X-Powered-By');
        header_remove('Server');
        
        // Basic security headers
        $this->setBasicSecurityHeaders();
        
        // Content Security Policy
        $this->setContentSecurityPolicy();
        
        // CORS headers
        $this->setCorsHeaders();
        
        // Additional security headers
        $this->setAdditionalHeaders();
    }
    
    /**
     * Set basic security headers
     */
    private function setBasicSecurityHeaders() {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Enable XSS protection
        header('X-XSS-Protection: 1; mode=block');
        
        // Prevent framing (clickjacking protection)
        header('X-Frame-Options: DENY');
        
        // Force HTTPS in production
        if ($this->config->isProduction()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Feature policy / Permissions policy
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    }
    
    /**
     * Set Content Security Policy
     */
    private function setContentSecurityPolicy() {
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$this->nonce}' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
            "style-src 'self' 'nonce-{$this->nonce}' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ];
        
        // Remove upgrade-insecure-requests in development
        if (!$this->config->isProduction()) {
            $csp = array_filter($csp, function($directive) {
                return $directive !== 'upgrade-insecure-requests';
            });
        }
        
        header('Content-Security-Policy: ' . implode('; ', $csp));
    }
    
    /**
     * Set CORS headers
     */
    private function setCorsHeaders() {
        $allowedOrigins = $this->config->getCorsOrigins();
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Check if origin is allowed
        if (in_array('*', $allowedOrigins)) {
            // Only allow wildcard in development
            if (!$this->config->isProduction()) {
                header('Access-Control-Allow-Origin: *');
            } else {
                // In production, be more restrictive
                header('Access-Control-Allow-Origin: ' . $this->config->get('APP_URL'));
            }
        } elseif (in_array($origin, $allowedOrigins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            // Origin not allowed, set to null
            header('Access-Control-Allow-Origin: null');
        }
        
        // CORS methods and headers
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // 24 hours
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
    
    /**
     * Set additional security headers
     */
    private function setAdditionalHeaders() {
        // Expect-CT (Certificate Transparency)
        if ($this->config->isProduction()) {
            header('Expect-CT: max-age=86400, enforce');
        }
        
        // Set secure session cookie parameters
        $this->setSecureSessionConfig();
    }
    
    /**
     * Configure secure session settings
     */
    private function setSecureSessionConfig() {
        // Session configuration based on environment
        $sessionConfig = [
            'cookie_lifetime' => $this->config->getInt('SESSION_LIFETIME', 120) * 60,
            'cookie_path' => '/',
            'cookie_domain' => parse_url($this->config->get('APP_URL'), PHP_URL_HOST),
            'cookie_secure' => $this->config->getBool('SESSION_SECURE', $this->config->isProduction()),
            'cookie_httponly' => $this->config->getBool('SESSION_HTTP_ONLY', true),
            'cookie_samesite' => $this->config->get('SESSION_SAME_SITE', 'Lax'),
            'use_strict_mode' => true,
            'use_cookies' => true,
            'use_only_cookies' => true,
            'use_trans_sid' => false,
            'entropy_file' => '/dev/urandom',
            'entropy_length' => 32,
            'hash_function' => 'sha256',
            'hash_bits_per_character' => 6
        ];
        
        foreach ($sessionConfig as $key => $value) {
            ini_set("session.$key", $value);
        }
    }
    
    /**
     * Get CSP nonce for inline scripts/styles
     */
    public function getNonce() {
        return $this->nonce;
    }
    
    /**
     * Validate and sanitize origin
     */
    public function isOriginAllowed($origin) {
        $allowedOrigins = $this->config->getCorsOrigins();
        
        if (in_array('*', $allowedOrigins) && !$this->config->isProduction()) {
            return true;
        }
        
        return in_array($origin, $allowedOrigins);
    }
    
    /**
     * Generate secure nonce for CSP
     */
    public static function generateNonce() {
        return base64_encode(random_bytes(16));
    }
    
    /**
     * Set JSON response headers
     */
    public function setJsonHeaders() {
        header('Content-Type: application/json; charset=utf-8');
        $this->setSecurityHeaders();
    }
    
    /**
     * Set HTML response headers
     */
    public function setHtmlHeaders() {
        header('Content-Type: text/html; charset=utf-8');
        $this->setSecurityHeaders();
    }
    
    /**
     * Rate limiting headers
     */
    public function setRateLimitHeaders($limit, $remaining, $resetTime) {
        header("X-RateLimit-Limit: $limit");
        header("X-RateLimit-Remaining: $remaining");
        header("X-RateLimit-Reset: $resetTime");
        
        if ($remaining <= 0) {
            header('Retry-After: ' . ($resetTime - time()));
        }
    }
    
    /**
     * Security event logging
     */
    public function logSecurityEvent($event, $details = []) {
        $logData = [
            'timestamp' => date('c'),
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? '',
            'details' => $details
        ];
        
        $logEntry = json_encode($logData) . "\n";
        $logFile = __DIR__ . '/../../logs/security.log';
        
        // Ensure logs directory exists
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}