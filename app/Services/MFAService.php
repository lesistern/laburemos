<?php
/**
 * Multi-Factor Authentication Service
 * Basic email-based 2FA implementation for quick security win
 */

namespace LaburAR\Services;

class MFAService {
    private $db;
    private $config;
    
    public function __construct() {
        require_once __DIR__ . '/../Core/SecureDatabase.php';
        require_once __DIR__ . '/../../config/secure_config.php';
        
        $this->db = \LaburAR\Core\SecureDatabase::getInstance();
        $this->config = \SecureConfig::getInstance();
    }
    
    /**
     * Generate and send MFA code via email
     */
    public function generateAndSendCode($userId, $email, $action = 'login') {
        try {
            // Generate 6-digit code
            $code = sprintf('%06d', random_int(100000, 999999));
            $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5 minutes
            
            // Store code in database
            $this->db->secureQuery(
                "INSERT INTO mfa_codes (user_id, code_hash, action, expires_at, created_at) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 code_hash = VALUES(code_hash), 
                 expires_at = VALUES(expires_at), 
                 attempts = 0, 
                 created_at = VALUES(created_at)",
                [
                    $userId,
                    password_hash($code, PASSWORD_ARGON2ID),
                    $action,
                    $expiresAt,
                    date('Y-m-d H:i:s')
                ],
                ['mfa_codes']
            );
            
            // Send email
            $sent = $this->sendMFAEmail($email, $code, $action);
            
            if ($sent) {
                $this->logMFAEvent($userId, 'code_sent', ['action' => $action]);
                return [
                    'success' => true,
                    'message' => 'Código de verificación enviado a tu email',
                    'expires_in' => 300
                ];
            } else {
                throw new \Exception('Failed to send email');
            }
            
        } catch (\Exception $e) {
            $this->logMFAEvent($userId, 'code_send_failed', [
                'error' => $e->getMessage(),
                'action' => $action
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al enviar código de verificación'
            ];
        }
    }
    
    /**
     * Verify MFA code
     */
    public function verifyCode($userId, $code, $action = 'login') {
        try {
            // Get stored code
            $stmt = $this->db->secureQuery(
                "SELECT code_hash, expires_at, attempts 
                 FROM mfa_codes 
                 WHERE user_id = ? AND action = ? AND expires_at > NOW() 
                 LIMIT 1",
                [$userId, $action],
                ['mfa_codes']
            );
            
            $storedCode = $stmt->fetch();
            
            if (!$storedCode) {
                $this->logMFAEvent($userId, 'code_not_found', ['action' => $action]);
                return [
                    'success' => false,
                    'message' => 'Código no válido o expirado'
                ];
            }
            
            // Check attempts limit
            if ($storedCode['attempts'] >= 3) {
                $this->logMFAEvent($userId, 'too_many_attempts', ['action' => $action]);
                $this->invalidateCode($userId, $action);
                return [
                    'success' => false,
                    'message' => 'Demasiados intentos. Solicita un nuevo código.'
                ];
            }
            
            // Verify code
            if (password_verify($code, $storedCode['code_hash'])) {
                // Success - invalidate code
                $this->invalidateCode($userId, $action);
                $this->logMFAEvent($userId, 'code_verified', ['action' => $action]);
                
                return [
                    'success' => true,
                    'message' => 'Código verificado correctamente'
                ];
            } else {
                // Increment attempts
                $this->db->secureQuery(
                    "UPDATE mfa_codes SET attempts = attempts + 1 WHERE user_id = ? AND action = ?",
                    [$userId, $action],
                    ['mfa_codes']
                );
                
                $this->logMFAEvent($userId, 'code_invalid', ['action' => $action]);
                
                return [
                    'success' => false,
                    'message' => 'Código incorrecto'
                ];
            }
            
        } catch (\Exception $e) {
            $this->logMFAEvent($userId, 'verification_error', [
                'error' => $e->getMessage(),
                'action' => $action
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al verificar código'
            ];
        }
    }
    
    /**
     * Check if user needs MFA for action
     */
    public function needsMFA($userId, $action = 'login') {
        // Check user MFA settings
        $stmt = $this->db->secureQuery(
            "SELECT mfa_enabled, mfa_email FROM users WHERE id = ? LIMIT 1",
            [$userId],
            ['users']
        );
        
        $user = $stmt->fetch();
        
        if (!$user || !$user['mfa_enabled']) {
            return false;
        }
        
        // Check recent verification (optional - for better UX)
        $stmt = $this->db->secureQuery(
            "SELECT created_at FROM mfa_verifications 
             WHERE user_id = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) 
             ORDER BY created_at DESC LIMIT 1",
            [$userId, $action],
            ['mfa_verifications']
        );
        
        $recentVerification = $stmt->fetch();
        
        return !$recentVerification; // Need MFA if no recent verification
    }
    
    /**
     * Enable MFA for user
     */
    public function enableMFA($userId, $email) {
        try {
            $this->db->secureQuery(
                "UPDATE users SET mfa_enabled = 1, mfa_email = ?, updated_at = NOW() WHERE id = ?",
                [$email, $userId],
                ['users']
            );
            
            $this->logMFAEvent($userId, 'mfa_enabled');
            
            return [
                'success' => true,
                'message' => 'MFA habilitado correctamente'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al habilitar MFA'
            ];
        }
    }
    
    /**
     * Disable MFA for user
     */
    public function disableMFA($userId) {
        try {
            $this->db->secureQuery(
                "UPDATE users SET mfa_enabled = 0, mfa_email = NULL, updated_at = NOW() WHERE id = ?",
                [$userId],
                ['users']
            );
            
            // Clean up existing codes
            $this->db->secureQuery(
                "DELETE FROM mfa_codes WHERE user_id = ?",
                [$userId],
                ['mfa_codes']
            );
            
            $this->logMFAEvent($userId, 'mfa_disabled');
            
            return [
                'success' => true,
                'message' => 'MFA deshabilitado'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al deshabilitar MFA'
            ];
        }
    }
    
    /**
     * Send MFA code via email
     */
    private function sendMFAEmail($email, $code, $action) {
        $actionText = [
            'login' => 'iniciar sesión',
            'password_reset' => 'restablecer contraseña',
            'profile_update' => 'actualizar perfil',
            'payment' => 'procesar pago'
        ];
        
        $subject = 'Código de verificación LaburAR';
        $message = "
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #6FBFEF; color: white; padding: 20px; text-align: center; }
                .code { font-size: 32px; font-weight: bold; color: #333; text-align: center; 
                        background: #f5f5f5; padding: 20px; margin: 20px 0; letter-spacing: 3px; }
                .footer { background: #f8f9fa; padding: 15px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>🔐 Verificación de Seguridad</h2>
                </div>
                <div style='padding: 20px;'>
                    <p>Hola,</p>
                    <p>Se ha solicitado un código de verificación para <strong>{$actionText[$action]}</strong> en tu cuenta de LaburAR.</p>
                    <p>Tu código de verificación es:</p>
                    <div class='code'>{$code}</div>
                    <p><strong>Este código expira en 5 minutos.</strong></p>
                    <p>Si no solicitaste este código, ignora este email o contacta a soporte.</p>
                </div>
                <div class='footer'>
                    <p>Este es un email automático, no respondas a este mensaje.</p>
                    <p>© 2025 LaburAR - Plataforma de Freelancers Profesional</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: LaburAR Security <security@laburar.com>',
            'Reply-To: noreply@laburar.com',
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 1 (Highest)',
            'X-MSMail-Priority: High'
        ];
        
        return mail($email, $subject, $message, implode("\r\n", $headers));
    }
    
    /**
     * Invalidate MFA code
     */
    private function invalidateCode($userId, $action) {
        $this->db->secureQuery(
            "DELETE FROM mfa_codes WHERE user_id = ? AND action = ?",
            [$userId, $action],
            ['mfa_codes']
        );
        
        // Record successful verification
        $this->db->secureQuery(
            "INSERT INTO mfa_verifications (user_id, action, created_at) VALUES (?, ?, NOW())",
            [$userId, $action],
            ['mfa_verifications']
        );
    }
    
    /**
     * Log MFA events for security monitoring
     */
    private function logMFAEvent($userId, $event, $details = []) {
        $logData = [
            'timestamp' => date('c'),
            'user_id' => $userId,
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'details' => $details
        ];
        
        $logEntry = json_encode($logData) . "\n";
        $logFile = __DIR__ . '/../../logs/mfa.log';
        
        // Ensure logs directory exists
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get MFA statistics for admin dashboard
     */
    public function getMFAStats($days = 30) {
        $stmt = $this->db->secureQuery(
            "SELECT 
                COUNT(DISTINCT user_id) as users_with_mfa,
                COUNT(*) as total_verifications,
                AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_rate
             FROM mfa_verifications 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$days],
            ['mfa_verifications']
        );
        
        return $stmt->fetch();
    }
}