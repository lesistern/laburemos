<?php
/**
 * LaburAR - Path Update Script
 * Updates all require/include paths to match new structure
 */

class PathUpdater
{
    private $basePath;
    private $pathMappings = [
        // Old paths → New paths
        "__DIR__ . '/../includes/" => "__DIR__ . '/../../app/Services/",
        "__DIR__ . '/../models/" => "__DIR__ . '/../../app/Models/",
        "__DIR__ . '/../api/" => "__DIR__ . '/../../app/Controllers/",
        "__DIR__ . '/../components/" => "__DIR__ . '/../../resources/components/",
        "require_once '../includes/" => "require_once __DIR__ . '/../../app/Services/",
        "require_once '../models/" => "require_once __DIR__ . '/../../app/Models/",
        "require_once 'includes/" => "require_once __DIR__ . '/../app/Services/",
        "require_once 'models/" => "require_once __DIR__ . '/../app/Models/",
        "include '../includes/" => "include __DIR__ . '/../../app/Services/",
        "include '../models/" => "include __DIR__ . '/../../app/Models/",
        "/assets/" => "/public/assets/",
        "assets/" => "public/assets/"
    ];
    
    public function __construct(string $basePath)
    {
        $this->basePath = rtrim($basePath, '/');
    }
    
    public function updateAllFiles(): void
    {
        echo "🚀 Iniciando actualización de rutas en LaburAR...\n\n";
        
        $directories = [
            $this->basePath . '/app',
            $this->basePath . '/src',
            $this->basePath . '/resources',
            $this->basePath . '/public'
        ];
        
        foreach ($directories as $dir) {
            if (is_dir($dir)) {
                $this->updateDirectory($dir);
            }
        }
        
        echo "\n✅ Actualización completada!\n";
    }
    
    private function updateDirectory(string $dir): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $this->updateFile($file->getPathname());
            }
        }
    }
    
    private function updateFile(string $filePath): void
    {
        $content = file_get_contents($filePath);
        $originalContent = $content;
        
        // Update require/include paths
        foreach ($this->pathMappings as $oldPath => $newPath) {
            $content = str_replace($oldPath, $newPath, $content);
        }
        
        // Update namespace declarations for moved files
        if (strpos($filePath, '/app/Controllers/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Controllers');
        } elseif (strpos($filePath, '/app/Models/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Models');
        } elseif (strpos($filePath, '/app/Services/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Services');
        } elseif (strpos($filePath, '/app/Middleware/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Middleware');
        } elseif (strpos($filePath, '/src/Core/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Core');
        } elseif (strpos($filePath, '/src/Argentine/') !== false) {
            $content = $this->addNamespace($content, 'LaburAR\\Argentine');
        }
        
        // Only write if content changed
        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            echo "📝 Actualizado: " . str_replace($this->basePath, '', $filePath) . "\n";
        }
    }
    
    private function addNamespace(string $content, string $namespace): string
    {
        // Skip if namespace already exists
        if (strpos($content, "namespace $namespace") !== false) {
            return $content;
        }
        
        // Add namespace after opening PHP tag
        if (strpos($content, '<?php') === 0) {
            $lines = explode("\n", $content);
            $insertIndex = 1;
            
            // Skip comments and docblocks
            for ($i = 1; $i < count($lines); $i++) {
                $line = trim($lines[$i]);
                if ($line === '' || strpos($line, '*') === 0 || strpos($line, '//') === 0) {
                    $insertIndex = $i + 1;
                } else {
                    break;
                }
            }
            
            array_splice($lines, $insertIndex, 0, [
                "",
                "namespace $namespace;",
                ""
            ]);
            
            return implode("\n", $lines);
        }
        
        return $content;
    }
}

// Execute if run directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $basePath = dirname(__DIR__, 2);
    $updater = new PathUpdater($basePath);
    $updater->updateAllFiles();
}
?>