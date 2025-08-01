<?php
/**
 * LaburAR - Global Helper Functions
 * Common utility functions available throughout the application
 */

if (!function_exists('config')) {
    /**
     * Get configuration value
     */
    function config(string $key, $default = null)
    {
        static $config = null;
        
        if ($config === null) {
            $config = require __DIR__ . '/../../config/app.php';
        }
        
        $keys = explode('.', $key);
        $value = $config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
}

if (!function_exists('env')) {
    /**
     * Get environment variable
     */
    function env(string $key, $default = null)
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
        
        if ($value === 'true') return true;
        if ($value === 'false') return false;
        if ($value === 'null') return null;
        
        return $value;
    }
}

if (!function_exists('app_path')) {
    /**
     * Get application path
     */
    function app_path(string $path = ''): string
    {
        return __DIR__ . '/../../app/' . ltrim($path, '/');
    }
}

if (!function_exists('public_path')) {
    /**
     * Get public path
     */
    function public_path(string $path = ''): string
    {
        return __DIR__ . '/../../public/' . ltrim($path, '/');
    }
}

if (!function_exists('storage_path')) {
    /**
     * Get storage path
     */
    function storage_path(string $path = ''): string
    {
        return __DIR__ . '/../../storage/' . ltrim($path, '/');
    }
}

if (!function_exists('resource_path')) {
    /**
     * Get resource path
     */
    function resource_path(string $path = ''): string
    {
        return __DIR__ . '/../../resources/' . ltrim($path, '/');
    }
}

if (!function_exists('base_path')) {
    /**
     * Get base path
     */
    function base_path(string $path = ''): string
    {
        return __DIR__ . '/../../' . ltrim($path, '/');
    }
}

if (!function_exists('url')) {
    /**
     * Generate URL
     */
    function url(string $path = ''): string
    {
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
        return $baseUrl . '/' . ltrim($path, '/');
    }
}

if (!function_exists('asset')) {
    /**
     * Generate asset URL
     */
    function asset(string $path): string
    {
        return url('assets/' . ltrim($path, '/'));
    }
}

if (!function_exists('csrf_token')) {
    /**
     * Generate CSRF token
     */
    function csrf_token(): string
    {
        if (!isset($_SESSION['_token'])) {
            $_SESSION['_token'] = bin2hex(random_bytes(32));
        }
        
        return $_SESSION['_token'];
    }
}

if (!function_exists('old')) {
    /**
     * Get old input value
     */
    function old(string $key, $default = null)
    {
        return $_SESSION['_old_input'][$key] ?? $default;
    }
}

if (!function_exists('session')) {
    /**
     * Get/set session value
     */
    function session(string $key = null, $value = null)
    {
        if ($key === null) {
            return $_SESSION;
        }
        
        if ($value !== null) {
            $_SESSION[$key] = $value;
            return $value;
        }
        
        return $_SESSION[$key] ?? null;
    }
}

if (!function_exists('flash')) {
    /**
     * Set flash message
     */
    function flash(string $key, $message): void
    {
        $_SESSION['_flash'][$key] = $message;
    }
}

if (!function_exists('redirect')) {
    /**
     * Redirect to URL
     */
    function redirect(string $url): void
    {
        header("Location: $url");
        exit;
    }
}

if (!function_exists('response')) {
    /**
     * Create JSON response
     */
    function response(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}

if (!function_exists('abort')) {
    /**
     * Abort with HTTP status
     */
    function abort(int $status, string $message = ''): void
    {
        http_response_code($status);
        
        if (!empty($message)) {
            echo $message;
        }
        
        exit;
    }
}

if (!function_exists('sanitize_input')) {
    /**
     * Sanitize user input
     */
    function sanitize_input($input)
    {
        if (is_array($input)) {
            return array_map('sanitize_input', $input);
        }
        
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('validate_email')) {
    /**
     * Validate email address
     */
    function validate_email(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}

if (!function_exists('validate_cuil_cuit')) {
    /**
     * Validate Argentine CUIL/CUIT
     */
    function validate_cuil_cuit(string $cuil): bool
    {
        $cuil = preg_replace('/[^0-9]/', '', $cuil);
        
        if (strlen($cuil) !== 11) {
            return false;
        }
        
        $multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $sum += intval($cuil[$i]) * $multipliers[$i];
        }
        
        $remainder = $sum % 11;
        $checkDigit = $remainder < 2 ? $remainder : 11 - $remainder;
        
        return intval($cuil[10]) === $checkDigit;
    }
}

if (!function_exists('format_currency')) {
    /**
     * Format currency for Argentina
     */
    function format_currency(float $amount, string $currency = 'ARS'): string
    {
        return $currency . ' ' . number_format($amount, 2, ',', '.');
    }
}

if (!function_exists('logger')) {
    /**
     * Log message
     */
    function logger(string $message, string $level = 'info', array $context = []): void
    {
        $logFile = storage_path('logs/laburar.log');
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        
        $logMessage = "[{$timestamp}] {$level}: {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}

if (!function_exists('cache_remember')) {
    /**
     * Cache remember pattern
     */
    function cache_remember(string $key, int $ttl, callable $callback)
    {
        $cacheFile = storage_path("cache/{$key}.cache");
        
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
            return unserialize(file_get_contents($cacheFile));
        }
        
        $value = $callback();
        
        $cacheDir = dirname($cacheFile);
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        
        file_put_contents($cacheFile, serialize($value));
        
        return $value;
    }
}