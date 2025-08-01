<?php
/**
 * LaburAR - Authentication Middleware
 * Handles JWT token validation and user authentication
 */

namespace LaburAR\Middleware;

use LaburAR\Core\Request;
use LaburAR\Core\Response;
use LaburAR\Services\SecurityHelper;
use LaburAR\Models\User;

class AuthMiddleware
{
    private SecurityHelper $security;
    
    public function __construct()
    {
        $this->security = SecurityHelper::getInstance();
    }
    
    /**
     * Handle authentication middleware
     */
    public function handle(Request $request, Response $response, callable $next): void
    {
        // Skip authentication for public endpoints
        if ($this->isPublicEndpoint($request->getPath())) {
            $next();
            return;
        }
        
        try {
            // Get authorization header
            $authHeader = $request->header('Authorization');
            
            if (!$authHeader) {
                $response->unauthorized('Authorization header missing');
                return;
            }
            
            // Extract token from Bearer header
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $response->unauthorized('Invalid authorization format');
                return;
            }
            
            $token = $matches[1];
            
            // Validate JWT token
            $payload = $this->security->validateJWT($token);
            
            if (!$payload) {
                $response->unauthorized('Invalid or expired token');
                return;
            }
            
            // Get user from token payload
            $user = User::find($payload['user_id']);
            
            if (!$user) {
                $response->unauthorized('User not found');
                return;
            }
            
            // Check if user is active
            if ($user->status !== 'active') {
                $response->forbidden('User account is not active');
                return;
            }
            
            // Add user to request context
            $request->setUser($user);
            
            // Update last activity
            $this->updateLastActivity($user);
            
            // Continue to next middleware/handler
            $next();
            
        } catch (\Exception $e) {
            logger('Authentication error: ' . $e->getMessage(), 'error');
            $response->unauthorized('Authentication failed');
        }
    }
    
    /**
     * Check if endpoint is public (no auth required)
     */
    private function isPublicEndpoint(string $path): bool
    {
        $publicEndpoints = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/verify-email',
            '/api/public/',
            '/api/health',
            '/api/csrf-token'
        ];
        
        foreach ($publicEndpoints as $endpoint) {
            if (strpos($path, $endpoint) === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Update user's last activity timestamp
     */
    private function updateLastActivity(User $user): void
    {
        // Only update if last activity was more than 5 minutes ago
        $lastActivity = $user->last_activity ? strtotime($user->last_activity) : 0;
        $now = time();
        
        if (($now - $lastActivity) > 300) { // 5 minutes
            $user->last_activity = date('Y-m-d H:i:s', $now);
            $user->save();
        }
    }
    
    /**
     * Middleware for admin-only endpoints
     */
    public function adminOnly(Request $request, Response $response, callable $next): void
    {
        // First run regular auth
        $this->handle($request, $response, function() use ($request, $response, $next) {
            $user = $request->getUser();
            
            // Check if user has admin role
            if (!$user || $user->user_type !== 'admin') {
                $response->forbidden('Admin access required');
                return;
            }
            
            $next();
        });
    }
    
    /**
     * Middleware for freelancer-only endpoints
     */
    public function freelancerOnly(Request $request, Response $response, callable $next): void
    {
        $this->handle($request, $response, function() use ($request, $response, $next) {
            $user = $request->getUser();
            
            if (!$user || $user->user_type !== 'freelancer') {
                $response->forbidden('Freelancer access required');
                return;
            }
            
            $next();
        });
    }
    
    /**
     * Middleware for client-only endpoints
     */
    public function clientOnly(Request $request, Response $response, callable $next): void
    {
        $this->handle($request, $response, function() use ($request, $response, $next) {
            $user = $request->getUser();
            
            if (!$user || $user->user_type !== 'client') {
                $response->forbidden('Client access required');
                return;
            }
            
            $next();
        });
    }
    
    /**
     * Middleware for verified users only
     */
    public function verifiedOnly(Request $request, Response $response, callable $next): void
    {
        $this->handle($request, $response, function() use ($request, $response, $next) {
            $user = $request->getUser();
            
            if (!$user || !$user->email_verified_at) {
                $response->forbidden('Email verification required');
                return;
            }
            
            $next();
        });
    }
    
    /**
     * Rate limiting middleware
     */
    public function rateLimit(int $maxAttempts = 60, int $timeWindow = 60): callable
    {
        return function(Request $request, Response $response, callable $next) use ($maxAttempts, $timeWindow) {
            $key = 'rate_limit:' . $request->ip() . ':' . date('Y-m-d-H-i');
            
            // Get current attempt count
            $attempts = cache_remember($key, $timeWindow, function() {
                return 0;
            });
            
            if ($attempts >= $maxAttempts) {
                $response->json([
                    'error' => 'Rate limit exceeded',
                    'error_code' => 'RATE_LIMITED',
                    'retry_after' => $timeWindow
                ], 429);
                return;
            }
            
            // Increment attempt count
            cache_remember($key, $timeWindow, function() use ($attempts) {
                return $attempts + 1;
            });
            
            $next();
        };
    }
}