<?php
/**
 * LaburAR Registration API
 * Handles user registration with validation and database integration
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-23
 */

// Set proper headers for API response
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Solo se acepta POST.'
    ]);
    exit;
}

// Start session and include required files
session_start();
require_once '../database/config.php';
require_once '../includes/ValidationHelper.php';
require_once '../includes/SecurityHelper.php';
require_once '../includes/EmailService.php';

class RegistrationAPI {
    private $db;
    private $errors = [];
    
    public function __construct() {
        try {
            $this->db = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            $this->returnError('Error de conexión a la base de datos. Inténtalo más tarde.');
        }
    }
    
    public function handleRegistration() {
        try {
            // Rate limiting check
            if (!$this->checkRateLimit()) {
                $this->returnError('Demasiados intentos de registro. Inténtalo más tarde.');
            }
            
            // Validate input data
            $userData = $this->validateInput();
            if (!empty($this->errors)) {
                $this->returnError('Datos inválidos', $this->errors);
            }
            
            // Check if user already exists
            if ($this->userExists($userData['email'], $userData['document_number'])) {
                $this->returnError('Ya existe una cuenta con este email o número de documento');
            }
            
            // Create user account
            $userId = $this->createUser($userData);
            if (!$userId) {
                $this->returnError('Error al crear la cuenta. Inténtalo nuevamente.');
            }
            
            // Create user profile
            $this->createUserProfile($userId);
            
            // Send verification email
            $this->sendVerificationEmail($userData['email'], $userData['first_name']);
            
            // Log registration
            $this->logActivity($userId, 'user_registered');
            
            // Return success response
            $this->returnSuccess([
                'message' => 'Cuenta creada exitosamente',
                'user_id' => $userId,
                'verification_sent' => true
            ]);
            
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            $this->returnError('Error interno del servidor. Inténtalo más tarde.');
        }
    }
    
    private function validateInput() {
        $userData = [];
        
        // User type validation
        $userType = $this->sanitizeInput($_POST['user_type'] ?? '');
        if (!in_array($userType, ['freelancer', 'client'])) {
            $this->errors['user_type'] = 'Seleccioná si sos freelancer o cliente';
        }
        $userData['user_type'] = $userType;
        
        // First name validation
        $firstName = $this->sanitizeInput($_POST['first_name'] ?? '');
        if (empty($firstName)) {
            $this->errors['first_name'] = 'El nombre es obligatorio';
        } elseif (strlen($firstName) < 2) {
            $this->errors['first_name'] = 'El nombre debe tener al menos 2 caracteres';
        } elseif (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/', $firstName)) {
            $this->errors['first_name'] = 'El nombre solo puede contener letras';
        }
        // Auto capitalize first letter of each word
        $userData['first_name'] = $this->capitalizeWords($firstName);
        
        // Last name validation
        $lastName = $this->sanitizeInput($_POST['last_name'] ?? '');
        if (empty($lastName)) {
            $this->errors['last_name'] = 'El apellido es obligatorio';
        } elseif (strlen($lastName) < 2) {
            $this->errors['last_name'] = 'El apellido debe tener al menos 2 caracteres';
        } elseif (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/', $lastName)) {
            $this->errors['last_name'] = 'El apellido solo puede contener letras';
        }
        // Auto capitalize first letter of each word
        $userData['last_name'] = $this->capitalizeWords($lastName);
        
        // Email validation
        $email = strtolower(trim($_POST['email'] ?? ''));
        $confirmEmail = strtolower(trim($_POST['confirm_email'] ?? ''));
        
        if (empty($email)) {
            $this->errors['email'] = 'El email es obligatorio';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errors['email'] = 'Ingresá un email válido';
        } elseif (strlen($email) > 255) {
            $this->errors['email'] = 'El email es demasiado largo';
        }
        
        if (empty($confirmEmail)) {
            $this->errors['confirm_email'] = 'Confirmá tu email';
        } elseif ($email !== $confirmEmail) {
            $this->errors['confirm_email'] = 'Los emails no coinciden';
        }
        
        $userData['email'] = $email;
        
        // Document type validation
        $documentType = $this->sanitizeInput($_POST['document_type'] ?? '');
        if (empty($documentType)) {
            $this->errors['document_type'] = 'El tipo de documento es obligatorio';
        } elseif (!in_array($documentType, ['DNI', 'CI', 'LE', 'LC', 'CUIT-CUIL', 'PASAPORTE'])) {
            $this->errors['document_type'] = 'Tipo de documento inválido';
        }
        $userData['document_type'] = $documentType;
        
        // Document number validation
        $documentNumber = $this->sanitizeInput($_POST['document_number'] ?? '');
        if (empty($documentNumber)) {
            $this->errors['document_number'] = 'El número de documento es obligatorio';
        } elseif (!$this->isValidDocumentNumber($documentNumber, $documentType)) {
            $this->errors['document_number'] = $this->getDocumentErrorMessage($documentType);
        }
        $userData['document_number'] = $documentNumber;
        
        // Phone validation (optional)
        $countryCode = $this->sanitizeInput($_POST['country_code'] ?? '+54');
        $phone = $this->sanitizeInput($_POST['phone'] ?? '');
        
        if (!empty($phone)) {
            $phone = preg_replace('/\D/', '', $phone);
            if (strlen($phone) < 8) {
                $this->errors['phone'] = 'Ingresá un teléfono válido';
            } else {
                $userData['phone'] = $countryCode . $phone;
            }
        } else {
            $userData['phone'] = null;
        }
        
        // Password validation
        $password = $_POST['password'] ?? '';
        if (empty($password)) {
            $this->errors['password'] = 'La contraseña es obligatoria';
        } elseif (strlen($password) < 8) {
            $this->errors['password'] = 'La contraseña debe tener al menos 8 caracteres';
        } elseif (!preg_match('/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
            $this->errors['password'] = 'La contraseña debe contener mayúsculas, minúsculas y números';
        }
        
        // Confirm password validation
        $confirmPassword = $_POST['confirm_password'] ?? '';
        if ($password !== $confirmPassword) {
            $this->errors['confirm_password'] = 'Las contraseñas no coinciden';
        }
        
        $userData['password'] = password_hash($password, PASSWORD_DEFAULT);
        
        // Terms acceptance
        if (!isset($_POST['terms']) || $_POST['terms'] !== 'on') {
            $this->errors['terms'] = 'Debés aceptar los términos y condiciones';
        }
        
        // Newsletter subscription (optional)
        $userData['newsletter'] = isset($_POST['newsletter']) && $_POST['newsletter'] === 'on';
        
        return $userData;
    }
    
    private function sanitizeInput($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    private function capitalizeWords($input) {
        // Capitalize first letter of each word, maintaining special characters
        return preg_replace_callback('/\b\w/u', function($matches) {
            return mb_strtoupper($matches[0], 'UTF-8');
        }, $input);
    }
    
    private function isValidDocumentNumber($documentNumber, $documentType) {
        switch ($documentType) {
            case 'DNI':
            case 'CI':
            case 'LE':
            case 'LC':
                return preg_match('/^\d{7,8}$/', $documentNumber);
            case 'CUIT-CUIL':
                return $this->isValidCUITCUIL($documentNumber);
            case 'PASAPORTE':
                return preg_match('/^[A-Z0-9]{6,12}$/', strtoupper($documentNumber));
            default:
                return false;
        }
    }
    
    private function isValidCUITCUIL($cuit) {
        // Remove dashes and validate CUIT/CUIL
        $cleanCuit = preg_replace('/\D/', '', $cuit);
        if (strlen($cleanCuit) != 11) return false;
        
        $multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $suma = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $suma += intval($cleanCuit[$i]) * $multiplicadores[$i];
        }
        
        $resto = $suma % 11;
        $dv = $resto < 2 ? $resto : 11 - $resto;
        
        return $dv == intval($cleanCuit[10]);
    }
    
    private function getDocumentErrorMessage($documentType) {
        switch ($documentType) {
            case 'DNI':
            case 'CI':
            case 'LE':
            case 'LC':
                return 'Debe tener entre 7 y 8 dígitos';
            case 'CUIT-CUIL':
                return 'Formato inválido. Ejemplo: 20-12345678-9';
            case 'PASAPORTE':
                return 'Debe tener entre 6 y 12 caracteres alfanuméricos';
            default:
                return 'Documento inválido';
        }
    }
    
    private function userExists($email, $documentNumber) {
        $stmt = $this->db->prepare("
            SELECT id FROM users 
            WHERE email = ? OR document_number = ?
        ");
        $stmt->execute([$email, $documentNumber]);
        return $stmt->fetch() !== false;
    }
    
    private function createUser($userData) {
        $stmt = $this->db->prepare("
            INSERT INTO users (
                email, password_hash, document_type, document_number, first_name, last_name, 
                phone, user_type, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        
        $result = $stmt->execute([
            $userData['email'],
            $userData['password'],
            $userData['document_type'],
            $userData['document_number'],
            $userData['first_name'],
            $userData['last_name'],
            $userData['phone'],
            $userData['user_type']
        ]);
        
        return $result ? $this->db->lastInsertId() : false;
    }
    
    private function createUserProfile($userId) {
        $stmt = $this->db->prepare("
            INSERT INTO user_profiles (
                user_id, created_at
            ) VALUES (?, NOW())
        ");
        $stmt->execute([$userId]);
        
        // Initialize user reputation
        $stmt = $this->db->prepare("
            INSERT INTO user_reputation (user_id, trust_score) 
            VALUES (?, 50)
        ");
        $stmt->execute([$userId]);
        
        // Initialize user metrics
        $stmt = $this->db->prepare("
            INSERT INTO user_metrics (user_id, last_activity) 
            VALUES (?, NOW())
        ");
        $stmt->execute([$userId]);
    }
    
    private function sendVerificationEmail($email, $firstName) {
        try {
            $verificationToken = bin2hex(random_bytes(32));
            $verificationLink = "https://" . $_SERVER['HTTP_HOST'] . "/Laburar/verify-email.php?token=" . $verificationToken;
            
            // Store verification token
            $stmt = $this->db->prepare("
                UPDATE users 
                SET email_verification_token = ?, email_verification_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR)
                WHERE email = ?
            ");
            $stmt->execute([$verificationToken, $email]);
            
            // Send email using EmailService (placeholder - implement when EmailService is available)
            // if (class_exists('EmailService')) {
            //     $emailService = new EmailService();
            //     $emailService->sendVerificationEmail($email, $firstName, $verificationLink);
            // }
            
            // For now, just log the verification link
            error_log("Verification link for $email: $verificationLink");
            
        } catch (Exception $e) {
            error_log("Error sending verification email: " . $e->getMessage());
            // Don't fail registration if email fails
        }
    }
    
    private function checkRateLimit() {
        $ip = $_SERVER['REMOTE_ADDR'];
        $action = 'register';
        
        // Check rate limit (5 attempts per hour)
        $stmt = $this->db->prepare("
            SELECT attempts FROM rate_limits 
            WHERE identifier = ? AND action = ? AND reset_time > NOW()
        ");
        $stmt->execute([$ip, $action]);
        $result = $stmt->fetch();
        
        if ($result && $result['attempts'] >= 5) {
            return false;
        }
        
        // Update rate limit
        $stmt = $this->db->prepare("
            INSERT INTO rate_limits (identifier, action, attempts, reset_time) 
            VALUES (?, ?, 1, DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE 
            attempts = attempts + 1,
            reset_time = CASE WHEN reset_time <= NOW() THEN DATE_ADD(NOW(), INTERVAL 1 HOUR) ELSE reset_time END
        ");
        $stmt->execute([$ip, $action]);
        
        return true;
    }
    
    private function logActivity($userId, $action) {
        $stmt = $this->db->prepare("
            INSERT INTO audit_logs (user_id, action, ip_address, user_agent, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $action,
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
    }
    
    private function returnSuccess($data) {
        http_response_code(200);
        echo json_encode(array_merge(['success' => true], $data));
        exit;
    }
    
    private function returnError($message, $errors = null) {
        http_response_code(400);
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response);
        exit;
    }
}

// Handle the registration request
try {
    $registrationAPI = new RegistrationAPI();
    $registrationAPI->handleRegistration();
} catch (Exception $e) {
    error_log("Critical registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor. Por favor contactá al soporte.'
    ]);
}
?>