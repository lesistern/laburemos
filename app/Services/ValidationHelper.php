<?php
/**
 * ValidationHelper - Enterprise Input Validation
 * LaburAR Complete Platform
 * 
 * Comprehensive validation for all user inputs
 * with security-first approach
 */

class ValidationHelper
{
    // Password requirements
    private const MIN_PASSWORD_LENGTH = 8;
    private const MAX_PASSWORD_LENGTH = 128;
    
    // File upload limits
    private const MAX_FILE_SIZE = 10485760; // 10MB
    private const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    private const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt'];
    
    // Input length limits
    private const MAX_NAME_LENGTH = 100;
    private const MAX_EMAIL_LENGTH = 254;
    private const MAX_PHONE_LENGTH = 20;
    private const MAX_TEXT_LENGTH = 5000;
    private const MAX_TITLE_LENGTH = 200;
    
    /**
     * Validate email address
     */
    public function validateEmail($email)
    {
        if (empty($email)) {
            return false;
        }
        
        if (strlen($email) > self::MAX_EMAIL_LENGTH) {
            return false;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Additional security checks
        if ($this->containsSuspiciousPatterns($email)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate password strength
     */
    public function validatePassword($password)
    {
        $result = ['valid' => false, 'message' => ''];
        
        if (empty($password)) {
            $result['message'] = 'Password is required';
            return $result;
        }
        
        if (strlen($password) < self::MIN_PASSWORD_LENGTH) {
            $result['message'] = 'Password must be at least ' . self::MIN_PASSWORD_LENGTH . ' characters long';
            return $result;
        }
        
        if (strlen($password) > self::MAX_PASSWORD_LENGTH) {
            $result['message'] = 'Password must be less than ' . self::MAX_PASSWORD_LENGTH . ' characters long';
            return $result;
        }
        
        // Check for required character types
        $hasLower = preg_match('/[a-z]/', $password);
        $hasUpper = preg_match('/[A-Z]/', $password);
        $hasNumber = preg_match('/[0-9]/', $password);
        $hasSpecial = preg_match('/[^a-zA-Z0-9]/', $password);
        
        $score = $hasLower + $hasUpper + $hasNumber + $hasSpecial;
        
        if ($score < 3) {
            $result['message'] = 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters';
            return $result;
        }
        
        // Check against common passwords
        if ($this->isCommonPassword($password)) {
            $result['message'] = 'Password is too common. Please choose a more secure password';
            return $result;
        }
        
        $result['valid'] = true;
        $result['strength'] = $this->calculatePasswordStrength($password);
        return $result;
    }
    
    /**
     * Validate phone number (Argentine format)
     */
    public function validatePhone($phone)
    {
        if (empty($phone)) {
            return true; // Phone is optional
        }
        
        // Remove non-numeric characters
        $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
        
        if (strlen($cleanPhone) > self::MAX_PHONE_LENGTH) {
            return false;
        }
        
        // Argentine phone number patterns
        $patterns = [
            '/^\+54[0-9]{10}$/',     // +54 + area code + number
            '/^54[0-9]{10}$/',       // 54 + area code + number
            '/^[0-9]{10}$/',         // area code + number
            '/^[0-9]{8}$/'           // local number
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $cleanPhone)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Validate name (first name, last name, company name)
     */
    public function validateName($name, $type = 'name')
    {
        if (empty($name)) {
            return ['valid' => false, 'message' => ucfirst($type) . ' is required'];
        }
        
        if (strlen($name) > self::MAX_NAME_LENGTH) {
            return ['valid' => false, 'message' => ucfirst($type) . ' must be less than ' . self::MAX_NAME_LENGTH . ' characters'];
        }
        
        // Allow letters, spaces, hyphens, apostrophes (for names like O'Connor)
        if (!preg_match('/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-\'\.]+$/', $name)) {
            return ['valid' => false, 'message' => ucfirst($type) . ' contains invalid characters'];
        }
        
        // Check for suspicious patterns
        if ($this->containsSuspiciousPatterns($name)) {
            return ['valid' => false, 'message' => ucfirst($type) . ' contains prohibited content'];
        }
        
        return ['valid' => true, 'sanitized' => trim($name)];
    }
    
    /**
     * Validate text content (bio, description, etc.)
     */
    public function validateText($text, $maxLength = null, $required = false)
    {
        $maxLength = $maxLength ?: self::MAX_TEXT_LENGTH;
        
        if ($required && empty($text)) {
            return ['valid' => false, 'message' => 'Text is required'];
        }
        
        if (!empty($text) && strlen($text) > $maxLength) {
            return ['valid' => false, 'message' => "Text must be less than $maxLength characters"];
        }
        
        // Check for suspicious patterns and potential XSS
        if (!empty($text) && $this->containsSuspiciousPatterns($text)) {
            return ['valid' => false, 'message' => 'Text contains prohibited content'];
        }
        
        return ['valid' => true, 'sanitized' => $this->sanitizeText($text)];
    }
    
    /**
     * Validate URL
     */
    public function validateURL($url, $required = false)
    {
        if ($required && empty($url)) {
            return ['valid' => false, 'message' => 'URL is required'];
        }
        
        if (empty($url)) {
            return ['valid' => true, 'sanitized' => ''];
        }
        
        // Add protocol if missing
        if (!preg_match('/^https?:\/\//', $url)) {
            $url = 'https://' . $url;
        }
        
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return ['valid' => false, 'message' => 'Invalid URL format'];
        }
        
        // Security check - prevent internal URLs
        $parsed = parse_url($url);
        if ($this->isInternalURL($parsed)) {
            return ['valid' => false, 'message' => 'Internal URLs are not allowed'];
        }
        
        return ['valid' => true, 'sanitized' => $url];
    }
    
    /**
     * Validate file upload
     */
    public function validateFile($file, $allowedTypes = 'image')
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['valid' => false, 'message' => 'No file uploaded'];
        }
        
        // Check file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            return ['valid' => false, 'message' => 'File size exceeds ' . (self::MAX_FILE_SIZE / 1048576) . 'MB limit'];
        }
        
        // Get file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Check allowed extensions
        $allowed = [];
        if ($allowedTypes === 'image') {
            $allowed = self::ALLOWED_IMAGE_TYPES;
        } elseif ($allowedTypes === 'document') {
            $allowed = self::ALLOWED_DOCUMENT_TYPES;
        } elseif (is_array($allowedTypes)) {
            $allowed = $allowedTypes;
        }
        
        if (!in_array($extension, $allowed)) {
            return ['valid' => false, 'message' => 'File type not allowed. Allowed types: ' . implode(', ', $allowed)];
        }
        
        // Verify MIME type matches extension
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!$this->isValidMimeType($mimeType, $extension)) {
            return ['valid' => false, 'message' => 'File type mismatch detected'];
        }
        
        // Additional security checks for images
        if (in_array($extension, self::ALLOWED_IMAGE_TYPES)) {
            if (!$this->isValidImage($file['tmp_name'])) {
                return ['valid' => false, 'message' => 'Invalid or corrupted image file'];
            }
        }
        
        return ['valid' => true, 'extension' => $extension, 'mime_type' => $mimeType];
    }
    
    /**
     * Validate numeric input
     */
    public function validateNumber($value, $min = null, $max = null, $required = false)
    {
        if ($required && ($value === '' || $value === null)) {
            return ['valid' => false, 'message' => 'Number is required'];
        }
        
        if ($value === '' || $value === null) {
            return ['valid' => true, 'sanitized' => null];
        }
        
        if (!is_numeric($value)) {
            return ['valid' => false, 'message' => 'Must be a valid number'];
        }
        
        $numValue = floatval($value);
        
        if ($min !== null && $numValue < $min) {
            return ['valid' => false, 'message' => "Must be at least $min"];
        }
        
        if ($max !== null && $numValue > $max) {
            return ['valid' => false, 'message' => "Must be at most $max"];
        }
        
        return ['valid' => true, 'sanitized' => $numValue];
    }
    
    /**
     * Sanitize text input
     */
    public function sanitizeText($text)
    {
        if (empty($text)) {
            return '';
        }
        
        // Remove null bytes
        $text = str_replace("\0", '', $text);
        
        // Trim whitespace
        $text = trim($text);
        
        // Convert special characters to HTML entities
        $text = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        return $text;
    }
    
    /**
     * Check for suspicious patterns (SQL injection, XSS, etc.)
     */
    private function containsSuspiciousPatterns($input)
    {
        $patterns = [
            // SQL injection patterns
            '/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/i',
            '/(\bOR\s+1\s*=\s*1\b|\bAND\s+1\s*=\s*1\b)/i',
            '/(\bexec\b|\bexecute\b|\bsp_\w+)/i',
            
            // XSS patterns
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
            
            // File inclusion patterns
            '/\.\.[\/\\\\]/i',
            '/\bfile:\/\//i',
            
            // Command injection patterns
            '/[;&|`$(){}[\]]/i',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if password is commonly used
     */
    private function isCommonPassword($password)
    {
        $commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            'dragon', 'password1', '123123', 'argentina', 'buenos aires'
        ];
        
        return in_array(strtolower($password), $commonPasswords);
    }
    
    /**
     * Calculate password strength score
     */
    private function calculatePasswordStrength($password)
    {
        $score = 0;
        
        // Length bonus
        $score += min(25, strlen($password) * 2);
        
        // Character variety bonus
        if (preg_match('/[a-z]/', $password)) $score += 5;
        if (preg_match('/[A-Z]/', $password)) $score += 5;
        if (preg_match('/[0-9]/', $password)) $score += 5;
        if (preg_match('/[^a-zA-Z0-9]/', $password)) $score += 10;
        
        // Pattern bonus
        if (!preg_match('/(.)\1{2,}/', $password)) $score += 5; // No repeating chars
        if (!preg_match('/123|abc|qwe/i', $password)) $score += 5; // No sequences
        
        return min(100, $score);
    }
    
    /**
     * Validate MIME type matches extension
     */
    private function isValidMimeType($mimeType, $extension)
    {
        $validMimes = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'txt' => ['text/plain']
        ];
        
        return isset($validMimes[$extension]) && in_array($mimeType, $validMimes[$extension]);
    }
    
    /**
     * Validate image file
     */
    private function isValidImage($filePath)
    {
        $imageInfo = @getimagesize($filePath);
        return $imageInfo !== false;
    }
    
    /**
     * Check if URL is internal/local
     */
    private function isInternalURL($parsed)
    {
        if (!isset($parsed['host'])) {
            return true;
        }
        
        $host = strtolower($parsed['host']);
        
        // Check for internal/local addresses
        $internal = [
            'localhost', '127.0.0.1', '0.0.0.0',
            '192.168.', '10.', '172.16.', '172.17.',
            '172.18.', '172.19.', '172.20.', '172.21.',
            '172.22.', '172.23.', '172.24.', '172.25.',
            '172.26.', '172.27.', '172.28.', '172.29.',
            '172.30.', '172.31.'
        ];
        
        foreach ($internal as $pattern) {
            if (strpos($host, $pattern) === 0) {
                return true;
            }
        }
        
        return false;
    }
}
?>