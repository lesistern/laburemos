<?php
/**
 * Email Availability Checker
 * LaburAR Complete Platform
 * 
 * Checks if email is already registered
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

try {
    // Rate limiting
    $rateLimiter = new RateLimiter();
    if (!$rateLimiter->checkLimit('api_general')) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too many requests. Please wait.',
            'retry_after' => $rateLimiter->getResetTime()
        ]);
        exit;
    }
    
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        exit;
    }
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    
    if (empty($email)) {
        echo json_encode([
            'available' => false,
            'message' => 'Email is required'
        ]);
        exit;
    }
    
    // Validate email format
    $validator = new ValidationHelper();
    if (!$validator->validateEmail($email)) {
        echo json_encode([
            'available' => false,
            'message' => 'Invalid email format'
        ]);
        exit;
    }
    
    // Check if email exists
    $existingUser = User::where('email', $email)->first();
    
    if ($existingUser) {
        echo json_encode([
            'available' => false,
            'message' => 'This email is already registered'
        ]);
    } else {
        echo json_encode([
            'available' => true,
            'message' => 'Email is available'
        ]);
    }
    
} catch (Exception $e) {
    error_log('[CheckEmail] Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'available' => true, // Fail open for better UX
        'message' => 'Could not verify email availability'
    ]);
}
?>