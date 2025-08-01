<?php
/**
 * RateLimiter - Redis-based Rate Limiting
 * LaburAR Complete Platform
 * 
 * Implements sliding window rate limiting with Redis
 * Supports different limits for different endpoints
 */

class RateLimiter
{
    private $redis;
    
    // Rate limiting rules (requests per minute)
    private const RATE_LIMITS = [
        'login' => 5,           // 5 login attempts per minute
        'register' => 3,        // 3 registrations per minute
        'password_reset' => 2,  // 2 password resets per minute
        'verify_email' => 10,   // 10 email verifications per minute
        'api_general' => 100,   // 100 general API calls per minute
        'upload' => 20          // 20 file uploads per minute
    ];
    
    private const WINDOW_SIZE = 60; // 1 minute window
    private const PREFIX = 'laburar:ratelimit:';
    
    public function __construct()
    {
        $this->redis = new Redis();
        $this->redis->connect(
            $_ENV['REDIS_HOST'] ?? '127.0.0.1',
            $_ENV['REDIS_PORT'] ?? 6379
        );
    }
    
    /**
     * Check if request is within rate limit
     */
    public function checkLimit($endpoint = 'api_general', $identifier = null)
    {
        $identifier = $identifier ?: $this->getClientIdentifier();
        $limit = self::RATE_LIMITS[$endpoint] ?? self::RATE_LIMITS['api_general'];
        
        $key = self::PREFIX . $endpoint . ':' . $identifier;
        $current = time();
        $window_start = $current - self::WINDOW_SIZE;
        
        // Remove expired entries
        $this->redis->zremrangebyscore($key, 0, $window_start);
        
        // Count current requests in window
        $current_requests = $this->redis->zcard($key);
        
        if ($current_requests >= $limit) {
            return false;
        }
        
        // Add current request
        $this->redis->zadd($key, $current, uniqid($current, true));
        $this->redis->expire($key, self::WINDOW_SIZE);
        
        return true;
    }
    
    /**
     * Get remaining requests for endpoint
     */
    public function getRemainingRequests($endpoint = 'api_general', $identifier = null)
    {
        $identifier = $identifier ?: $this->getClientIdentifier();
        $limit = self::RATE_LIMITS[$endpoint] ?? self::RATE_LIMITS['api_general'];
        
        $key = self::PREFIX . $endpoint . ':' . $identifier;
        $current = time();
        $window_start = $current - self::WINDOW_SIZE;
        
        // Clean expired entries
        $this->redis->zremrangebyscore($key, 0, $window_start);
        
        // Count current requests
        $current_requests = $this->redis->zcard($key);
        
        return max(0, $limit - $current_requests);
    }
    
    /**
     * Get time until rate limit resets
     */
    public function getResetTime($endpoint = 'api_general', $identifier = null)
    {
        $identifier = $identifier ?: $this->getClientIdentifier();
        $key = self::PREFIX . $endpoint . ':' . $identifier;
        
        // Get oldest entry in current window
        $oldest = $this->redis->zrange($key, 0, 0, ['WITHSCORES' => true]);
        
        if (empty($oldest)) {
            return 0;
        }
        
        $oldest_time = array_values($oldest)[0];
        $reset_time = $oldest_time + self::WINDOW_SIZE;
        
        return max(0, $reset_time - time());
    }
    
    /**
     * Block IP address temporarily
     */
    public function blockIP($ip, $duration = 3600)
    {
        $key = self::PREFIX . 'blocked:' . $ip;
        $this->redis->setex($key, $duration, time());
    }
    
    /**
     * Check if IP is blocked
     */
    public function isBlocked($ip = null)
    {
        $ip = $ip ?: $_SERVER['REMOTE_ADDR'];
        $key = self::PREFIX . 'blocked:' . $ip;
        return $this->redis->exists($key);
    }
    
    /**
     * Get client identifier (IP + User Agent hash)
     */
    private function getClientIdentifier()
    {
        $ip = $_SERVER['REMOTE_ADDR'];
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        return $ip . ':' . substr(md5($userAgent), 0, 8);
    }
    
    /**
     * Get rate limit headers for HTTP response
     */
    public function getRateLimitHeaders($endpoint = 'api_general', $identifier = null)
    {
        $limit = self::RATE_LIMITS[$endpoint] ?? self::RATE_LIMITS['api_general'];
        $remaining = $this->getRemainingRequests($endpoint, $identifier);
        $reset = time() + $this->getResetTime($endpoint, $identifier);
        
        return [
            'X-RateLimit-Limit' => $limit,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => $reset,
            'X-RateLimit-Window' => self::WINDOW_SIZE
        ];
    }
    
    /**
     * Add rate limit headers to response
     */
    public function addHeaders($endpoint = 'api_general', $identifier = null)
    {
        $headers = $this->getRateLimitHeaders($endpoint, $identifier);
        
        foreach ($headers as $name => $value) {
            header("$name: $value");
        }
    }
}
?>