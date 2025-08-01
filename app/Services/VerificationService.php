<?php
/**
 * VerificationService - Sistema de Verificación Empresarial
 * 
 * Maneja verificación de email, teléfono, identidad (CUIL/CUIT),
 * y otros procesos de validación para LaburAR
 * 
 * @version 2.0.0
 * @package LaburAR\Services
 */

namespace LaburAR\Services;

use LaburAR\Services\EmailService;
use LaburAR\Models\User;
use LaburAR\Helpers\Database;

class VerificationService {
    
    private $db;
    private $emailService;
    private $config;
    
    // Verification types
    const TYPE_EMAIL = 'email';
    const TYPE_PHONE = 'phone';
    const TYPE_IDENTITY = 'identity';
    const TYPE_BANK_ACCOUNT = 'bank_account';
    const TYPE_BUSINESS = 'business';
    const TYPE_ADDRESS = 'address';
    
    // Verification status
    const STATUS_PENDING = 'pending';
    const STATUS_VERIFIED = 'verified';
    const STATUS_FAILED = 'failed';
    const STATUS_EXPIRED = 'expired';
    const STATUS_REVOKED = 'revoked';
    
    // Token expiry times (in seconds)
    const EMAIL_TOKEN_EXPIRY = 86400; // 24 hours
    const PHONE_TOKEN_EXPIRY = 600; // 10 minutes
    const IDENTITY_TOKEN_EXPIRY = 172800; // 48 hours
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
        $this->emailService = new EmailService();
        $this->config = $this->getDefaultConfig();
    }
    
    /**
     * Configuración por defecto
     */
    private function getDefaultConfig() {
        return [
            'email_verification_required' => true,
            'phone_verification_required' => false,
            'identity_verification_required' => true,
            'max_verification_attempts' => 5,
            'cooldown_period' => 3600, // 1 hour
            'sms_provider' => $_ENV['SMS_PROVIDER'] ?? 'twilio',
            'afip_api_enabled' => $_ENV['AFIP_API_ENABLED'] ?? false,
            'renaper_api_enabled' => $_ENV['RENAPER_API_ENABLED'] ?? false
        ];
    }
    
    /**
     * Inicia proceso de verificación de email
     */
    public function initiateEmailVerification($user_id) {
        try {
            // Get user
            $user = $this->getUserById($user_id);
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            // Check if already verified
            if ($this->isVerified($user_id, self::TYPE_EMAIL)) {
                return [
                    'success' => true,
                    'message' => 'Email already verified',
                    'already_verified' => true
                ];
            }
            
            // Check rate limiting
            if (!$this->checkRateLimit($user_id, self::TYPE_EMAIL)) {
                throw new \Exception('Too many verification attempts. Please try again later.');
            }
            
            // Generate verification token
            $token = $this->generateSecureToken();
            $expiry = time() + self::EMAIL_TOKEN_EXPIRY;
            
            // Store verification record
            $verification_id = $this->createVerificationRecord([
                'user_id' => $user_id,
                'type' => self::TYPE_EMAIL,
                'token' => $token,
                'data' => json_encode(['email' => $user['email']]),
                'expires_at' => date('Y-m-d H:i:s', $expiry),
                'status' => self::STATUS_PENDING
            ]);
            
            // Send verification email
            $emailResult = $this->emailService->sendVerificationEmail($user, $token);
            
            if ($emailResult['success']) {
                // Log attempt
                $this->logVerificationAttempt($user_id, self::TYPE_EMAIL, 'initiated');
                
                return [
                    'success' => true,
                    'message' => 'Verification email sent successfully',
                    'verification_id' => $verification_id,
                    'expires_in' => self::EMAIL_TOKEN_EXPIRY
                ];
            } else {
                throw new \Exception('Failed to send verification email');
            }
            
        } catch (\Exception $e) {
            $this->logError('Email verification initiation failed', [
                'user_id' => $user_id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Verifica token de email
     */
    public function verifyEmail($token) {
        try {
            // Get verification record
            $verification = $this->getVerificationByToken($token, self::TYPE_EMAIL);
            
            if (!$verification) {
                throw new \Exception('Invalid verification token');
            }
            
            // Check if expired
            if (strtotime($verification['expires_at']) < time()) {
                $this->updateVerificationStatus($verification['id'], self::STATUS_EXPIRED);
                throw new \Exception('Verification token has expired');
            }
            
            // Check if already used
            if ($verification['status'] !== self::STATUS_PENDING) {
                throw new \Exception('Verification token already used');
            }
            
            // Update verification status
            $this->updateVerificationStatus($verification['id'], self::STATUS_VERIFIED);
            
            // Update user email verification status
            $this->updateUserVerificationStatus($verification['user_id'], self::TYPE_EMAIL, true);
            
            // Get user for welcome email
            $user = $this->getUserById($verification['user_id']);
            
            // Send welcome email
            $this->emailService->sendWelcomeEmail($user);
            
            // Log successful verification
            $this->logVerificationAttempt($verification['user_id'], self::TYPE_EMAIL, 'verified');
            
            // Award verification badge if applicable
            $this->awardVerificationBadge($verification['user_id'], self::TYPE_EMAIL);
            
            return [
                'success' => true,
                'message' => 'Email verified successfully',
                'user_id' => $verification['user_id']
            ];
            
        } catch (\Exception $e) {
            $this->logError('Email verification failed', [
                'token' => substr($token, 0, 10) . '...',
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Inicia verificación de teléfono
     */
    public function initiatePhoneVerification($user_id, $phone_number) {
        try {
            // Validate phone number format
            if (!$this->validatePhoneNumber($phone_number)) {
                throw new \Exception('Invalid phone number format');
            }
            
            // Check if phone already used by another user
            if ($this->isPhoneNumberTaken($phone_number, $user_id)) {
                throw new \Exception('Phone number already registered');
            }
            
            // Check rate limiting
            if (!$this->checkRateLimit($user_id, self::TYPE_PHONE)) {
                throw new \Exception('Too many verification attempts. Please try again later.');
            }
            
            // Generate 6-digit code
            $code = $this->generateVerificationCode();
            $expiry = time() + self::PHONE_TOKEN_EXPIRY;
            
            // Store verification record
            $verification_id = $this->createVerificationRecord([
                'user_id' => $user_id,
                'type' => self::TYPE_PHONE,
                'token' => $code,
                'data' => json_encode(['phone' => $phone_number]),
                'expires_at' => date('Y-m-d H:i:s', $expiry),
                'status' => self::STATUS_PENDING
            ]);
            
            // Send SMS
            $smsResult = $this->sendSMS($phone_number, "Tu código de verificación LaburAR es: {$code}");
            
            if ($smsResult) {
                // Update user phone number (unverified)
                $this->updateUserPhone($user_id, $phone_number, false);
                
                // Log attempt
                $this->logVerificationAttempt($user_id, self::TYPE_PHONE, 'initiated');
                
                return [
                    'success' => true,
                    'message' => 'Verification code sent to phone',
                    'verification_id' => $verification_id,
                    'expires_in' => self::PHONE_TOKEN_EXPIRY,
                    'phone_masked' => $this->maskPhoneNumber($phone_number)
                ];
            } else {
                throw new \Exception('Failed to send SMS');
            }
            
        } catch (\Exception $e) {
            $this->logError('Phone verification initiation failed', [
                'user_id' => $user_id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Verifica código de teléfono
     */
    public function verifyPhone($user_id, $code) {
        try {
            // Get active verification for user
            $verification = $this->getActivePhoneVerification($user_id);
            
            if (!$verification) {
                throw new \Exception('No active phone verification found');
            }
            
            // Check if expired
            if (strtotime($verification['expires_at']) < time()) {
                $this->updateVerificationStatus($verification['id'], self::STATUS_EXPIRED);
                throw new \Exception('Verification code has expired');
            }
            
            // Check code
            if ($verification['token'] !== $code) {
                // Increment attempts
                $this->incrementVerificationAttempts($verification['id']);
                
                // Check max attempts
                $attempts = $this->getVerificationAttempts($verification['id']);
                if ($attempts >= $this->config['max_verification_attempts']) {
                    $this->updateVerificationStatus($verification['id'], self::STATUS_FAILED);
                    throw new \Exception('Maximum verification attempts exceeded');
                }
                
                throw new \Exception('Invalid verification code');
            }
            
            // Update verification status
            $this->updateVerificationStatus($verification['id'], self::STATUS_VERIFIED);
            
            // Get phone number from verification data
            $data = json_decode($verification['data'], true);
            $phone_number = $data['phone'];
            
            // Update user phone verification status
            $this->updateUserPhone($user_id, $phone_number, true);
            $this->updateUserVerificationStatus($user_id, self::TYPE_PHONE, true);
            
            // Log successful verification
            $this->logVerificationAttempt($user_id, self::TYPE_PHONE, 'verified');
            
            // Award verification badge
            $this->awardVerificationBadge($user_id, self::TYPE_PHONE);
            
            return [
                'success' => true,
                'message' => 'Phone verified successfully'
            ];
            
        } catch (\Exception $e) {
            $this->logError('Phone verification failed', [
                'user_id' => $user_id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Inicia verificación de identidad (CUIL/CUIT)
     */
    public function initiateIdentityVerification($user_id, $document_type, $document_number) {
        try {
            // Validate document format
            if (!$this->validateDocument($document_type, $document_number)) {
                throw new \Exception('Invalid document format');
            }
            
            // Check if already verified
            if ($this->isVerified($user_id, self::TYPE_IDENTITY)) {
                return [
                    'success' => true,
                    'message' => 'Identity already verified',
                    'already_verified' => true
                ];
            }
            
            // Check if document already used
            if ($this->isDocumentTaken($document_type, $document_number, $user_id)) {
                throw new \Exception('Document already registered');
            }
            
            // Create verification record
            $verification_id = $this->createVerificationRecord([
                'user_id' => $user_id,
                'type' => self::TYPE_IDENTITY,
                'token' => $this->generateSecureToken(),
                'data' => json_encode([
                    'document_type' => $document_type,
                    'document_number' => $document_number
                ]),
                'expires_at' => date('Y-m-d H:i:s', time() + self::IDENTITY_TOKEN_EXPIRY),
                'status' => self::STATUS_PENDING
            ]);
            
            // If AFIP/RENAPER APIs are enabled, verify automatically
            if ($this->config['afip_api_enabled'] || $this->config['renaper_api_enabled']) {
                $verificationResult = $this->verifyIdentityWithAPI($document_type, $document_number);
                
                if ($verificationResult['verified']) {
                    // Update verification status
                    $this->updateVerificationStatus($verification_id, self::STATUS_VERIFIED);
                    
                    // Update user identity verification
                    $this->updateUserIdentity($user_id, $document_type, $document_number, true);
                    $this->updateUserVerificationStatus($user_id, self::TYPE_IDENTITY, true);
                    
                    // Log successful verification
                    $this->logVerificationAttempt($user_id, self::TYPE_IDENTITY, 'verified');
                    
                    // Award verification badge
                    $this->awardVerificationBadge($user_id, self::TYPE_IDENTITY);
                    
                    return [
                        'success' => true,
                        'message' => 'Identity verified successfully',
                        'verification_id' => $verification_id,
                        'auto_verified' => true
                    ];
                } else {
                    $this->updateVerificationStatus($verification_id, self::STATUS_FAILED);
                    throw new \Exception('Identity verification failed: ' . $verificationResult['error']);
                }
            } else {
                // Manual verification required
                return [
                    'success' => true,
                    'message' => 'Identity verification pending manual review',
                    'verification_id' => $verification_id,
                    'requires_manual_review' => true,
                    'upload_url' => '/api/verification/upload-documents'
                ];
            }
            
        } catch (\Exception $e) {
            $this->logError('Identity verification initiation failed', [
                'user_id' => $user_id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Sube documentos para verificación manual
     */
    public function uploadVerificationDocuments($verification_id, $files) {
        try {
            // Get verification record
            $verification = $this->getVerificationById($verification_id);
            
            if (!$verification || $verification['type'] !== self::TYPE_IDENTITY) {
                throw new \Exception('Invalid verification ID');
            }
            
            if ($verification['status'] !== self::STATUS_PENDING) {
                throw new \Exception('Verification already processed');
            }
            
            // Validate files
            $allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            $max_size = 5 * 1024 * 1024; // 5MB
            
            $uploaded_files = [];
            
            foreach ($files as $file) {
                if (!in_array($file['type'], $allowed_types)) {
                    throw new \Exception('Invalid file type: ' . $file['name']);
                }
                
                if ($file['size'] > $max_size) {
                    throw new \Exception('File too large: ' . $file['name']);
                }
                
                // Generate secure filename
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = $verification_id . '_' . uniqid() . '.' . $extension;
                $upload_path = __DIR__ . '/../uploads/verifications/' . $filename;
                
                // Ensure directory exists
                $upload_dir = dirname($upload_path);
                if (!is_dir($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                // Move uploaded file
                if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
                    throw new \Exception('Failed to upload file: ' . $file['name']);
                }
                
                $uploaded_files[] = [
                    'filename' => $filename,
                    'original_name' => $file['name'],
                    'type' => $file['type'],
                    'size' => $file['size']
                ];
            }
            
            // Update verification record with uploaded files
            $data = json_decode($verification['data'], true);
            $data['uploaded_files'] = $uploaded_files;
            
            $this->updateVerificationData($verification_id, $data);
            
            // Notify admin for manual review
            $this->notifyAdminForReview($verification_id);
            
            return [
                'success' => true,
                'message' => 'Documents uploaded successfully',
                'files_uploaded' => count($uploaded_files),
                'review_time' => '24-48 hours'
            ];
            
        } catch (\Exception $e) {
            $this->logError('Document upload failed', [
                'verification_id' => $verification_id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Resend verification (email or phone)
     */
    public function resendVerification($user_id, $type) {
        try {
            // Check cooldown period
            $last_attempt = $this->getLastVerificationAttempt($user_id, $type);
            
            if ($last_attempt) {
                $time_since_last = time() - strtotime($last_attempt['created_at']);
                $cooldown_remaining = $this->config['cooldown_period'] - $time_since_last;
                
                if ($cooldown_remaining > 0) {
                    throw new \Exception('Please wait ' . ceil($cooldown_remaining / 60) . ' minutes before requesting again');
                }
            }
            
            // Invalidate previous pending verifications
            $this->invalidatePendingVerifications($user_id, $type);
            
            // Initiate new verification
            if ($type === self::TYPE_EMAIL) {
                return $this->initiateEmailVerification($user_id);
            } elseif ($type === self::TYPE_PHONE) {
                // Get user's phone number
                $user = $this->getUserById($user_id);
                if (!$user['phone']) {
                    throw new \Exception('No phone number on file');
                }
                return $this->initiatePhoneVerification($user_id, $user['phone']);
            } else {
                throw new \Exception('Invalid verification type');
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get user verification status
     */
    public function getUserVerificationStatus($user_id) {
        try {
            $user = $this->getUserById($user_id);
            
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            $verifications = [
                'email' => [
                    'verified' => $user['email_verified_at'] !== null,
                    'verified_at' => $user['email_verified_at'],
                    'value' => $user['email']
                ],
                'phone' => [
                    'verified' => $user['phone_verified_at'] !== null,
                    'verified_at' => $user['phone_verified_at'],
                    'value' => $user['phone'] ? $this->maskPhoneNumber($user['phone']) : null
                ],
                'identity' => [
                    'verified' => $user['identity_verified_at'] !== null,
                    'verified_at' => $user['identity_verified_at'],
                    'document_type' => $user['document_type'],
                    'document_masked' => $user['document_number'] ? $this->maskDocument($user['document_number']) : null
                ]
            ];
            
            // Calculate verification level
            $verified_count = 0;
            foreach ($verifications as $v) {
                if ($v['verified']) $verified_count++;
            }
            
            $verification_level = $this->calculateVerificationLevel($verified_count);
            
            // Get pending verifications
            $pending = $this->getPendingVerifications($user_id);
            
            return [
                'success' => true,
                'user_id' => $user_id,
                'verifications' => $verifications,
                'verification_level' => $verification_level,
                'pending_verifications' => $pending,
                'badges' => $this->getUserVerificationBadges($user_id)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Verify identity with external API (AFIP/RENAPER)
     */
    private function verifyIdentityWithAPI($document_type, $document_number) {
        // TODO: Implement actual API calls
        // This is a placeholder for API integration
        
        // Simulate API verification
        if ($this->config['afip_api_enabled'] && $document_type === 'CUIT') {
            // Simulate AFIP API call
            return [
                'verified' => true,
                'data' => [
                    'razon_social' => 'EMPRESA DEMO S.A.',
                    'estado' => 'ACTIVO'
                ]
            ];
        } elseif ($this->config['renaper_api_enabled'] && $document_type === 'DNI') {
            // Simulate RENAPER API call
            return [
                'verified' => true,
                'data' => [
                    'nombre' => 'JUAN',
                    'apellido' => 'PEREZ',
                    'fecha_nacimiento' => '1990-01-01'
                ]
            ];
        }
        
        return [
            'verified' => false,
            'error' => 'API verification not available'
        ];
    }
    
    /**
     * Send SMS using configured provider
     */
    private function sendSMS($phone_number, $message) {
        // TODO: Implement actual SMS sending
        // This is a placeholder for SMS integration
        
        $this->logInfo('SMS sent', [
            'phone' => $this->maskPhoneNumber($phone_number),
            'message_length' => strlen($message)
        ]);
        
        // Simulate successful SMS sending
        return true;
    }
    
    /**
     * Database helper methods
     */
    private function getUserById($user_id) {
        $stmt = $this->db->prepare("
            SELECT * FROM users WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    private function createVerificationRecord($data) {
        $stmt = $this->db->prepare("
            INSERT INTO verifications (user_id, type, token, data, expires_at, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['type'],
            $data['token'],
            $data['data'],
            $data['expires_at'],
            $data['status']
        ]);
        
        return $this->db->lastInsertId();
    }
    
    private function getVerificationByToken($token, $type) {
        $stmt = $this->db->prepare("
            SELECT * FROM verifications 
            WHERE token = ? AND type = ?
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$token, $type]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    private function getVerificationById($id) {
        $stmt = $this->db->prepare("
            SELECT * FROM verifications WHERE id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    private function getActivePhoneVerification($user_id) {
        $stmt = $this->db->prepare("
            SELECT * FROM verifications 
            WHERE user_id = ? AND type = ? AND status = ?
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$user_id, self::TYPE_PHONE, self::STATUS_PENDING]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    private function updateVerificationStatus($verification_id, $status) {
        $stmt = $this->db->prepare("
            UPDATE verifications 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$status, $verification_id]);
    }
    
    private function updateVerificationData($verification_id, $data) {
        $stmt = $this->db->prepare("
            UPDATE verifications 
            SET data = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([json_encode($data), $verification_id]);
    }
    
    private function updateUserVerificationStatus($user_id, $type, $verified) {
        $column = $type . '_verified_at';
        $value = $verified ? date('Y-m-d H:i:s') : null;
        
        $stmt = $this->db->prepare("
            UPDATE users 
            SET {$column} = ?
            WHERE id = ?
        ");
        $stmt->execute([$value, $user_id]);
    }
    
    private function updateUserPhone($user_id, $phone, $verified) {
        $stmt = $this->db->prepare("
            UPDATE users 
            SET phone = ?, phone_verified_at = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $phone,
            $verified ? date('Y-m-d H:i:s') : null,
            $user_id
        ]);
    }
    
    private function updateUserIdentity($user_id, $document_type, $document_number, $verified) {
        $stmt = $this->db->prepare("
            UPDATE users 
            SET document_type = ?, document_number = ?, identity_verified_at = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $document_type,
            $document_number,
            $verified ? date('Y-m-d H:i:s') : null,
            $user_id
        ]);
    }
    
    private function incrementVerificationAttempts($verification_id) {
        $stmt = $this->db->prepare("
            UPDATE verifications 
            SET attempts = attempts + 1
            WHERE id = ?
        ");
        $stmt->execute([$verification_id]);
    }
    
    private function getVerificationAttempts($verification_id) {
        $stmt = $this->db->prepare("
            SELECT attempts FROM verifications WHERE id = ?
        ");
        $stmt->execute([$verification_id]);
        return $stmt->fetchColumn();
    }
    
    private function invalidatePendingVerifications($user_id, $type) {
        $stmt = $this->db->prepare("
            UPDATE verifications 
            SET status = ?
            WHERE user_id = ? AND type = ? AND status = ?
        ");
        $stmt->execute([
            self::STATUS_EXPIRED,
            $user_id,
            $type,
            self::STATUS_PENDING
        ]);
    }
    
    private function getPendingVerifications($user_id) {
        $stmt = $this->db->prepare("
            SELECT type, created_at, expires_at 
            FROM verifications 
            WHERE user_id = ? AND status = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id, self::STATUS_PENDING]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Validation methods
     */
    private function validatePhoneNumber($phone) {
        // Argentine phone number format
        $pattern = '/^(\+54)?(\s)?((11|[2368]\d)?)(\s)?(\d{4})(\s)?(\d{4})$/';
        return preg_match($pattern, $phone);
    }
    
    private function validateDocument($type, $number) {
        if ($type === 'DNI') {
            // DNI: 7-8 digits
            return preg_match('/^\d{7,8}$/', $number);
        } elseif ($type === 'CUIL' || $type === 'CUIT') {
            // CUIL/CUIT: 11 digits, format XX-XXXXXXXX-X
            $pattern = '/^(20|23|24|27|30|33|34)(\d{8})(\d)$/';
            if (!preg_match($pattern, str_replace('-', '', $number))) {
                return false;
            }
            // Validate check digit
            return $this->validateCUILCUITCheckDigit(str_replace('-', '', $number));
        }
        return false;
    }
    
    private function validateCUILCUITCheckDigit($cuit) {
        $cuit = str_replace('-', '', $cuit);
        if (strlen($cuit) != 11) return false;
        
        $mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $sum += $cuit[$i] * $mult[$i];
        }
        
        $resto = $sum % 11;
        $checkDigit = $resto == 0 ? 0 : ($resto == 1 ? 9 : 11 - $resto);
        
        return $checkDigit == $cuit[10];
    }
    
    private function isPhoneNumberTaken($phone, $exclude_user_id = null) {
        $sql = "SELECT COUNT(*) FROM users WHERE phone = ?";
        $params = [$phone];
        
        if ($exclude_user_id) {
            $sql .= " AND id != ?";
            $params[] = $exclude_user_id;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
    
    private function isDocumentTaken($type, $number, $exclude_user_id = null) {
        $sql = "SELECT COUNT(*) FROM users WHERE document_type = ? AND document_number = ?";
        $params = [$type, $number];
        
        if ($exclude_user_id) {
            $sql .= " AND id != ?";
            $params[] = $exclude_user_id;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
    
    private function isVerified($user_id, $type) {
        $user = $this->getUserById($user_id);
        $column = $type . '_verified_at';
        return isset($user[$column]) && $user[$column] !== null;
    }
    
    /**
     * Rate limiting
     */
    private function checkRateLimit($user_id, $type) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as attempts 
            FROM verification_attempts 
            WHERE user_id = ? AND type = ? AND created_at > ?
        ");
        
        $time_limit = date('Y-m-d H:i:s', time() - 3600); // Last hour
        $stmt->execute([$user_id, $type, $time_limit]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['attempts'] < $this->config['max_verification_attempts'];
    }
    
    private function logVerificationAttempt($user_id, $type, $action) {
        $stmt = $this->db->prepare("
            INSERT INTO verification_attempts (user_id, type, action, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $user_id,
            $type,
            $action,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
    
    private function getLastVerificationAttempt($user_id, $type) {
        $stmt = $this->db->prepare("
            SELECT * FROM verification_attempts 
            WHERE user_id = ? AND type = ? AND action = 'initiated'
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$user_id, $type]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Helper methods
     */
    private function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    private function generateVerificationCode($length = 6) {
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= mt_rand(0, 9);
        }
        return $code;
    }
    
    private function maskPhoneNumber($phone) {
        // Show only last 4 digits
        return str_repeat('*', strlen($phone) - 4) . substr($phone, -4);
    }
    
    private function maskDocument($document) {
        // Show only last 3 digits
        return str_repeat('*', strlen($document) - 3) . substr($document, -3);
    }
    
    private function calculateVerificationLevel($verified_count) {
        if ($verified_count >= 3) {
            return 'full';
        } elseif ($verified_count >= 2) {
            return 'advanced';
        } elseif ($verified_count >= 1) {
            return 'basic';
        } else {
            return 'none';
        }
    }
    
    /**
     * Badge system
     */
    private function awardVerificationBadge($user_id, $type) {
        $badges = [
            self::TYPE_EMAIL => 'email_verified',
            self::TYPE_PHONE => 'phone_verified',
            self::TYPE_IDENTITY => 'identity_verified'
        ];
        
        if (isset($badges[$type])) {
            $this->awardBadge($user_id, $badges[$type]);
        }
        
        // Check for combined badges
        $user = $this->getUserById($user_id);
        if ($user['email_verified_at'] && $user['phone_verified_at'] && $user['identity_verified_at']) {
            $this->awardBadge($user_id, 'fully_verified');
        }
    }
    
    private function awardBadge($user_id, $badge_code) {
        // Check if already has badge
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM user_badges 
            WHERE user_id = ? AND badge_code = ?
        ");
        $stmt->execute([$user_id, $badge_code]);
        
        if ($stmt->fetchColumn() == 0) {
            // Award badge
            $stmt = $this->db->prepare("
                INSERT INTO user_badges (user_id, badge_code, awarded_at)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$user_id, $badge_code]);
            
            // Notify user
            $this->notifyUserBadgeAwarded($user_id, $badge_code);
        }
    }
    
    private function getUserVerificationBadges($user_id) {
        $stmt = $this->db->prepare("
            SELECT badge_code, awarded_at 
            FROM user_badges 
            WHERE user_id = ? AND badge_code IN ('email_verified', 'phone_verified', 'identity_verified', 'fully_verified')
            ORDER BY awarded_at DESC
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Notification methods
     */
    private function notifyAdminForReview($verification_id) {
        // TODO: Implement admin notification
        $this->logInfo('Admin notified for verification review', [
            'verification_id' => $verification_id
        ]);
    }
    
    private function notifyUserBadgeAwarded($user_id, $badge_code) {
        // TODO: Implement user notification
        $this->logInfo('User notified of badge award', [
            'user_id' => $user_id,
            'badge' => $badge_code
        ]);
    }
    
    /**
     * Logging methods
     */
    private function logInfo($message, $context = []) {
        error_log('[VerificationService] INFO: ' . $message . ' - ' . json_encode($context));
    }
    
    private function logError($message, $context = []) {
        error_log('[VerificationService] ERROR: ' . $message . ' - ' . json_encode($context));
    }
}
?>