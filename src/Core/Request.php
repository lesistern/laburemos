<?php
/**
 * LaburAR - HTTP Request Handler
 * Handles incoming HTTP requests with security and validation
 */

namespace LaburAR\Core;

class Request
{
    private array $headers;
    private array $query;
    private array $body;
    private array $files;
    private string $method;
    private string $path;
    private string $uri;
    private $user = null;
    
    public function __construct()
    {
        $this->headers = $this->parseHeaders();
        $this->query = $_GET ?? [];
        $this->files = $_FILES ?? [];
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->path = $this->parsePath();
        $this->body = $this->parseBody();
    }
    
    /**
     * Get request method
     */
    public function getMethod(): string
    {
        return strtoupper($this->method);
    }
    
    /**
     * Get request path
     */
    public function getPath(): string
    {
        return $this->path;
    }
    
    /**
     * Get full URI
     */
    public function getUri(): string
    {
        return $this->uri;
    }
    
    /**
     * Get query parameter
     */
    public function query(string $key = null, $default = null)
    {
        if ($key === null) {
            return $this->query;
        }
        
        return $this->query[$key] ?? $default;
    }
    
    /**
     * Get request body data
     */
    public function input(string $key = null, $default = null)
    {
        if ($key === null) {
            return $this->body;
        }
        
        return $this->body[$key] ?? $default;
    }
    
    /**
     * Get all input (query + body)
     */
    public function all(): array
    {
        return array_merge($this->query, $this->body);
    }
    
    /**
     * Check if input key exists
     */
    public function has(string $key): bool
    {
        return isset($this->body[$key]) || isset($this->query[$key]);
    }
    
    /**
     * Get only specified keys
     */
    public function only(array $keys): array
    {
        $result = [];
        $all = $this->all();
        
        foreach ($keys as $key) {
            if (isset($all[$key])) {
                $result[$key] = $all[$key];
            }
        }
        
        return $result;
    }
    
    /**
     * Get all except specified keys
     */
    public function except(array $keys): array
    {
        $all = $this->all();
        
        foreach ($keys as $key) {
            unset($all[$key]);
        }
        
        return $all;
    }
    
    /**
     * Get request header
     */
    public function header(string $key, $default = null)
    {
        $key = strtolower($key);
        return $this->headers[$key] ?? $default;
    }
    
    /**
     * Get all headers
     */
    public function headers(): array
    {
        return $this->headers;
    }
    
    /**
     * Get uploaded file
     */
    public function file(string $key): ?array
    {
        return $this->files[$key] ?? null;
    }
    
    /**
     * Get all uploaded files
     */
    public function files(): array
    {
        return $this->files;
    }
    
    /**
     * Check if request has file upload
     */
    public function hasFile(string $key): bool
    {
        return isset($this->files[$key]) && 
               $this->files[$key]['error'] === UPLOAD_ERR_OK;
    }
    
    /**
     * Get client IP address
     */
    public function ip(): string
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
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Get user agent
     */
    public function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }
    
    /**
     * Check if request is AJAX
     */
    public function isAjax(): bool
    {
        return strtolower($this->header('X-Requested-With', '')) === 'xmlhttprequest';
    }
    
    /**
     * Check if request is JSON
     */
    public function isJson(): bool
    {
        return strpos($this->header('Content-Type', ''), 'application/json') !== false;
    }
    
    /**
     * Check if request is secure (HTTPS)
     */
    public function isSecure(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
               $_SERVER['SERVER_PORT'] === 443 ||
               strtolower($this->header('X-Forwarded-Proto', '')) === 'https';
    }
    
    /**
     * Set authenticated user
     */
    public function setUser($user): void
    {
        $this->user = $user;
    }
    
    /**
     * Get authenticated user
     */
    public function getUser()
    {
        return $this->user;
    }
    
    /**
     * Check if user is authenticated
     */
    public function isAuthenticated(): bool
    {
        return $this->user !== null;
    }
    
    /**
     * Validate input data
     */
    public function validate(array $rules): array
    {
        $errors = [];
        $data = $this->all();
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            $ruleList = is_string($rule) ? explode('|', $rule) : $rule;
            
            foreach ($ruleList as $singleRule) {
                $error = $this->validateField($field, $value, $singleRule);
                if ($error) {
                    $errors[$field][] = $error;
                }
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException('Validation failed', $errors);
        }
        
        return $data;
    }
    
    /**
     * Parse request headers
     */
    private function parseHeaders(): array
    {
        $headers = [];
        
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            // Fallback for servers without getallheaders
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header = str_replace('_', '-', substr($key, 5));
                    $headers[$header] = $value;
                }
            }
        }
        
        // Normalize header keys to lowercase
        return array_change_key_case($headers, CASE_LOWER);
    }
    
    /**
     * Parse request path
     */
    private function parsePath(): string
    {
        $path = parse_url($this->uri, PHP_URL_PATH);
        return $path ?: '/';
    }
    
    /**
     * Parse request body
     */
    private function parseBody(): array
    {
        if ($this->method === 'GET') {
            return [];
        }
        
        $contentType = $this->header('Content-Type', '');
        
        if (strpos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            $decoded = json_decode($input, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded ?? [];
            }
        }
        
        return $_POST ?? [];
    }
    
    /**
     * Validate individual field
     */
    private function validateField(string $field, $value, string $rule): ?string
    {
        [$ruleName, $ruleValue] = explode(':', $rule . ':');
        
        switch ($ruleName) {
            case 'required':
                if (empty($value)) {
                    return "The {$field} field is required.";
                }
                break;
                
            case 'email':
                if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return "The {$field} must be a valid email address.";
                }
                break;
                
            case 'min':
                if (!empty($value) && strlen($value) < intval($ruleValue)) {
                    return "The {$field} must be at least {$ruleValue} characters.";
                }
                break;
                
            case 'max':
                if (!empty($value) && strlen($value) > intval($ruleValue)) {
                    return "The {$field} may not be greater than {$ruleValue} characters.";
                }
                break;
                
            case 'numeric':
                if (!empty($value) && !is_numeric($value)) {
                    return "The {$field} must be a number.";
                }
                break;
                
            case 'in':
                $allowedValues = explode(',', $ruleValue);
                if (!empty($value) && !in_array($value, $allowedValues)) {
                    return "The selected {$field} is invalid.";
                }
                break;
        }
        
        return null;
    }
}

/**
 * Validation exception
 */
class ValidationException extends \Exception
{
    private array $errors;
    
    public function __construct(string $message, array $errors = [])
    {
        parent::__construct($message);
        $this->errors = $errors;
    }
    
    public function getErrors(): array
    {
        return $this->errors;
    }
}