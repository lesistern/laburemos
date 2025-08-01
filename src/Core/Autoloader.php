<?php
/**
 * LaburAR - Enterprise PSR-4 Autoloader
 * Handles automatic class loading for the application
 */

namespace LaburAR\Core;

class Autoloader
{
    private static $instance = null;
    private $prefixes = [];
    
    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Register the autoloader
     */
    public function register(): void
    {
        spl_autoload_register([$this, 'loadClass']);
        
        // Register default namespaces
        $this->addNamespace('LaburAR\\Controllers\\', __DIR__ . '/../../app/Controllers/');
        $this->addNamespace('LaburAR\\Models\\', __DIR__ . '/../../app/Models/');
        $this->addNamespace('LaburAR\\Services\\', __DIR__ . '/../../app/Services/');
        $this->addNamespace('LaburAR\\Middleware\\', __DIR__ . '/../../app/Middleware/');
        $this->addNamespace('LaburAR\\Helpers\\', __DIR__ . '/../../app/Helpers/');
        $this->addNamespace('LaburAR\\Core\\', __DIR__ . '/');
        $this->addNamespace('LaburAR\\Argentine\\', __DIR__ . '/../Argentine/');
    }
    
    /**
     * Add a namespace prefix
     */
    public function addNamespace(string $prefix, string $baseDir): void
    {
        $prefix = trim($prefix, '\\') . '\\';
        $baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR) . '/';
        
        if (!isset($this->prefixes[$prefix])) {
            $this->prefixes[$prefix] = [];
        }
        
        array_push($this->prefixes[$prefix], $baseDir);
    }
    
    /**
     * Load class file
     */
    public function loadClass(string $class): bool
    {
        $prefix = $class;
        
        while (false !== $pos = strrpos($prefix, '\\')) {
            $prefix = substr($class, 0, $pos + 1);
            $relativeClass = substr($class, $pos + 1);
            
            $mappedFile = $this->loadMappedFile($prefix, $relativeClass);
            if ($mappedFile) {
                return $mappedFile;
            }
            
            $prefix = rtrim($prefix, '\\');
        }
        
        return false;
    }
    
    /**
     * Load mapped file for prefix and relative class
     */
    private function loadMappedFile(string $prefix, string $relativeClass): bool
    {
        if (!isset($this->prefixes[$prefix])) {
            return false;
        }
        
        foreach ($this->prefixes[$prefix] as $baseDir) {
            $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
            
            if ($this->requireFile($file)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Require file if it exists
     */
    private function requireFile(string $file): bool
    {
        if (file_exists($file)) {
            require $file;
            return true;
        }
        
        return false;
    }
}

// Auto-register when included
Autoloader::getInstance()->register();