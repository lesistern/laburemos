<?php
/**
 * AuthMiddleware - Middleware de Autenticación Enterprise
 * 
 * Proporciona verificación de autenticación, autorización basada en roles,
 * validación de permisos y protección de rutas para LaburAR
 * 
 * @version 2.0.0
 * @package LaburAR\Middleware
 */

require_once __DIR__ . '/SecurityHelper.php';
require_once __DIR__ . '/Database.php';

namespace LaburAR\Middleware;

class AuthMiddleware {
    
    private $security;
    private $db;
    private $config;
    
    // Permission levels
    const PERMISSION_PUBLIC = 'public';
    const PERMISSION_AUTHENTICATED = 'authenticated';
    const PERMISSION_VERIFIED = 'verified';
    const PERMISSION_FREELANCER = 'freelancer';
    const PERMISSION_CLIENT = 'client';
    const PERMISSION_ADMIN = 'admin';
    
    // Route protection levels
    const PROTECTION_NONE = 'none';
    const PROTECTION_AUTH = 'auth';
    const PROTECTION_VERIFIED = 'verified';
    const PROTECTION_ROLE = 'role';
    const PROTECTION_PERMISSION = 'permission';
    
    public function __construct() {
        $this->security = SecurityHelper::getInstance();
        $this->db = Database::getInstance();
        $this->config = $this->getMiddlewareConfig();
    }
    
    /**
     * Configuración del middleware
     */
    private function getMiddlewareConfig() {
        return [
            'token_header' => 'Authorization',
            'token_prefix' => 'Bearer ',
            'require_https' => $_ENV['REQUIRE_HTTPS'] ?? false,
            'csrf_protection' => true,
            'session_validation' => true,
            'rate_limiting' => true,
            'ip_whitelist' => $_ENV['IP_WHITELIST'] ?? null,
            'maintenance_mode' => $_ENV['MAINTENANCE_MODE'] ?? false,
            'api_version_header' => 'X-API-Version',
            'required_api_version' => '1.0'
        ];
    }
    
    /**
     * Middleware principal de autenticación
     */
    public function authenticate($required_permission = null, $options = []) {
        try {
            // Pre-flight checks
            $this->preFlightChecks();
            
            // Get token from request
            $token = $this->getAuthToken();
            
            if (!$token) {
                // Check if route allows unauthenticated access
                if ($required_permission === self::PERMISSION_PUBLIC) {
                    return null; // Allow public access
                }
                
                $this->respondUnauthorized('Missing authentication token');
                return false;
            }
            
            // Validate JWT token
            $payload = $this->security->validateJWT($token);
            
            if (!$payload) {
                $this->respondUnauthorized('Invalid authentication token');
                return false;
            }
            
            // Get user data
            $user = $this->getUserById($payload['user_id']);
            
            if (!$user) {
                $this->respondUnauthorized('User not found');
                return false;
            }
            
            // Check if user is active
            if (!$this->isUserActive($user)) {
                $this->respondForbidden('Account is deactivated');
                return false;
            }
            
            // Validate permissions
            if ($required_permission && !$this->hasPermission($user, $payload, $required_permission)) {
                $this->respondForbidden('Insufficient permissions');
                return false;
            }
            
            // Additional checks based on options
            if (!empty($options['verified_email']) && !$user['email_verified_at']) {
                $this->respondForbidden('Email verification required');
                return false;
            }
            
            if (!empty($options['verified_phone']) && !$user['phone_verified_at']) {
                $this->respondForbidden('Phone verification required');
                return false;
            }
            
            if (!empty($options['2fa_required']) && !$this->has2FAEnabled($user['id'])) {
                $this->respondForbidden('Two-factor authentication required');
                return false;
            }
            
            // Set user context for the request
            $this->setUserContext($user, $payload);
            
            // Log successful authentication
            $this->logAuthEvent('authentication_success', $user['id']);
            
            return $user;
            
        } catch (\Exception $e) {
            error_log('[AuthMiddleware] Authentication error: ' . $e->getMessage());
            $this->respondInternalError();
            return false;
        }
    }
    
    /**
     * Middleware para proteger rutas específicas
     */
    public function protectRoute($route_config) {
        $protection_level = $route_config['protection'] ?? self::PROTECTION_AUTH;
        $required_role = $route_config['role'] ?? null;
        $required_permissions = $route_config['permissions'] ?? [];
        $options = $route_config['options'] ?? [];
        
        switch ($protection_level) {
            case self::PROTECTION_NONE:
                return $this->authenticate(self::PERMISSION_PUBLIC);
                
            case self::PROTECTION_AUTH:
                return $this->authenticate(self::PERMISSION_AUTHENTICATED, $options);
                
            case self::PROTECTION_VERIFIED:
                $options['verified_email'] = true;
                return $this->authenticate(self::PERMISSION_VERIFIED, $options);
                
            case self::PROTECTION_ROLE:
                if (!$required_role) {
                    throw new \InvalidArgumentException('Role protection requires role specification');
                }
                return $this->authenticate($required_role, $options);
                
            case self::PROTECTION_PERMISSION:
                if (empty($required_permissions)) {
                    throw new \InvalidArgumentException('Permission protection requires permission specification');
                }
                
                $user = $this->authenticate(self::PERMISSION_AUTHENTICATED, $options);
                if (!$user) {
                    return false;
                }
                
                foreach ($required_permissions as $permission) {
                    if (!$this->hasSpecificPermission($user, $permission)) {
                        $this->respondForbidden("Missing permission: {$permission}");
                        return false;
                    }
                }
                
                return $user;
                
            default:
                throw new \InvalidArgumentException('Invalid protection level');
        }
    }
    
    /**
     * Middleware para validar CSRF en requests POST/PUT/DELETE
     */
    public function validateCSRF() {
        if (!$this->config['csrf_protection']) {
            return true;
        }
        
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Only validate CSRF for state-changing methods
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return true;
        }
        
        // Get CSRF token from header or POST data
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? null;
        
        if (!$this->security->validateCSRFToken($token)) {
            $this->respondForbidden('CSRF token validation failed');
            return false;
        }
        
        return true;
    }
    
    /**
     * Middleware para rate limiting
     */
    public function checkRateLimit($identifier = null, $action = 'api', $limit = null) {
        if (!$this->config['rate_limiting']) {
            return true;
        }
        
        $identifier = $identifier ?: $this->getClientIdentifier();
        
        if (!$this->security->checkRateLimit($identifier, $action, $limit)) {
            $this->respondTooManyRequests();
            return false;
        }
        
        return true;
    }
    
    /**
     * Middleware para verificar versión de API
     */
    public function validateAPIVersion() {
        $version_header = $this->config['api_version_header'];
        $required_version = $this->config['required_api_version'];
        
        $client_version = $_SERVER['HTTP_' . str_replace('-', '_', strtoupper($version_header))] ?? null;
        
        if ($client_version && $client_version !== $required_version) {
            $this->respondBadRequest("API version {$required_version} required, got {$client_version}");
            return false;
        }
        
        return true;
    }
    
    /**
     * Middleware para modo mantenimiento
     */
    public function checkMaintenanceMode() {
        if (!$this->config['maintenance_mode']) {
            return true;
        }
        
        // Allow admin users during maintenance
        $user = $this->getCurrentUser();
        if ($user && $user['user_type'] === 'admin') {
            return true;
        }
        
        $this->respondServiceUnavailable('System is under maintenance');
        return false;
    }
    
    /**
     * Middleware para logging de auditoría
     */
    public function auditLog($action, $resource = null, $details = []) {
        $user = $this->getCurrentUser();
        
        $audit_data = [
            'user_id' => $user['id'] ?? null,
            'action' => $action,
            'resource' => $resource,
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? null,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
            'details' => $details,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // Store in audit log
        $this->storeAuditLog($audit_data);
    }
    
    /**
     * Pre-flight security checks
     */
    private function preFlightChecks() {
        // Check HTTPS requirement
        if ($this->config['require_https'] && !$this->isHTTPS()) {
            $this->respondBadRequest('HTTPS required');
            return false;
        }
        
        // Check IP whitelist
        if ($this->config['ip_whitelist'] && !$this->isIPWhitelisted()) {
            $this->respondForbidden('IP not whitelisted');
            return false;
        }
        
        // Check maintenance mode
        if (!$this->checkMaintenanceMode()) {
            return false;
        }
        
        // Validate API version
        if (!$this->validateAPIVersion()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get authentication token from request
     */
    private function getAuthToken() {
        // Try Authorization header first
        $token = $this->security->getBearerToken();
        
        if ($token) {
            return $token;
        }
        
        // Fallback to cookie for web requests
        if (isset($_COOKIE['access_token'])) {
            return $_COOKIE['access_token'];
        }
        
        // Fallback to session for legacy support
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['access_token'])) {
            return $_SESSION['access_token'];
        }
        
        return null;
    }
    
    /**
     * Check if user has required permission
     */
    private function hasPermission($user, $payload, $required_permission) {
        // Always allow public access
        if ($required_permission === self::PERMISSION_PUBLIC) {
            return true;
        }
        
        // Check authenticated access
        if ($required_permission === self::PERMISSION_AUTHENTICATED) {
            return true; // User is already authenticated if we get here
        }
        
        // Check verified access
        if ($required_permission === self::PERMISSION_VERIFIED) {
            return $user['email_verified_at'] !== null;
        }
        
        // Check role-based access
        $user_permissions = $payload['permissions'] ?? [];
        
        switch ($required_permission) {
            case self::PERMISSION_FREELANCER:
                return in_array('freelancer', $user_permissions);
                
            case self::PERMISSION_CLIENT:
                return in_array('client', $user_permissions);
                
            case self::PERMISSION_ADMIN:
                return in_array('admin', $user_permissions);
                
            default:
                // Check if it's a specific permission
                return in_array($required_permission, $user_permissions);
        }
    }
    
    /**
     * Check if user has specific permission
     */
    private function hasSpecificPermission($user, $permission) {
        // Get user permissions from database
        $stmt = $this->db->prepare("
            SELECT permission FROM user_permissions 
            WHERE user_id = ? AND permission = ? AND active = 1
        ");
        $stmt->execute([$user['id'], $permission]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Database and utility methods
     */
    private function getUserById($user_id) {
        $stmt = $this->db->prepare("
            SELECT * FROM users 
            WHERE id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    private function isUserActive($user) {
        return $user['status'] === 'active' && 
               $user['deleted_at'] === null && 
               (!$user['suspended_until'] || strtotime($user['suspended_until']) < time());
    }
    
    private function has2FAEnabled($user_id) {
        $stmt = $this->db->prepare("
            SELECT two_factor_enabled FROM users WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchColumn() == 1;
    }
    
    private function setUserContext($user, $payload) {
        // Set global user context for the request
        $_SESSION['current_user'] = $user;
        $_SESSION['current_payload'] = $payload;
        
        // Set global variables for easy access
        $GLOBALS['current_user'] = $user;
        $GLOBALS['current_user_permissions'] = $payload['permissions'] ?? [];
    }
    
    private function getCurrentUser() {
        return $_SESSION['current_user'] ?? $GLOBALS['current_user'] ?? null;
    }
    
    private function getClientIdentifier() {
        // Prefer user ID if authenticated
        $user = $this->getCurrentUser();
        if ($user) {
            return 'user_' . $user['id'];
        }
        
        // Fallback to IP address
        return 'ip_' . $this->getClientIP();
    }
    
    private function getClientIP() {
        $ip_headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];
        
        foreach ($ip_headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = trim(explode(',', $_SERVER[$header])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function isHTTPS() {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    }
    
    private function isIPWhitelisted() {
        $whitelist = explode(',', $this->config['ip_whitelist']);
        $client_ip = $this->getClientIP();
        
        foreach ($whitelist as $allowed_ip) {
            $allowed_ip = trim($allowed_ip);
            if ($client_ip === $allowed_ip || $this->ipInRange($client_ip, $allowed_ip)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function ipInRange($ip, $range) {
        if (strpos($range, '/') !== false) {
            // CIDR notation
            list($subnet, $mask) = explode('/', $range);
            return (ip2long($ip) & ~((1 << (32 - $mask)) - 1)) === ip2long($subnet);
        }
        
        return $ip === $range;
    }
    
    /**
     * Audit logging
     */
    private function storeAuditLog($audit_data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO audit_logs (
                    user_id, action, resource, ip_address, user_agent, 
                    request_method, request_uri, details, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $audit_data['user_id'],
                $audit_data['action'],
                $audit_data['resource'],
                $audit_data['ip_address'],
                $audit_data['user_agent'],
                $audit_data['request_method'],
                $audit_data['request_uri'],
                json_encode($audit_data['details'])
            ]);
        } catch (\Exception $e) {
            error_log('[AuthMiddleware] Audit log failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Authentication event logging
     */
    private function logAuthEvent($event, $user_id = null, $details = []) {
        $log_data = [
            'event' => $event,
            'user_id' => $user_id,
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'details' => $details,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO auth_logs (event, user_id, ip_address, user_agent, details, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $event,
                $user_id,
                $log_data['ip_address'],
                $log_data['user_agent'],
                json_encode($details)
            ]);
        } catch (\Exception $e) {
            error_log('[AuthMiddleware] Auth log failed: ' . $e->getMessage());
        }
    }
    
    /**
     * HTTP Response methods
     */
    private function respondUnauthorized($message = 'Unauthorized') {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 401
        ]);
        exit;
    }
    
    private function respondForbidden($message = 'Forbidden') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 403
        ]);
        exit;
    }
    
    private function respondBadRequest($message = 'Bad Request') {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 400
        ]);
        exit;
    }
    
    private function respondTooManyRequests($message = 'Too Many Requests') {
        http_response_code(429);
        header('Content-Type: application/json');
        header('Retry-After: 3600'); // 1 hour
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 429,
            'retry_after' => 3600
        ]);
        exit;
    }
    
    private function respondServiceUnavailable($message = 'Service Unavailable') {
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 503
        ]);
        exit;
    }
    
    private function respondInternalError($message = 'Internal Server Error') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => 500
        ]);
        exit;
    }
    
    /**
     * Helper methods for role checking
     */
    public function requireAdmin() {
        return $this->authenticate(self::PERMISSION_ADMIN);
    }
    
    public function requireFreelancer() {
        return $this->authenticate(self::PERMISSION_FREELANCER);
    }
    
    public function requireClient() {
        return $this->authenticate(self::PERMISSION_CLIENT);
    }
    
    public function requireVerified() {
        return $this->authenticate(self::PERMISSION_VERIFIED);
    }
    
    public function requireAuthenticated() {
        return $this->authenticate(self::PERMISSION_AUTHENTICATED);
    }
    
    /**
     * Utility methods for permission checking in controllers
     */
    public function can($permission) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        return $this->hasSpecificPermission($user, $permission);
    }
    
    public function isRole($role) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        return $user['user_type'] === $role;
    }
    
    public function isOwner($resource_user_id) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        return $user['id'] === $resource_user_id;
    }
    
    public function isAdminOrOwner($resource_user_id) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        return $user['user_type'] === 'admin' || $user['id'] === $resource_user_id;
    }
    
    /**
     * Session management for web interface
     */
    public function loginUser($user, $remember_me = false) {
        // Create JWT session
        $session_data = $this->security->createSession($user);
        
        // Set cookies for web interface
        $cookie_options = [
            'expires' => time() + ($remember_me ? 30 * 24 * 3600 : 3600), // 30 days or 1 hour
            'path' => '/',
            'domain' => $_SERVER['HTTP_HOST'] ?? '',
            'secure' => $this->isHTTPS(),
            'httponly' => true,
            'samesite' => 'Strict'
        ];
        
        setcookie('access_token', $session_data['access_token'], $cookie_options);
        
        if ($remember_me) {
            setcookie('refresh_token', $session_data['refresh_token'], [
                'expires' => time() + (30 * 24 * 3600), // 30 days
                'path' => '/',
                'domain' => $_SERVER['HTTP_HOST'] ?? '',
                'secure' => $this->isHTTPS(),
                'httponly' => true,
                'samesite' => 'Strict'
            ]);
        }
        
        // Set session data
        $this->setUserContext($user, [
            'user_id' => $user['id'],
            'session_id' => $session_data['session_id'],
            'user_type' => $user['user_type'],
            'permissions' => $this->security->getUserPermissions($user)
        ]);
        
        // Log successful login
        $this->logAuthEvent('login_success', $user['id']);
        
        return $session_data;
    }
    
    public function logoutUser() {
        $user = $this->getCurrentUser();
        
        // Get current token and blacklist it
        $token = $this->getAuthToken();
        if ($token) {
            $this->security->blacklistToken($token);
        }
        
        // Clear cookies
        setcookie('access_token', '', time() - 3600, '/');
        setcookie('refresh_token', '', time() - 3600, '/');
        
        // Clear session
        session_destroy();
        
        // Log logout
        if ($user) {
            $this->logAuthEvent('logout', $user['id']);
        }
        
        return true;
    }
}
?>