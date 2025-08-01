<?php
/**
 * LaburAR - Enterprise Router
 * Modern routing system with middleware support
 */

namespace LaburAR\Core;

class Router
{
    private array $routes = [];
    private array $middleware = [];
    private array $groups = [];
    private string $currentGroup = '';
    
    /**
     * Register GET route
     */
    public function get(string $path, $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }
    
    /**
     * Register POST route
     */
    public function post(string $path, $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }
    
    /**
     * Register PUT route
     */
    public function put(string $path, $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }
    
    /**
     * Register DELETE route
     */
    public function delete(string $path, $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    /**
     * Register route group with prefix
     */
    public function group(string $prefix, callable $callback): void
    {
        $previousGroup = $this->currentGroup;
        $this->currentGroup = trim($prefix, '/');
        
        $callback($this);
        
        $this->currentGroup = $previousGroup;
    }
    
    /**
     * Register middleware
     */
    public function middleware(string $name, callable $middleware): void
    {
        $this->middleware[$name] = $middleware;
    }
    
    /**
     * Register fallback route
     */
    public function fallback(callable $handler): void
    {
        $this->routes['FALLBACK'] = $handler;
    }
    
    /**
     * Add route to collection
     */
    private function addRoute(string $method, string $path, $handler): void
    {
        // Add group prefix if in group
        if (!empty($this->currentGroup)) {
            $path = '/' . $this->currentGroup . $path;
        }
        
        $path = $this->normalizePath($path);
        $key = $method . ':' . $path;
        
        $this->routes[$key] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => []
        ];
    }
    
    /**
     * Normalize path
     */
    private function normalizePath(string $path): string
    {
        return '/' . trim($path, '/');
    }
    
    /**
     * Dispatch request to appropriate handler
     */
    public function dispatch(Request $request, Response $response): void
    {
        $method = $request->getMethod();
        $path = $this->normalizePath($request->getPath());
        
        // Find matching route
        $route = $this->findRoute($method, $path);
        
        if (!$route) {
            // Try fallback
            if (isset($this->routes['FALLBACK'])) {
                $handler = $this->routes['FALLBACK'];
                if (is_callable($handler)) {
                    call_user_func($handler);
                    return;
                }
            }
            
            $response->json(['error' => 'Route not found'], 404);
            return;
        }
        
        // Execute route handler
        $this->executeRoute($route, $request, $response);
    }
    
    /**
     * Find matching route
     */
    private function findRoute(string $method, string $path): ?array
    {
        $key = $method . ':' . $path;
        
        // Exact match
        if (isset($this->routes[$key])) {
            return $this->routes[$key];
        }
        
        // Pattern matching for dynamic routes
        foreach ($this->routes as $routeKey => $route) {
            if (strpos($routeKey, $method . ':') !== 0) {
                continue;
            }
            
            if ($this->matchPattern($route['path'], $path)) {
                return $route;
            }
        }
        
        return null;
    }
    
    /**
     * Match route pattern with parameters
     */
    private function matchPattern(string $pattern, string $path): bool
    {
        // Convert {id} to regex pattern
        $regexPattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $pattern);
        $regexPattern = '#^' . $regexPattern . '$#';
        
        return preg_match($regexPattern, $path);
    }
    
    /**
     * Execute route handler
     */
    private function executeRoute(array $route, Request $request, Response $response): void
    {
        $handler = $route['handler'];
        
        try {
            if (is_string($handler) && strpos($handler, '@') !== false) {
                // Controller@method format
                [$controllerClass, $method] = explode('@', $handler);
                
                // Add namespace if not present
                if (strpos($controllerClass, '\\') === false) {
                    $controllerClass = 'LaburAR\\Controllers\\' . $controllerClass;
                }
                
                if (!class_exists($controllerClass)) {
                    throw new \Exception("Controller {$controllerClass} not found");
                }
                
                $controller = new $controllerClass();
                
                if (!method_exists($controller, $method)) {
                    throw new \Exception("Method {$method} not found in {$controllerClass}");
                }
                
                // Extract route parameters
                $params = $this->extractParameters($route['path'], $request->getPath());
                
                // Call controller method
                call_user_func_array([$controller, $method], array_values($params));
                
            } elseif (is_callable($handler)) {
                // Direct callable
                call_user_func($handler);
                
            } else {
                throw new \Exception("Invalid route handler");
            }
            
        } catch (\Throwable $e) {
            error_log('[Router] Error executing route: ' . $e->getMessage());
            $response->json([
                'error' => 'Internal server error',
                'message' => config('app.debug') ? $e->getMessage() : 'Route execution failed'
            ], 500);
        }
    }
    
    /**
     * Extract parameters from route path
     */
    private function extractParameters(string $pattern, string $path): array
    {
        $params = [];
        
        // Extract parameter names from pattern
        preg_match_all('/\{([^}]+)\}/', $pattern, $paramNames);
        
        // Extract values from path
        $regexPattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $pattern);
        $regexPattern = '#^' . $regexPattern . '$#';
        
        if (preg_match($regexPattern, $path, $matches)) {
            array_shift($matches); // Remove full match
            
            foreach ($paramNames[1] as $index => $name) {
                if (isset($matches[$index])) {
                    $params[$name] = $matches[$index];
                }
            }
        }
        
        return $params;
    }
    
    /**
     * Get all registered routes (for debugging)
     */
    public function getRoutes(): array
    {
        return $this->routes;
    }
}