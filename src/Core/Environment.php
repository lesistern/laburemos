<?php
/**
 * LaburAR - Environment Configuration Loader
 * Loads environment variables from .env file
 */

namespace LaburAR\Core;

class Environment
{
    private static $loaded = false;
    
    /**
     * Load environment variables from .env file
     */
    public static function load(string $path = null): void
    {
        if (self::$loaded) {
            return;
        }
        
        $envPath = $path ?: dirname(__DIR__, 2) . '/.env';
        
        if (!file_exists($envPath)) {
            // Use defaults if .env doesn't exist
            self::setDefaults();
            self::$loaded = true;
            return;
        }
        
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip comments and empty lines
            if (empty($line) || strpos($line, '#') === 0) {
                continue;
            }
            
            // Parse key=value pairs
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                    (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                    $value = substr($value, 1, -1);
                }
                
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
        
        self::$loaded = true;
    }
    
    /**
     * Set default environment values
     */
    private static function setDefaults(): void
    {
        $defaults = [
            'APP_NAME' => 'LaburAR',
            'APP_ENV' => 'development',
            'APP_DEBUG' => 'true',
            'APP_URL' => 'http://localhost/Laburar',
            'DB_HOST' => 'localhost',
            'DB_PORT' => '3306',
            'DB_DATABASE' => 'laburar_db',
            'DB_USERNAME' => 'root',
            'DB_PASSWORD' => '',
            'JWT_SECRET' => 'dev-jwt-secret-key',
            'JWT_TTL' => '3600'
        ];
        
        foreach ($defaults as $key => $value) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
    
    /**
     * Get environment variable
     */
    public static function get(string $key, $default = null)
    {
        return $_ENV[$key] ?? $default;
    }
}
?>