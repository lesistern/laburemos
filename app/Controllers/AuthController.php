<?php
/**
 * AuthController - Enterprise Authentication System
 * LaburAR Complete Platform
 * 
 * Handles all authentication-related operations:
 * - Registration (dual flow: freelancers/clients)
 * - Login with 2FA support
 * - Password reset and recovery
 * - Email/phone verification
 * - Session management with Redis
 * - JWT token generation and validation
 * - CSRF protection
 * - Rate limiting and security monitoring
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Freelancer.php';
require_once __DIR__ . '/../models/Client.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/EmailService.php';

class AuthController
{
    private $db;
    private $security;
    private $validator;
    private $emailService;
    private $rateLimiter;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->security = SecurityHelper::getInstance(); // Use singleton for better performance
        $this->validator = new ValidationHelper();
        $this->emailService = new EmailService();
        $this->rateLimiter = new RateLimiter();
    }
    
    /**
     * Handle incoming API requests
     */
    public function handleRequest(): void
    {
        // Input validation first (fastest check)
        $action = $_GET['action'] ?? '';
        if (empty($action)) {
            $this->sendErrorResponse(400, 'Action parameter required');
            return;
        }
        
        // Rate limiting (check before expensive operations)
        if (!$this->rateLimiter->checkLimit($this->getClientIP(), $action)) {
            $this->sendErrorResponse(429, 'Too many requests. Please try again later.');
            return;
        }
        
        // CSRF Protection (for state-changing operations)
        if (in_array($action, ['register', 'login', 'logout', 'enable-2fa'])) {
            if (!$this->security->validateCSRFToken()) {
                $this->sendErrorResponse(403, 'CSRF token validation failed');
                return;
            }
        }
        
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'register':
                    if ($method === 'POST') {
                        $this->register();
                    }
                    break;
                    
                case 'login':
                    if ($method === 'POST') {
                        $this->login();
                    }
                    break;
                    
                case 'logout':
                    if ($method === 'POST') {
                        $this->logout();
                    }
                    break;
                    
                case 'verify-email':
                    if ($method === 'POST') {
                        $this->verifyEmail();
                    }
                    break;
                    
                case 'verify-phone':
                    if ($method === 'POST') {
                        $this->verifyPhone();
                    }
                    break;
                    
                case 'resend-verification':
                    if ($method === 'POST') {
                        $this->resendVerification();
                    }
                    break;
                    
                case 'forgot-password':
                    if ($method === 'POST') {
                        $this->forgotPassword();
                    }
                    break;
                    
                case 'reset-password':
                    if ($method === 'POST') {
                        $this->resetPassword();
                    }
                    break;
                    
                case 'enable-2fa':
                    if ($method === 'POST') {
                        $this->enableTwoFactor();
                    }
                    break;
                    
                case 'verify-2fa':
                    if ($method === 'POST') {
                        $this->verifyTwoFactor();
                    }
                    break;
                    
                case 'disable-2fa':
                    if ($method === 'POST') {
                        $this->disableTwoFactor();
                    }
                    break;
                    
                case 'refresh-token':
                    if ($method === 'POST') {
                        $this->refreshToken();
                    }
                    break;
                    
                default:
                    $this->sendErrorResponse(404, 'Endpoint not found');
            }
        } catch (Exception $e) {
            $this->logError($e);
            $this->sendErrorResponse(500, 'Internal server error');
        }
    }
    
    /**
     * Register new user (freelancer or client)
     */
    private function register()
    {
        $input = $this->getJSONInput();
        
        // Validate required fields
        $requiredFields = ['email', 'password', 'user_type', 'first_name', 'last_name'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->sendErrorResponse(400, "Field '$field' is required");
                return;
            }
        }
        
        // Validate email
        if (!$this->validator->validateEmail($input['email'])) {
            $this->sendErrorResponse(400, 'Invalid email format');
            return;
        }
        
        // Validate password strength
        $passwordValidation = $this->validator->validatePassword($input['password']);
        if (!$passwordValidation['valid']) {
            $this->sendErrorResponse(400, $passwordValidation['message']);
            return;
        }
        
        // Validate user type
        if (!in_array($input['user_type'], ['freelancer', 'client'])) {
            $this->sendErrorResponse(400, 'Invalid user type. Must be "freelancer" or "client"');
            return;
        }
        
        // Check if email already exists
        $existingUser = User::where('email', $input['email'])->first();
        if ($existingUser) {
            $this->sendErrorResponse(400, 'Email already registered');
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Use more secure password hashing
            $passwordHash = password_hash($input['password'], PASSWORD_ARGON2ID, [
                'memory_cost' => 65536, // 64 MB
                'time_cost' => 4,       // 4 iterations
                'threads' => 3          // 3 threads
            ]);
            
            // Create user with optimized data structure
            $userData = [
                'email' => filter_var($input['email'], FILTER_SANITIZE_EMAIL),
                'password' => $passwordHash,
                'user_type' => $input['user_type'],
                'first_name' => htmlspecialchars($input['first_name'], ENT_QUOTES, 'UTF-8'),
                'last_name' => htmlspecialchars($input['last_name'], ENT_QUOTES, 'UTF-8'),
                'phone' => isset($input['phone']) ? preg_replace('/[^0-9+\-\s()]/', '', $input['phone']) : null,
                'email_verification_token' => $this->security->generateSecureToken(32),
                'email_verified_at' => null,
                'registration_ip' => $this->getClientIP(),
                'last_activity' => gmdate('Y-m-d H:i:s'), // Use GMT for consistency
                'status' => 'pending_verification'
            ];
            
            $user = User::create($userData);
            
            // Create profile based on user type
            if ($input['user_type'] === 'freelancer') {
                $this->createFreelancerProfile($user, $input);
            } else {
                $this->createClientProfile($user, $input);
            }
            
            // Send verification email
            $this->emailService->sendVerificationEmail($user);
            
            // Log registration
            $this->logActivity($user->id, 'user_registered', 'user', $user->id, [
                'user_type' => $input['user_type'],
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            $this->db->commit();
            
            $this->sendSuccessResponse([
                'message' => 'Registration successful. Please check your email for verification.',
                'user_id' => $user->id,
                'email' => $user->email,
                'verification_required' => true
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * User login with 2FA support
     */
    private function login()
    {
        $input = $this->getJSONInput();
        
        if (empty($input['email']) || empty($input['password'])) {
            $this->sendErrorResponse(400, 'Email and password are required');
            return;
        }
        
        // Find user
        $user = User::where('email', $input['email'])->first();
        if (!$user) {
            $this->logFailedLogin($input['email'], 'user_not_found');
            $this->sendErrorResponse(401, 'Invalid credentials');
            return;
        }
        
        // Check account status
        if ($user->status === 'suspended') {
            $this->logFailedLogin($input['email'], 'account_suspended');
            $this->sendErrorResponse(403, 'Account suspended. Please contact support.');
            return;
        }
        
        // Verify password
        if (!password_verify($input['password'], $user->password)) {
            $this->logFailedLogin($input['email'], 'invalid_password');
            $user->incrementFailedLogins();
            $this->sendErrorResponse(401, 'Invalid credentials');
            return;
        }
        
        // Check if email is verified
        if (!$user->email_verified_at) {
            $this->sendErrorResponse(403, 'Email not verified. Please check your email.');
            return;
        }
        
        // Check 2FA if enabled
        if ($user->two_factor_enabled) {
            if (empty($input['two_factor_code'])) {
                $this->sendErrorResponse(200, [
                    'requires_2fa' => true,
                    'message' => 'Two-factor authentication required'
                ]);
                return;
            }
            
            if (!$this->security->verifyTOTP($user->two_factor_secret, $input['two_factor_code'])) {
                $this->logFailedLogin($input['email'], 'invalid_2fa');
                $this->sendErrorResponse(401, 'Invalid two-factor authentication code');
                return;
            }
        }
        
        // Generate session and tokens
        $sessionData = $this->security->createSession($user);
        
        // Update user login info
        $user->last_login = date('Y-m-d H:i:s');
        $user->last_activity = date('Y-m-d H:i:s');
        $user->login_ip = $_SERVER['REMOTE_ADDR'];
        $user->failed_login_attempts = 0; // Reset on successful login
        $user->save();
        
        // Log successful login
        $this->logActivity($user->id, 'user_login', 'user', $user->id, [
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            '2fa_used' => $user->two_factor_enabled
        ]);
        
        $this->sendSuccessResponse([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'avatar_url' => $user->avatar_url,
                'profile_complete' => $this->checkProfileCompleteness($user)
            ],
            'tokens' => [
                'access_token' => $sessionData['access_token'],
                'refresh_token' => $sessionData['refresh_token'],
                'expires_in' => 3600 // 1 hour
            ]
        ]);
    }
    
    /**
     * Logout user and invalidate session
     */
    private function logout()
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            $this->sendErrorResponse(401, 'Not authenticated');
            return;
        }
        
        // Invalidate session
        $this->security->invalidateSession($user->id);
        
        // Log logout
        $this->logActivity($user->id, 'user_logout', 'user', $user->id);
        
        $this->sendSuccessResponse(['message' => 'Logout successful']);
    }
    
    /**
     * Verify email address
     */
    private function verifyEmail()
    {
        $input = $this->getJSONInput();
        
        if (empty($input['token'])) {
            $this->sendErrorResponse(400, 'Verification token is required');
            return;
        }
        
        $user = User::where('email_verification_token', $input['token'])->first();
        if (!$user) {
            $this->sendErrorResponse(400, 'Invalid or expired verification token');
            return;
        }
        
        // Update user
        $user->email_verified_at = date('Y-m-d H:i:s');
        $user->email_verification_token = null;
        $user->status = 'active';
        $user->save();
        
        // Log verification
        $this->logActivity($user->id, 'email_verified', 'user', $user->id);
        
        $this->sendSuccessResponse([
            'message' => 'Email verified successfully',
            'user_id' => $user->id
        ]);
    }
    
    /**
     * Forgot password - send reset email
     */
    private function forgotPassword()
    {
        $input = $this->getJSONInput();
        
        if (empty($input['email'])) {
            $this->sendErrorResponse(400, 'Email is required');
            return;
        }
        
        $user = User::where('email', $input['email'])->first();
        if (!$user) {
            // Don't reveal if email exists
            $this->sendSuccessResponse([
                'message' => 'If the email exists, a reset link has been sent.'
            ]);
            return;
        }
        
        // Generate reset token
        $resetToken = $this->security->generateSecureToken();
        $user->password_reset_token = $resetToken;
        $user->password_reset_expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $user->save();
        
        // Send reset email
        $this->emailService->sendPasswordResetEmail($user, $resetToken);
        
        // Log password reset request
        $this->logActivity($user->id, 'password_reset_requested', 'user', $user->id);
        
        $this->sendSuccessResponse([
            'message' => 'If the email exists, a reset link has been sent.'
        ]);
    }
    
    /**
     * Reset password with token
     */
    private function resetPassword()
    {
        $input = $this->getJSONInput();
        
        if (empty($input['token']) || empty($input['password'])) {
            $this->sendErrorResponse(400, 'Token and new password are required');
            return;
        }
        
        // Validate password strength
        $passwordValidation = $this->validator->validatePassword($input['password']);
        if (!$passwordValidation['valid']) {
            $this->sendErrorResponse(400, $passwordValidation['message']);
            return;
        }
        
        $user = User::where('password_reset_token', $input['token'])
                   ->where('password_reset_expires', '>', date('Y-m-d H:i:s'))
                   ->first();
        
        if (!$user) {
            $this->sendErrorResponse(400, 'Invalid or expired reset token');
            return;
        }
        
        // Update password
        $user->password = password_hash($input['password'], PASSWORD_DEFAULT);
        $user->password_reset_token = null;
        $user->password_reset_expires = null;
        $user->save();
        
        // Invalidate all sessions
        $this->security->invalidateAllSessions($user->id);
        
        // Log password reset
        $this->logActivity($user->id, 'password_reset_completed', 'user', $user->id);
        
        $this->sendSuccessResponse([
            'message' => 'Password reset successful. Please login with your new password.'
        ]);
    }
    
    /**
     * Enable Two-Factor Authentication
     */
    private function enableTwoFactor()
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            $this->sendErrorResponse(401, 'Not authenticated');
            return;
        }
        
        $input = $this->getJSONInput();
        
        if (empty($input['verification_code'])) {
            // Generate new secret and send QR code
            $secret = $this->security->generateTOTPSecret();
            $qrCode = $this->security->generateQRCode($user->email, $secret);
            
            $this->sendSuccessResponse([
                'secret' => $secret,
                'qr_code' => $qrCode,
                'backup_codes' => $this->security->generateBackupCodes()
            ]);
            return;
        }
        
        // Verify the code before enabling
        if (empty($input['secret']) || !$this->security->verifyTOTP($input['secret'], $input['verification_code'])) {
            $this->sendErrorResponse(400, 'Invalid verification code');
            return;
        }
        
        // Enable 2FA
        $user->two_factor_enabled = true;
        $user->two_factor_secret = $input['secret'];
        $user->two_factor_backup_codes = json_encode($input['backup_codes'] ?? []);
        $user->save();
        
        // Log 2FA enabled
        $this->logActivity($user->id, '2fa_enabled', 'user', $user->id);
        
        $this->sendSuccessResponse([
            'message' => 'Two-factor authentication enabled successfully'
        ]);
    }
    
    /**
     * Helper: Create freelancer profile
     */
    private function createFreelancerProfile($user, $input)
    {
        $profileData = [
            'user_id' => $user->id,
            'professional_title' => $input['professional_title'] ?? '',
            'hourly_rate' => $input['hourly_rate'] ?? null,
            'bio' => $input['bio'] ?? '',
            'experience_level' => $input['experience_level'] ?? 'beginner',
            'availability_status' => 'available',
            'response_time_hours' => 24
        ];
        
        return Freelancer::create($profileData);
    }
    
    /**
     * Helper: Create client profile
     */
    private function createClientProfile($user, $input)
    {
        $profileData = [
            'user_id' => $user->id,
            'company_name' => $input['company_name'] ?? '',
            'industry' => $input['industry'] ?? '',
            'company_size' => $input['company_size'] ?? '',
            'website' => $input['website'] ?? ''
        ];
        
        return Client::create($profileData);
    }
    
    /**
     * Helper: Get authenticated user from JWT token
     */
    private function getAuthenticatedUser()
    {
        $token = $this->security->getBearerToken();
        if (!$token) {
            return null;
        }
        
        $payload = $this->security->validateJWT($token);
        if (!$payload) {
            return null;
        }
        
        return User::find($payload['user_id']);
    }
    
    /**
     * Helper: Get JSON input with validation
     */
    private function getJSONInput(): array
    {
        static $cachedInput = null;
        
        if ($cachedInput !== null) {
            return $cachedInput;
        }
        
        $rawInput = file_get_contents('php://input');
        if (empty($rawInput)) {
            return $cachedInput = [];
        }
        
        $input = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('JSON decode error: ' . json_last_error_msg());
            return $cachedInput = [];
        }
        
        return $cachedInput = $input ?: [];
    }
    
    /**
     * Helper: Send success response
     */
    private function sendSuccessResponse(array $data): void
    {
        // Set security headers
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        
        $response = [
            'success' => true,
            'data' => $data,
            'timestamp' => gmdate('c'), // Use GMT
            'request_id' => uniqid('req_', true)
        ];
        
        echo json_encode($response, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Helper: Send error response
     */
    private function sendErrorResponse(int $status, string $message): void
    {
        http_response_code($status);
        
        // Set security headers
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        
        $response = [
            'success' => false,
            'error' => $message,
            'error_code' => $this->getErrorCode($status),
            'timestamp' => gmdate('c'),
            'request_id' => uniqid('req_', true)
        ];
        
        // Log error for monitoring
        error_log(sprintf('[AuthController] Error %d: %s', $status, $message));
        
        echo json_encode($response, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Helper: Log activity to audit trail
     */
    private function logActivity($userId, $action, $resourceType, $resourceId, $context = [])
    {
        AuditLog::create([
            'user_id' => $userId,
            'session_id' => session_id(),
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'context' => json_encode($context),
            'severity' => 'info',
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Helper: Log failed login attempts
     */
    private function logFailedLogin($email, $reason)
    {
        AuditLog::create([
            'user_id' => null,
            'session_id' => session_id(),
            'action' => 'login_failed',
            'resource_type' => 'user',
            'resource_id' => null,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_method' => 'POST',
            'request_uri' => $_SERVER['REQUEST_URI'],
            'context' => json_encode([
                'email' => $email,
                'reason' => $reason
            ]),
            'severity' => 'warning',
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Helper: Log errors
     */
    private function logError($exception)
    {
        error_log('[AuthController] ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());
        
        AuditLog::create([
            'user_id' => null,
            'session_id' => session_id(),
            'action' => 'system_error',
            'resource_type' => 'system',
            'resource_id' => null,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'context' => json_encode([
                'error' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine()
            ]),
            'severity' => 'error',
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Helper: Check if user profile is complete
     */
    private function checkProfileCompleteness($user): bool
    {
        static $cache = [];
        
        // Use caching to avoid repeated database queries
        $cacheKey = $user->id . '_' . $user->updated_at;
        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }
        
        $required = ['first_name', 'last_name', 'email_verified_at'];
        
        foreach ($required as $field) {
            if (empty($user->$field)) {
                return $cache[$cacheKey] = false;
            }
        }
        
        // Check profile-specific requirements with optimized queries
        if ($user->user_type === 'freelancer') {
            $hasProfile = Freelancer::where('user_id', $user->id)
                ->whereNotNull('professional_title')
                ->where('professional_title', '!=', '')
                ->exists();
            return $cache[$cacheKey] = $hasProfile;
        } else {
            $hasProfile = Client::where('user_id', $user->id)
                ->whereNotNull('company_name')
                ->where('company_name', '!=', '')
                ->exists();
            return $cache[$cacheKey] = $hasProfile;
        }
    }
}

    /**
     * Helper: Get client IP address with proxy support
     */
    private function getClientIP(): string
    {
        $ipHeaders = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP', 
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipHeaders as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = trim(explode(',', $_SERVER[$header])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Helper: Get error code from HTTP status
     */
    private function getErrorCode(int $status): string
    {
        $errorCodes = [
            400 => 'INVALID_REQUEST',
            401 => 'UNAUTHORIZED',
            403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',
            429 => 'RATE_LIMITED',
            500 => 'INTERNAL_ERROR'
        ];
        
        return $errorCodes[$status] ?? 'UNKNOWN_ERROR';
    }
}

// Handle requests if called directly with error handling
if ($_SERVER['REQUEST_METHOD'] !== 'GET' || isset($_GET['action'])) {
    try {
        $controller = new AuthController();
        $controller->handleRequest();
    } catch (Throwable $e) {
        error_log('[AuthController] Fatal error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error',
            'error_code' => 'FATAL_ERROR',
            'timestamp' => gmdate('c'),
            'request_id' => uniqid('req_', true)
        ]);
    }
}
?>