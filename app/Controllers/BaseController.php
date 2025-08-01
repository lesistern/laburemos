<?php
/**
 * LaburAR - Base Controller
 * Common functionality for all controllers
 */

namespace LaburAR\Controllers;

use LaburAR\Core\Request;
use LaburAR\Core\Response;
use LaburAR\Services\Database;
use LaburAR\Services\SecurityHelper;

abstract class BaseController
{
    protected Database $db;
    protected SecurityHelper $security;
    protected Request $request;
    protected Response $response;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->security = SecurityHelper::getInstance();
        $this->request = new Request();
        $this->response = new Response();
    }
    
    /**
     * Get authenticated user
     */
    protected function getUser()
    {
        return $this->request->getUser();
    }
    
    /**
     * Check if user is authenticated
     */
    protected function isAuthenticated(): bool
    {
        return $this->request->isAuthenticated();
    }
    
    /**
     * Require authentication
     */
    protected function requireAuth(): void
    {
        if (!$this->isAuthenticated()) {
            $this->response->unauthorized('Authentication required');
        }
    }
    
    /**
     * Require specific user type
     */
    protected function requireUserType(string $type): void
    {
        $this->requireAuth();
        
        $user = $this->getUser();
        if ($user->user_type !== $type) {
            $this->response->forbidden("Access restricted to {$type}s only");
        }
    }
    
    /**
     * Require email verification
     */
    protected function requireEmailVerified(): void
    {
        $this->requireAuth();
        
        $user = $this->getUser();
        if (!$user->email_verified_at) {
            $this->response->forbidden('Email verification required');
        }
    }
    
    /**
     * Get validated input
     */
    protected function validate(array $rules): array
    {
        try {
            return $this->request->validate($rules);
        } catch (\LaburAR\Core\ValidationException $e) {
            $this->response->validationError($e->getErrors());
        }
    }
    
    /**
     * Get paginated results
     */
    protected function paginate($query, int $perPage = 15): array
    {
        $page = max(1, intval($this->request->query('page', 1)));
        $offset = ($page - 1) * $perPage;
        
        // Get total count
        $totalQuery = clone $query;
        $total = $totalQuery->count();
        
        // Get paginated results
        $results = $query->limit($perPage)->offset($offset)->get();
        
        return [
            'data' => $results,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
                'from' => $offset + 1,
                'to' => min($offset + $perPage, $total)
            ]
        ];
    }
    
    /**
     * Success response helper
     */
    protected function success(array $data = [], string $message = 'Success'): void
    {
        $this->response->success($data, $message);
    }
    
    /**
     * Error response helper
     */
    protected function error(string $message, int $status = 400): void
    {
        $this->response->error($message, $status);
    }
    
    /**
     * Log activity for audit trail
     */
    protected function logActivity(string $action, string $resourceType = null, int $resourceId = null, array $context = []): void
    {
        $user = $this->getUser();
        
        try {
            $this->db->query("
                INSERT INTO audit_logs (
                    user_id, session_id, action, resource_type, resource_id,
                    ip_address, user_agent, request_method, request_uri,
                    context, severity, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ", [
                $user ? $user->id : null,
                session_id(),
                $action,
                $resourceType,
                $resourceId,
                $this->request->ip(),
                $this->request->userAgent(),
                $this->request->getMethod(),
                $this->request->getUri(),
                json_encode($context),
                'info'
            ]);
        } catch (\Exception $e) {
            logger('Failed to log activity: ' . $e->getMessage(), 'error');
        }
    }
    
    /**
     * Handle file upload
     */
    protected function handleFileUpload(string $field, array $allowedTypes = [], int $maxSize = null): ?array
    {
        if (!$this->request->hasFile($field)) {
            return null;
        }
        
        $file = $this->request->file($field);
        $maxSize = $maxSize ?: config('upload.max_size', 10485760); // 10MB default
        $allowedTypes = $allowedTypes ?: config('upload.allowed_types', ['jpg', 'jpeg', 'png', 'pdf']);
        
        // Validate file size
        if ($file['size'] > $maxSize) {
            $this->error('File size exceeds maximum allowed size');
        }
        
        // Validate file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedTypes)) {
            $this->error('File type not allowed');
        }
        
        // Generate unique filename
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $uploadPath = storage_path('uploads/' . $filename);
        
        // Create upload directory if it doesn't exist
        $uploadDir = dirname($uploadPath);
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
            $this->error('Failed to upload file');
        }
        
        return [
            'original_name' => $file['name'],
            'filename' => $filename,
            'path' => $uploadPath,
            'url' => url('uploads/' . $filename),
            'size' => $file['size'],
            'type' => $file['type']
        ];
    }
    
    /**
     * Check rate limiting
     */
    protected function checkRateLimit(string $action, int $maxAttempts = 60, int $timeWindow = 60): void
    {
        $key = "rate_limit:{$action}:" . $this->request->ip() . ':' . floor(time() / $timeWindow);
        
        $attempts = cache_remember($key, $timeWindow, function() {
            return 0;
        });
        
        if ($attempts >= $maxAttempts) {
            $this->response->json([
                'error' => 'Rate limit exceeded',
                'error_code' => 'RATE_LIMITED',
                'retry_after' => $timeWindow
            ], 429);
        }
        
        // Increment attempts
        cache_remember($key, $timeWindow, function() use ($attempts) {
            return $attempts + 1;
        });
    }
    
    /**
     * Get client IP for logging
     */
    protected function getClientIP(): string
    {
        return $this->request->ip();
    }
}