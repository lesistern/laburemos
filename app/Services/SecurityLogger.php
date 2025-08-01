<?php
/**
 * Advanced Security Logger
 * Structured logging for security events with analysis capabilities
 */

namespace LaburAR\Services;

class SecurityLogger {
    private $logPath;
    private $maxFileSize;
    private $retention;
    private $config;
    
    public function __construct() {
        require_once __DIR__ . '/../../config/secure_config.php';
        $this->config = \SecureConfig::getInstance();
        
        $this->logPath = __DIR__ . '/../../logs/security/';
        $this->maxFileSize = 10 * 1024 * 1024; // 10MB
        $this->retention = 90; // days
        
        $this->ensureLogDirectory();
    }
    
    /**
     * Log security event with structured data
     */
    public function logEvent($event, $level = 'info', $data = []) {
        $logEntry = [
            'timestamp' => date('c'),
            'event' => $event,
            'level' => $level,
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'cli',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'CLI',
            'session_id' => session_id() ?: 'no-session',
            'user_id' => $_SESSION['user_id'] ?? null,
            'data' => $this->sanitizeLogData($data),
            'server' => gethostname(),
            'process_id' => getmypid()
        ];
        
        // Add geo location if available
        $geoData = $this->getGeoLocation($logEntry['ip']);
        if ($geoData) {
            $logEntry['geo'] = $geoData;
        }
        
        // Add threat score
        $logEntry['threat_score'] = $this->calculateThreatScore($logEntry);
        
        $this->writeLog($event, $logEntry);
        
        // Send alert for high-severity events
        if (in_array($level, ['critical', 'alert', 'emergency']) || $logEntry['threat_score'] >= 8) {
            $this->sendAlert($logEntry);
        }
    }
    
    /**
     * Log login attempt
     */
    public function logLogin($userId, $email, $success, $method = 'password') {
        $this->logEvent('login_attempt', $success ? 'info' : 'warning', [
            'user_id' => $userId,
            'email' => $this->maskEmail($email),
            'success' => $success,
            'method' => $method,
            'failed_attempts' => $this->getFailedAttempts($email)
        ]);
    }
    
    /**
     * Log API access
     */
    public function logAPIAccess($endpoint, $method, $responseCode, $responseTime = null) {
        $level = 'info';
        if ($responseCode >= 400) {
            $level = $responseCode >= 500 ? 'error' : 'warning';
        }
        
        $this->logEvent('api_access', $level, [
            'endpoint' => $endpoint,
            'method' => $method,
            'response_code' => $responseCode,
            'response_time' => $responseTime,
            'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 0
        ]);
    }
    
    /**
     * Log security violation
     */
    public function logViolation($type, $description, $severity = 'high') {
        $this->logEvent('security_violation', 'alert', [
            'violation_type' => $type,
            'description' => $description,
            'severity' => $severity,
            'blocked' => true
        ]);
    }
    
    /**
     * Log data access (for GDPR compliance)
     */
    public function logDataAccess($userId, $dataType, $action, $recordId = null) {
        $this->logEvent('data_access', 'info', [
            'target_user_id' => $userId,
            'data_type' => $dataType,
            'action' => $action,
            'record_id' => $recordId,
            'compliance' => 'gdpr'
        ]);
    }
    
    /**
     * Get security metrics for dashboard
     */
    public function getSecurityMetrics($hours = 24) {
        $logFiles = glob($this->logPath . 'security_*.log');
        $metrics = [
            'total_events' => 0,
            'threats_blocked' => 0,
            'failed_logins' => 0,
            'api_errors' => 0,
            'unique_ips' => [],
            'top_threats' => [],
            'hourly_distribution' => array_fill(0, 24, 0)
        ];
        
        $cutoffTime = time() - ($hours * 3600);
        
        foreach ($logFiles as $file) {
            $handle = fopen($file, 'r');
            if (!$handle) continue;
            
            while (($line = fgets($handle)) !== false) {
                $entry = json_decode($line, true);
                if (!$entry || strtotime($entry['timestamp']) < $cutoffTime) {
                    continue;
                }
                
                $metrics['total_events']++;
                $metrics['unique_ips'][$entry['ip']] = true;
                
                // Count by event type
                switch ($entry['event']) {
                    case 'security_violation':
                        $metrics['threats_blocked']++;
                        $violationType = $entry['data']['violation_type'] ?? 'unknown';
                        $metrics['top_threats'][$violationType] = 
                            ($metrics['top_threats'][$violationType] ?? 0) + 1;
                        break;
                        
                    case 'login_attempt':
                        if (!$entry['data']['success']) {
                            $metrics['failed_logins']++;
                        }
                        break;
                        
                    case 'api_access':
                        if ($entry['data']['response_code'] >= 400) {
                            $metrics['api_errors']++;
                        }
                        break;
                }
                
                // Hourly distribution
                $hour = (int) date('H', strtotime($entry['timestamp']));
                $metrics['hourly_distribution'][$hour]++;
            }
            
            fclose($handle);
        }
        
        $metrics['unique_ips'] = count($metrics['unique_ips']);
        arsort($metrics['top_threats']);
        
        return $metrics;
    }
    
    /**
     * Analyze security patterns
     */
    public function analyzeThreats($days = 7) {
        $analysis = [
            'suspicious_ips' => [],
            'attack_patterns' => [],
            'recommendations' => []
        ];
        
        $logFiles = glob($this->logPath . 'security_*.log');
        $cutoffTime = time() - ($days * 24 * 3600);
        $ipStats = [];
        
        foreach ($logFiles as $file) {
            $handle = fopen($file, 'r');
            if (!$handle) continue;
            
            while (($line = fgets($handle)) !== false) {
                $entry = json_decode($line, true);
                if (!$entry || strtotime($entry['timestamp']) < $cutoffTime) {
                    continue;
                }
                
                $ip = $entry['ip'];
                
                if (!isset($ipStats[$ip])) {
                    $ipStats[$ip] = [
                        'requests' => 0,
                        'violations' => 0,
                        'failed_logins' => 0,
                        'countries' => [],
                        'user_agents' => [],
                        'threat_score' => 0
                    ];
                }
                
                $ipStats[$ip]['requests']++;
                $ipStats[$ip]['threat_score'] += $entry['threat_score'] ?? 0;
                
                if (isset($entry['geo']['country'])) {
                    $ipStats[$ip]['countries'][$entry['geo']['country']] = true;
                }
                
                $ipStats[$ip]['user_agents'][$entry['user_agent']] = true;
                
                if ($entry['event'] === 'security_violation') {
                    $ipStats[$ip]['violations']++;
                }
                
                if ($entry['event'] === 'login_attempt' && !$entry['data']['success']) {
                    $ipStats[$ip]['failed_logins']++;
                }
            }
            
            fclose($handle);
        }
        
        // Identify suspicious IPs
        foreach ($ipStats as $ip => $stats) {
            $suspiciousScore = 0;
            
            // High request volume
            if ($stats['requests'] > 1000) $suspiciousScore += 2;
            
            // Multiple violations
            if ($stats['violations'] > 5) $suspiciousScore += 3;
            
            // Multiple failed logins
            if ($stats['failed_logins'] > 10) $suspiciousScore += 2;
            
            // Multiple countries (proxy/VPN)
            if (count($stats['countries']) > 2) $suspiciousScore += 2;
            
            // Multiple user agents (bot behavior)
            if (count($stats['user_agents']) > 10) $suspiciousScore += 2;
            
            // High average threat score
            $avgThreatScore = $stats['requests'] > 0 ? $stats['threat_score'] / $stats['requests'] : 0;
            if ($avgThreatScore > 5) $suspiciousScore += 3;
            
            if ($suspiciousScore >= 5) {
                $analysis['suspicious_ips'][$ip] = [
                    'score' => $suspiciousScore,
                    'stats' => $stats,
                    'recommendation' => $suspiciousScore >= 8 ? 'block' : 'monitor'
                ];
            }
        }
        
        // Sort by suspicion score
        uasort($analysis['suspicious_ips'], function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        // Generate recommendations
        $totalSuspiciousIPs = count($analysis['suspicious_ips']);
        if ($totalSuspiciousIPs > 10) {
            $analysis['recommendations'][] = 'Consider implementing stricter rate limiting';
        }
        
        if ($totalSuspiciousIPs > 0) {
            $analysis['recommendations'][] = 'Review and potentially block top suspicious IPs';
        }
        
        return $analysis;
    }
    
    /**
     * Generate security report
     */
    public function generateReport($format = 'json', $days = 30) {
        $metrics = $this->getSecurityMetrics($days * 24);
        $threats = $this->analyzeThreats($days);
        
        $report = [
            'period' => [
                'days' => $days,
                'start' => date('Y-m-d H:i:s', time() - ($days * 24 * 3600)),
                'end' => date('Y-m-d H:i:s')
            ],
            'summary' => [
                'total_events' => $metrics['total_events'],
                'threats_blocked' => $metrics['threats_blocked'],
                'failed_logins' => $metrics['failed_logins'],
                'unique_ips' => $metrics['unique_ips'],
                'security_score' => $this->calculateSecurityScore($metrics, $threats)
            ],
            'metrics' => $metrics,
            'threat_analysis' => $threats,
            'generated_at' => date('c')
        ];
        
        if ($format === 'html') {
            return $this->generateHTMLReport($report);
        }
        
        return json_encode($report, JSON_PRETTY_PRINT);
    }
    
    private function ensureLogDirectory() {
        if (!is_dir($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }
        
        // Create .htaccess to protect logs
        $htaccessFile = $this->logPath . '.htaccess';
        if (!file_exists($htaccessFile)) {
            file_put_contents($htaccessFile, "Deny from all\n");
        }
    }
    
    private function writeLog($event, $entry) {
        $filename = $this->logPath . 'security_' . date('Y-m-d') . '.log';
        
        // Rotate log if too large
        if (file_exists($filename) && filesize($filename) > $this->maxFileSize) {
            $this->rotateLog($filename);
        }
        
        $logLine = json_encode($entry) . "\n";
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
        
        // Clean old logs
        $this->cleanOldLogs();
    }
    
    private function rotateLog($filename) {
        $timestamp = date('Y-m-d_H-i-s');
        $rotatedName = str_replace('.log', "_$timestamp.log", $filename);
        rename($filename, $rotatedName);
        
        // Compress old log
        if (function_exists('gzencode')) {
            $content = file_get_contents($rotatedName);
            $compressed = gzencode($content, 9);
            file_put_contents($rotatedName . '.gz', $compressed);
            unlink($rotatedName);
        }
    }
    
    private function cleanOldLogs() {
        $cutoffTime = time() - ($this->retention * 24 * 3600);
        $files = glob($this->logPath . 'security_*.log*');
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
    
    private function getClientIP() {
        $headers = [
            'HTTP_CF_CONNECTING_IP',     // CloudFlare
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($headers as $header) {
            if (isset($_SERVER[$header]) && !empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function getGeoLocation($ip) {
        // Simple IP geolocation - in production use proper service
        if ($ip === 'unknown' || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE) === false) {
            return null;
        }
        
        // Placeholder - integrate with MaxMind, ipapi.co, or similar
        return [
            'country' => 'Unknown',
            'city' => 'Unknown',
            'timezone' => 'UTC'
        ];
    }
    
    private function calculateThreatScore($entry) {
        $score = 0;
        
        // Base score by event type
        $eventScores = [
            'security_violation' => 8,
            'login_attempt' => $entry['data']['success'] ?? true ? 1 : 4,
            'api_access' => ($entry['data']['response_code'] ?? 200) >= 400 ? 3 : 1,
            'data_access' => 2
        ];
        
        $score += $eventScores[$entry['event']] ?? 1;
        
        // Increase score for suspicious patterns
        if (isset($entry['data']['failed_attempts']) && $entry['data']['failed_attempts'] > 3) {
            $score += 3;
        }
        
        // User agent analysis
        $userAgent = strtolower($entry['user_agent']);
        $suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'bot', 'crawler'];
        foreach ($suspiciousAgents as $agent) {
            if (strpos($userAgent, $agent) !== false) {
                $score += 5;
                break;
            }
        }
        
        return min($score, 10); // Cap at 10
    }
    
    private function sanitizeLogData($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (in_array(strtolower($key), ['password', 'token', 'secret', 'key'])) {
                    $data[$key] = '[REDACTED]';
                } elseif (is_array($value)) {
                    $data[$key] = $this->sanitizeLogData($value);
                }
            }
        }
        
        return $data;
    }
    
    private function maskEmail($email) {
        if (!$email || strpos($email, '@') === false) {
            return '[INVALID]';
        }
        
        $parts = explode('@', $email);
        $username = $parts[0];
        $domain = $parts[1];
        
        $maskedUsername = substr($username, 0, 2) . str_repeat('*', max(0, strlen($username) - 4)) . substr($username, -2);
        
        return $maskedUsername . '@' . $domain;
    }
    
    private function getFailedAttempts($email) {
        // Simple file-based counter - in production use database or Redis
        $counterFile = $this->logPath . 'failed_attempts.json';
        
        if (!file_exists($counterFile)) {
            return 0;
        }
        
        $data = json_decode(file_get_contents($counterFile), true) ?: [];
        $key = hash('sha256', $email);
        
        return $data[$key]['count'] ?? 0;
    }
    
    private function calculateSecurityScore($metrics, $threats) {
        $score = 10; // Start with perfect score
        
        // Deduct points for security issues
        $threatCount = count($threats['suspicious_ips']);
        if ($threatCount > 0) {
            $score -= min(3, $threatCount * 0.1);
        }
        
        if ($metrics['failed_logins'] > 100) {
            $score -= 1;
        }
        
        if ($metrics['threats_blocked'] > 50) {
            $score -= 0.5; // Actually good - shows system is working
        }
        
        return max(1, round($score, 1));
    }
    
    private function sendAlert($entry) {
        // Simple email alert - in production use proper alerting system
        $subject = "🚨 Security Alert - " . $entry['event'];
        $message = "Security event detected:\n\n" . json_encode($entry, JSON_PRETTY_PRINT);
        
        // Send to admin email
        $adminEmail = $this->config->get('ADMIN_EMAIL', 'admin@laburar.com');
        
        if (function_exists('mail')) {
            mail($adminEmail, $subject, $message);
        }
        
        // Log the alert
        error_log("SECURITY ALERT: " . $entry['event'] . " from " . $entry['ip']);
    }
}