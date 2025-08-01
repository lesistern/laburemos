<?php
/**
 * CSRF Token Generator
 * LaburAR Complete Platform
 * 
 * Generates CSRF tokens for form protection
 */

require_once __DIR__ . '/../includes/SecurityHelper.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    $security = new SecurityHelper();
    $token = $security->generateCSRFToken();
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to generate CSRF token',
        'timestamp' => date('c')
    ]);
}
?>