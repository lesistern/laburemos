<?php
/**
 * VerificationController - API para Sistema de Verificación
 * 
 * Maneja endpoints de verificación de email, teléfono e identidad
 * 
 * @version 1.0.0
 * @package LaburAR\API
 */

require_once __DIR__ . '/../includes/VerificationService.php';
require_once __DIR__ . '/../includes/AuthMiddleware.php';

use LaburAR\Services\VerificationService;
use LaburAR\Middleware\AuthMiddleware;

class VerificationController {
    
    private $verificationService;
    private $authMiddleware;
    
    public function __construct() {
        $this->verificationService = new VerificationService();
        $this->authMiddleware = new AuthMiddleware();
    }
    
    /**
     * Handle API requests
     */
    public function handleRequest() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '/';
        
        try {
            // Public endpoints (no auth required)
            if ($method === 'GET' && preg_match('/^\/verify-email\/(.+)$/', $path, $matches)) {
                $this->verifyEmailByToken($matches[1]);
                return;
            }
            
            // All other endpoints require authentication
            $user = $this->authMiddleware->authenticate();
            if (!$user) {
                throw new \Exception('Unauthorized', 401);
            }
            
            // Route to appropriate handler
            switch ($path) {
                case '/email/initiate':
                    if ($method === 'POST') {
                        $this->initiateEmailVerification($user);
                    }
                    break;
                    
                case '/email/resend':
                    if ($method === 'POST') {
                        $this->resendEmailVerification($user);
                    }
                    break;
                    
                case '/phone/initiate':
                    if ($method === 'POST') {
                        $this->initiatePhoneVerification($user);
                    }
                    break;
                    
                case '/phone/verify':
                    if ($method === 'POST') {
                        $this->verifyPhoneCode($user);
                    }
                    break;
                    
                case '/phone/resend':
                    if ($method === 'POST') {
                        $this->resendPhoneVerification($user);
                    }
                    break;
                    
                case '/identity/initiate':
                    if ($method === 'POST') {
                        $this->initiateIdentityVerification($user);
                    }
                    break;
                    
                case '/identity/upload':
                    if ($method === 'POST') {
                        $this->uploadIdentityDocuments($user);
                    }
                    break;
                    
                case '/status':
                    if ($method === 'GET') {
                        $this->getVerificationStatus($user);
                    }
                    break;
                    
                default:
                    throw new \Exception('Endpoint not found', 404);
            }
            
        } catch (\Exception $e) {
            $this->sendError($e->getMessage(), $e->getCode() ?: 400);
        }
    }
    
    /**
     * Initiate email verification
     */
    private function initiateEmailVerification($user) {
        $result = $this->verificationService->initiateEmailVerification($user['id']);
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'expires_in' => $result['expires_in'] ?? null,
                'already_verified' => $result['already_verified'] ?? false
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Verify email by token (public endpoint)
     */
    private function verifyEmailByToken($token) {
        $result = $this->verificationService->verifyEmail($token);
        
        if ($result['success']) {
            // Redirect to success page
            header('Location: /verification-success?type=email');
            exit;
        } else {
            // Redirect to error page
            header('Location: /verification-error?type=email&error=' . urlencode($result['error']));
            exit;
        }
    }
    
    /**
     * Resend email verification
     */
    private function resendEmailVerification($user) {
        $result = $this->verificationService->resendVerification($user['id'], 'email');
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'expires_in' => $result['expires_in'] ?? null
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Initiate phone verification
     */
    private function initiatePhoneVerification($user) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['phone'])) {
            $this->sendError('Phone number is required');
            return;
        }
        
        $result = $this->verificationService->initiatePhoneVerification($user['id'], $data['phone']);
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'expires_in' => $result['expires_in'],
                'phone_masked' => $result['phone_masked']
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Verify phone code
     */
    private function verifyPhoneCode($user) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['code'])) {
            $this->sendError('Verification code is required');
            return;
        }
        
        $result = $this->verificationService->verifyPhone($user['id'], $data['code']);
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message']
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Resend phone verification
     */
    private function resendPhoneVerification($user) {
        $result = $this->verificationService->resendVerification($user['id'], 'phone');
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'expires_in' => $result['expires_in'],
                'phone_masked' => $result['phone_masked'] ?? null
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Initiate identity verification
     */
    private function initiateIdentityVerification($user) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['document_type']) || empty($data['document_number'])) {
            $this->sendError('Document type and number are required');
            return;
        }
        
        if (!in_array($data['document_type'], ['DNI', 'CUIL', 'CUIT'])) {
            $this->sendError('Invalid document type');
            return;
        }
        
        $result = $this->verificationService->initiateIdentityVerification(
            $user['id'],
            $data['document_type'],
            $data['document_number']
        );
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'verification_id' => $result['verification_id'],
                'already_verified' => $result['already_verified'] ?? false,
                'auto_verified' => $result['auto_verified'] ?? false,
                'requires_manual_review' => $result['requires_manual_review'] ?? false,
                'upload_url' => $result['upload_url'] ?? null
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Upload identity documents
     */
    private function uploadIdentityDocuments($user) {
        if (empty($_POST['verification_id'])) {
            $this->sendError('Verification ID is required');
            return;
        }
        
        if (empty($_FILES)) {
            $this->sendError('No files uploaded');
            return;
        }
        
        $files = [];
        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                $files[] = $file;
            }
        }
        
        if (empty($files)) {
            $this->sendError('No valid files uploaded');
            return;
        }
        
        $result = $this->verificationService->uploadVerificationDocuments(
            $_POST['verification_id'],
            $files
        );
        
        if ($result['success']) {
            $this->sendResponse([
                'success' => true,
                'message' => $result['message'],
                'files_uploaded' => $result['files_uploaded'],
                'review_time' => $result['review_time']
            ]);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Get verification status
     */
    private function getVerificationStatus($user) {
        $result = $this->verificationService->getUserVerificationStatus($user['id']);
        
        if ($result['success']) {
            $this->sendResponse($result);
        } else {
            $this->sendError($result['error']);
        }
    }
    
    /**
     * Send JSON response
     */
    private function sendResponse($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
    
    /**
     * Send error response
     */
    private function sendError($message, $status = 400) {
        http_response_code($status);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}

// Handle request if called directly
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    $controller = new VerificationController();
    $controller->handleRequest();
}
?>