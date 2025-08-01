<?php
/**
 * TOTP (Time-based One-Time Password) Service
 * Google Authenticator / Authy compatible 2FA implementation
 */

namespace LaburAR\Services;

class TOTPService {
    private $db;
    private $issuer = 'LaburAR';
    
    public function __construct() {
        require_once __DIR__ . '/../Core/SecureDatabase.php';
        $this->db = \LaburAR\Core\SecureDatabase::getInstance();
    }
    
    /**
     * Generate TOTP secret for new user
     */
    public function generateSecret($length = 32) {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
        $secret = '';
        
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        
        return $secret;
    }
    
    /**
     * Enable TOTP for user
     */
    public function enableTOTP($userId, $email) {
        try {
            // Generate new secret
            $secret = $this->generateSecret();
            
            // Store secret in database (encrypted)
            $this->db->secureQuery(
                "UPDATE users SET 
                 totp_secret = ?, 
                 totp_enabled = 0, 
                 totp_backup_codes = ?,
                 updated_at = NOW() 
                 WHERE id = ?",
                [
                    $this->encryptSecret($secret),
                    json_encode($this->generateBackupCodes()),
                    $userId
                ],
                ['users']
            );
            
            // Generate QR code data
            $qrCodeUrl = $this->generateQRCodeURL($email, $secret);
            
            $this->logTOTPEvent($userId, 'totp_secret_generated');
            
            return [
                'success' => true,
                'secret' => $secret,
                'qr_code_url' => $qrCodeUrl,
                'backup_codes' => $this->generateBackupCodes(),
                'message' => 'TOTP configurado. Escanea el código QR con tu app.'
            ];
            
        } catch (\Exception $e) {
            $this->logTOTPEvent($userId, 'totp_setup_failed', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'message' => 'Error configurando TOTP'
            ];
        }
    }
    
    /**
     * Verify TOTP setup with initial code
     */
    public function verifyTOTPSetup($userId, $code) {
        try {
            // Get user's TOTP secret
            $stmt = $this->db->secureQuery(
                "SELECT totp_secret FROM users WHERE id = ? AND totp_secret IS NOT NULL LIMIT 1",
                [$userId],
                ['users']
            );
            
            $user = $stmt->fetch();
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'TOTP no configurado para este usuario'
                ];
            }
            
            $secret = $this->decryptSecret($user['totp_secret']);
            
            // Verify the code
            if ($this->verifyTOTPCode($secret, $code)) {
                // Enable TOTP for user
                $this->db->secureQuery(
                    "UPDATE users SET totp_enabled = 1, totp_verified_at = NOW() WHERE id = ?",
                    [$userId],
                    ['users']
                );
                
                $this->logTOTPEvent($userId, 'totp_enabled');
                
                return [
                    'success' => true,
                    'message' => 'TOTP habilitado exitosamente'
                ];
            } else {
                $this->logTOTPEvent($userId, 'totp_verification_failed');
                
                return [
                    'success' => false,
                    'message' => 'Código TOTP incorrecto'
                ];
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error verificando TOTP'
            ];
        }
    }
    
    /**
     * Verify TOTP code for authentication
     */
    public function verifyTOTP($userId, $code) {
        try {
            // Get user's TOTP secret
            $stmt = $this->db->secureQuery(
                "SELECT totp_secret, totp_enabled, totp_backup_codes 
                 FROM users 
                 WHERE id = ? AND totp_enabled = 1 
                 LIMIT 1",
                [$userId],
                ['users']
            );
            
            $user = $stmt->fetch();
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'TOTP no habilitado para este usuario'
                ];
            }
            
            $secret = $this->decryptSecret($user['totp_secret']);
            
            // Check if it's a backup code
            if (strlen($code) === 8 && ctype_alnum($code)) {
                return $this->verifyBackupCode($userId, $code, $user['totp_backup_codes']);
            }
            
            // Verify TOTP code
            if ($this->verifyTOTPCode($secret, $code)) {
                $this->logTOTPEvent($userId, 'totp_verified');
                
                return [
                    'success' => true,
                    'message' => 'Código TOTP verificado'
                ];
            } else {
                $this->logTOTPEvent($userId, 'totp_invalid');
                
                return [
                    'success' => false,
                    'message' => 'Código TOTP incorrecto'
                ];
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error verificando TOTP'
            ];
        }
    }
    
    /**
     * Disable TOTP for user
     */
    public function disableTOTP($userId) {
        try {
            $this->db->secureQuery(
                "UPDATE users SET 
                 totp_secret = NULL, 
                 totp_enabled = 0, 
                 totp_backup_codes = NULL,
                 totp_verified_at = NULL,
                 updated_at = NOW() 
                 WHERE id = ?",
                [$userId],
                ['users']
            );
            
            $this->logTOTPEvent($userId, 'totp_disabled');
            
            return [
                'success' => true,
                'message' => 'TOTP deshabilitado'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error deshabilitando TOTP'
            ];
        }
    }
    
    /**
     * Generate new backup codes
     */
    public function generateNewBackupCodes($userId) {
        try {
            $backupCodes = $this->generateBackupCodes();
            
            $this->db->secureQuery(
                "UPDATE users SET totp_backup_codes = ?, updated_at = NOW() WHERE id = ?",
                [json_encode($backupCodes), $userId],
                ['users']
            );
            
            $this->logTOTPEvent($userId, 'backup_codes_regenerated');
            
            return [
                'success' => true,
                'backup_codes' => $backupCodes,
                'message' => 'Nuevos códigos de respaldo generados'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error generando códigos de respaldo'
            ];
        }
    }
    
    /**
     * Check if user has TOTP enabled
     */
    public function isTOTPEnabled($userId) {
        $stmt = $this->db->secureQuery(
            "SELECT totp_enabled FROM users WHERE id = ? LIMIT 1",
            [$userId],
            ['users']
        );
        
        $user = $stmt->fetch();
        return $user && (bool) $user['totp_enabled'];
    }
    
    /**
     * Generate TOTP code for given secret and time
     */
    private function generateTOTPCode($secret, $timeSlice = null) {
        if ($timeSlice === null) {
            $timeSlice = floor(time() / 30);
        }
        
        $secretKey = $this->base32Decode($secret);
        
        // Pack time into binary string
        $time = pack('N*', 0) . pack('N*', $timeSlice);
        
        // Hash it with SHA1
        $hash = hash_hmac('sha1', $time, $secretKey, true);
        
        // Extract 4 bytes from hash
        $offset = ord($hash[19]) & 0xf;
        $code = (
            ((ord($hash[$offset + 0]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % pow(10, 6);
        
        return str_pad($code, 6, '0', STR_PAD_LEFT);
    }
    
    /**
     * Verify TOTP code (allows for time drift)
     */
    private function verifyTOTPCode($secret, $code, $window = 1) {
        $timeSlice = floor(time() / 30);
        
        // Check current time slice and adjacent ones (for clock drift)
        for ($i = -$window; $i <= $window; $i++) {
            if ($this->generateTOTPCode($secret, $timeSlice + $i) === $code) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate QR code URL for TOTP setup
     */
    private function generateQRCodeURL($email, $secret) {
        $label = urlencode($this->issuer . ':' . $email);
        $issuer = urlencode($this->issuer);
        
        $url = "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
        
        // Return Google Charts QR code URL
        return "https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=" . urlencode($url);
    }
    
    /**
     * Generate backup codes
     */
    private function generateBackupCodes($count = 10) {
        $codes = [];
        
        for ($i = 0; $i < $count; $i++) {
            $codes[] = substr(bin2hex(random_bytes(4)), 0, 8);
        }
        
        return $codes;
    }
    
    /**
     * Verify backup code
     */
    private function verifyBackupCode($userId, $code, $backupCodesJson) {
        $backupCodes = json_decode($backupCodesJson, true);
        
        if (!$backupCodes || !in_array($code, $backupCodes)) {
            $this->logTOTPEvent($userId, 'backup_code_invalid');
            
            return [
                'success' => false,
                'message' => 'Código de respaldo inválido'
            ];
        }
        
        // Remove used backup code
        $backupCodes = array_diff($backupCodes, [$code]);
        
        // Update database
        $this->db->secureQuery(
            "UPDATE users SET totp_backup_codes = ? WHERE id = ?",
            [json_encode(array_values($backupCodes)), $userId],
            ['users']
        );
        
        $this->logTOTPEvent($userId, 'backup_code_used', ['remaining_codes' => count($backupCodes)]);
        
        return [
            'success' => true,
            'message' => 'Código de respaldo verificado',
            'remaining_codes' => count($backupCodes)
        ];
    }
    
    /**
     * Encrypt TOTP secret
     */
    private function encryptSecret($secret) {
        $key = hash('sha256', 'laburar_totp_key_2025', true); // In production, use proper key management
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($secret, 'AES-256-CBC', $key, 0, $iv);
        
        return base64_encode($iv . $encrypted);
    }
    
    /**
     * Decrypt TOTP secret
     */
    private function decryptSecret($encryptedSecret) {
        $key = hash('sha256', 'laburar_totp_key_2025', true);
        $data = base64_decode($encryptedSecret);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
    
    /**
     * Base32 decode (for TOTP secrets)
     */
    private function base32Decode($secret) {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper($secret);
        $decoded = '';
        
        $binaryString = '';
        for ($i = 0; $i < strlen($secret); $i++) {
            $char = $secret[$i];
            if ($char === '=') break;
            
            $position = strpos($alphabet, $char);
            if ($position === false) continue;
            
            $binaryString .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }
        
        // Convert binary string to bytes
        for ($i = 0; $i < strlen($binaryString); $i += 8) {
            $byte = substr($binaryString, $i, 8);
            if (strlen($byte) === 8) {
                $decoded .= chr(bindec($byte));
            }
        }
        
        return $decoded;
    }
    
    /**
     * Log TOTP events
     */
    private function logTOTPEvent($userId, $event, $details = []) {
        require_once __DIR__ . '/SecurityLogger.php';
        
        try {
            $logger = new SecurityLogger();
            $logger->logEvent('totp_' . $event, 'info', array_merge([
                'user_id' => $userId,
                'totp_action' => $event
            ], $details));
        } catch (\Exception $e) {
            // Don't fail if logging fails
            error_log("TOTP logging error: " . $e->getMessage());
        }
    }
    
    /**
     * Get TOTP statistics
     */
    public function getTOTPStats() {
        $stmt = $this->db->secureQuery(
            "SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN totp_enabled = 1 THEN 1 ELSE 0 END) as totp_enabled_users,
                SUM(CASE WHEN totp_secret IS NOT NULL AND totp_enabled = 0 THEN 1 ELSE 0 END) as totp_pending_users
             FROM users",
            [],
            ['users']
        );
        
        return $stmt->fetch();
    }
}