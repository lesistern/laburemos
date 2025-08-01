<?php
/**
 * LaburAR - HTTP Response Handler
 * Handles HTTP responses with proper headers and formatting
 */

namespace LaburAR\Core;

class Response
{
    private array $headers = [];
    private int $statusCode = 200;
    private string $content = '';
    
    /**
     * Set response status code
     */
    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }
    
    /**
     * Set response header
     */
    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }
    
    /**
     * Set multiple headers
     */
    public function headers(array $headers): self
    {
        foreach ($headers as $name => $value) {
            $this->header($name, $value);
        }
        return $this;
    }
    
    /**
     * Send JSON response
     */
    public function json(array $data, int $status = 200): void
    {
        $this->status($status);
        $this->header('Content-Type', 'application/json; charset=utf-8');
        
        // Add security headers
        $this->addSecurityHeaders();
        
        // Add request metadata
        $response = [
            'success' => $status < 400,
            'data' => $status < 400 ? $data : null,
            'error' => $status >= 400 ? ($data['error'] ?? 'Unknown error') : null,
            'error_code' => $status >= 400 ? ($data['error_code'] ?? $this->getErrorCode($status)) : null,
            'timestamp' => gmdate('c'),
            'request_id' => uniqid('req_', true)
        ];
        
        // Merge additional data if provided
        if (isset($data['message'])) {
            $response['message'] = $data['message'];
        }
        
        if (isset($data['errors'])) {
            $response['errors'] = $data['errors'];
        }
        
        $this->content = json_encode($response, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        $this->send();
    }
    
    /**
     * Send HTML response
     */
    public function html(string $content, int $status = 200): void
    {
        $this->status($status);
        $this->header('Content-Type', 'text/html; charset=utf-8');
        $this->addSecurityHeaders();
        
        $this->content = $content;
        $this->send();
    }
    
    /**
     * Send plain text response
     */
    public function text(string $content, int $status = 200): void
    {
        $this->status($status);
        $this->header('Content-Type', 'text/plain; charset=utf-8');
        $this->addSecurityHeaders();
        
        $this->content = $content;
        $this->send();
    }
    
    /**
     * Send redirect response
     */
    public function redirect(string $url, int $status = 302): void
    {
        $this->status($status);
        $this->header('Location', $url);
        $this->addSecurityHeaders();
        
        $this->send();
    }
    
    /**
     * Send file download response
     */
    public function download(string $filePath, string $filename = null): void
    {
        if (!file_exists($filePath)) {
            $this->json(['error' => 'File not found'], 404);
            return;
        }
        
        $filename = $filename ?: basename($filePath);
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        
        $this->header('Content-Type', $mimeType);
        $this->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $this->header('Content-Length', strval(filesize($filePath)));
        $this->addSecurityHeaders();
        
        $this->sendHeaders();
        readfile($filePath);
        exit;
    }
    
    /**
     * Send success response
     */
    public function success(array $data = [], string $message = 'Success'): void
    {
        $response = array_merge($data, ['message' => $message]);
        $this->json($response, 200);
    }
    
    /**
     * Send error response
     */
    public function error(string $message, int $status = 400, array $errors = []): void
    {
        $response = [
            'error' => $message,
            'error_code' => $this->getErrorCode($status)
        ];
        
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        
        $this->json($response, $status);
    }
    
    /**
     * Send validation error response
     */
    public function validationError(array $errors, string $message = 'Validation failed'): void
    {
        $this->json([
            'error' => $message,
            'error_code' => 'VALIDATION_ERROR',
            'errors' => $errors
        ], 422);
    }
    
    /**
     * Send unauthorized response
     */
    public function unauthorized(string $message = 'Unauthorized'): void
    {
        $this->json([
            'error' => $message,
            'error_code' => 'UNAUTHORIZED'
        ], 401);
    }
    
    /**
     * Send forbidden response
     */
    public function forbidden(string $message = 'Forbidden'): void
    {
        $this->json([
            'error' => $message,
            'error_code' => 'FORBIDDEN'
        ], 403);
    }
    
    /**
     * Send not found response
     */
    public function notFound(string $message = 'Not found'): void
    {
        $this->json([
            'error' => $message,
            'error_code' => 'NOT_FOUND'
        ], 404);
    }
    
    /**
     * Send server error response
     */
    public function serverError(string $message = 'Internal server error'): void
    {
        $this->json([
            'error' => $message,
            'error_code' => 'INTERNAL_ERROR'
        ], 500);
    }
    
    /**
     * Add security headers
     */
    private function addSecurityHeaders(): void
    {
        $securityHeaders = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ];
        
        foreach ($securityHeaders as $name => $value) {
            if (!isset($this->headers[$name])) {
                $this->header($name, $value);
            }
        }
    }
    
    /**
     * Get error code from status
     */
    private function getErrorCode(int $status): string
    {
        $errorCodes = [
            400 => 'BAD_REQUEST',
            401 => 'UNAUTHORIZED',
            403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',
            405 => 'METHOD_NOT_ALLOWED',
            409 => 'CONFLICT',
            422 => 'VALIDATION_ERROR',
            429 => 'RATE_LIMITED',
            500 => 'INTERNAL_ERROR',
            502 => 'BAD_GATEWAY',
            503 => 'SERVICE_UNAVAILABLE'
        ];
        
        return $errorCodes[$status] ?? 'UNKNOWN_ERROR';
    }
    
    /**
     * Send headers
     */
    private function sendHeaders(): void
    {
        if (headers_sent()) {
            return;
        }
        
        http_response_code($this->statusCode);
        
        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }
    }
    
    /**
     * Send complete response
     */
    private function send(): void
    {
        $this->sendHeaders();
        echo $this->content;
        
        // Log response for debugging
        if (config('app.debug')) {
            logger("Response sent: {$this->statusCode}", 'debug', [
                'headers' => $this->headers,
                'content_length' => strlen($this->content)
            ]);
        }
        
        exit;
    }
    
    /**
     * Get current status code
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
    
    /**
     * Get current headers
     */
    public function getHeaders(): array
    {
        return $this->headers;
    }
    
    /**
     * Get current content
     */
    public function getContent(): string
    {
        return $this->content;
    }
}