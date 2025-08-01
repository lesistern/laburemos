<?php
/**
 * User Model
 * LaburAR Complete Platform - Core Authentication Model
 * Generated: 2025-01-18
 * Version: 1.0
 */

require_once __DIR__ . '/BaseModel.php';

class User extends BaseModel
{
    protected $table = 'users';
    
    protected $fillable = [
        'email',
        'password_hash', 
        'user_type',
        'status',
        'phone',
        'two_factor_secret',
        'two_factor_enabled',
        'two_factor_backup_codes'
    ];
    
    protected $hidden = [
        'password_hash',
        'two_factor_secret',
        'two_factor_backup_codes',
        'password_reset_token',
        'email_verification_token',
        'phone_verification_code'
    ];
    
    protected $dates = [
        'created_at',
        'updated_at', 
        'email_verified_at',
        'phone_verified_at',
        'last_login_at',
        'locked_until',
        'password_reset_expires_at',
        'phone_verification_expires_at'
    ];
    
    // User types constants
    const TYPE_FREELANCER = 'freelancer';
    const TYPE_CLIENT = 'client';
    
    // User status constants
    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_DELETED = 'deleted';
    
    /**
     * Create new user with encrypted password
     */
    public static function createUser($email, $password, $userType)
    {
        // Validate user type
        if (!in_array($userType, [self::TYPE_FREELANCER, self::TYPE_CLIENT])) {
            throw new InvalidArgumentException('Invalid user type');
        }
        
        // Check if email already exists
        if (self::whereFirst('email', $email)) {
            throw new Exception('Email already exists');
        }
        
        $user = new self([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'user_type' => $userType,
            'status' => self::STATUS_PENDING
        ]);
        
        $user->save();
        return $user;
    }
    
    /**
     * Find user by email
     */
    public static function findByEmail($email)
    {
        return self::whereFirst('email', $email);
    }
    
    /**
     * Verify password
     */
    public function verifyPassword($password)
    {
        return password_verify($password, $this->password_hash);
    }
    
    /**
     * Update password
     */
    public function updatePassword($newPassword)
    {
        $this->password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        return $this->save();
    }
    
    /**
     * Check if user is freelancer
     */
    public function isFreelancer()
    {
        return $this->user_type === self::TYPE_FREELANCER;
    }
    
    /**
     * Check if user is client
     */
    public function isClient()
    {
        return $this->user_type === self::TYPE_CLIENT;
    }
    
    /**
     * Check if user is active
     */
    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }
    
    /**
     * Check if user is suspended
     */
    public function isSuspended()
    {
        return $this->status === self::STATUS_SUSPENDED;
    }
    
    /**
     * Check if user is locked (failed login attempts)
     */
    public function isLocked()
    {
        return $this->locked_until && strtotime($this->locked_until) > time();
    }
    
    /**
     * Check if email is verified
     */
    public function isEmailVerified()
    {
        return !empty($this->email_verified_at);
    }
    
    /**
     * Check if phone is verified
     */
    public function isPhoneVerified()
    {
        return !empty($this->phone_verified_at);
    }
    
    /**
     * Check if 2FA is enabled
     */
    public function isTwoFactorEnabled()
    {
        return $this->two_factor_enabled && !empty($this->two_factor_secret);
    }
    
    /**
     * Mark email as verified
     */
    public function markEmailAsVerified()
    {
        $this->email_verified_at = date('Y-m-d H:i:s');
        $this->email_verification_token = null;
        return $this->save();
    }
    
    /**
     * Mark phone as verified
     */
    public function markPhoneAsVerified()
    {
        $this->phone_verified_at = date('Y-m-d H:i:s');
        $this->phone_verification_code = null;
        $this->phone_verification_expires_at = null;
        return $this->save();
    }
    
    /**
     * Generate email verification token
     */
    public function generateEmailVerificationToken()
    {
        $token = bin2hex(random_bytes(32));
        $this->email_verification_token = hash('sha256', $token);
        $this->save();
        return $token; // Return unhashed token for email
    }
    
    /**
     * Generate phone verification code
     */
    public function generatePhoneVerificationCode()
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->phone_verification_code = $code;
        $this->phone_verification_expires_at = date('Y-m-d H:i:s', time() + 900); // 15 minutes
        $this->save();
        return $code;
    }
    
    /**
     * Verify email token
     */
    public function verifyEmailToken($token)
    {
        return hash_equals($this->email_verification_token, hash('sha256', $token));
    }
    
    /**
     * Verify phone code
     */
    public function verifyPhoneCode($code)
    {
        if (empty($this->phone_verification_code)) {
            return false;
        }
        
        if (strtotime($this->phone_verification_expires_at) < time()) {
            return false; // Expired
        }
        
        return $this->phone_verification_code === $code;
    }
    
    /**
     * Generate password reset token
     */
    public function generatePasswordResetToken()
    {
        $token = bin2hex(random_bytes(32));
        $this->password_reset_token = hash('sha256', $token);
        $this->password_reset_expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        $this->save();
        return $token; // Return unhashed token for email
    }
    
    /**
     * Verify password reset token
     */
    public function verifyPasswordResetToken($token)
    {
        if (empty($this->password_reset_token)) {
            return false;
        }
        
        if (strtotime($this->password_reset_expires_at) < time()) {
            return false; // Expired
        }
        
        return hash_equals($this->password_reset_token, hash('sha256', $token));
    }
    
    /**
     * Clear password reset token
     */
    public function clearPasswordResetToken()
    {
        $this->password_reset_token = null;
        $this->password_reset_expires_at = null;
        return $this->save();
    }
    
    /**
     * Increment login attempts
     */
    public function incrementLoginAttempts()
    {
        $this->login_attempts = ($this->login_attempts ?? 0) + 1;
        
        // Lock account after 5 failed attempts
        if ($this->login_attempts >= 5) {
            $this->locked_until = date('Y-m-d H:i:s', time() + 1800); // 30 minutes
        }
        
        return $this->save();
    }
    
    /**
     * Clear login attempts
     */
    public function clearLoginAttempts()
    {
        $this->login_attempts = 0;
        $this->locked_until = null;
        return $this->save();
    }
    
    /**
     * Update last login timestamp
     */
    public function updateLastLogin()
    {
        $this->last_login_at = date('Y-m-d H:i:s');
        return $this->save();
    }
    
    /**
     * Activate user account
     */
    public function activate()
    {
        $this->status = self::STATUS_ACTIVE;
        return $this->save();
    }
    
    /**
     * Suspend user account
     */
    public function suspend()
    {
        $this->status = self::STATUS_SUSPENDED;
        return $this->save();
    }
    
    /**
     * Enable 2FA
     */
    public function enableTwoFactor($secret, $backupCodes = [])
    {
        $this->two_factor_secret = $secret;
        $this->two_factor_enabled = true;
        $this->two_factor_backup_codes = json_encode($backupCodes);
        return $this->save();
    }
    
    /**
     * Disable 2FA
     */
    public function disableTwoFactor()
    {
        $this->two_factor_secret = null;
        $this->two_factor_enabled = false;
        $this->two_factor_backup_codes = null;
        return $this->save();
    }
    
    /**
     * Get user's related profile (freelancer or client)
     */
    public function getProfile()
    {
        if ($this->isFreelancer()) {
            require_once __DIR__ . '/Freelancer.php';
            return Freelancer::whereFirst('user_id', $this->id);
        } else if ($this->isClient()) {
            require_once __DIR__ . '/Client.php';
            return Client::whereFirst('user_id', $this->id);
        }
        
        return null;
    }
    
    /**
     * Get user preferences
     */
    public function getPreferences()
    {
        require_once __DIR__ . '/UserPreferences.php';
        return UserPreferences::whereFirst('user_id', $this->id);
    }
    
    /**
     * Get user verifications
     */
    public function getVerifications()
    {
        require_once __DIR__ . '/Verification.php';
        return Verification::where('user_id', $this->id);
    }
    
    /**
     * Get user reputation score
     */
    public function getReputationScore()
    {
        require_once __DIR__ . '/ReputationScore.php';
        return ReputationScore::whereFirst('user_id', $this->id);
    }
    
    /**
     * Get audit logs for user
     */
    public function getAuditLogs($limit = 50)
    {
        require_once __DIR__ . '/AuditLog.php';
        $sql = "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->id, $limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Create audit log entry
     */
    public function createAuditLog($action, $resourceType = null, $resourceId = null, $context = [])
    {
        require_once __DIR__ . '/AuditLog.php';
        
        return AuditLog::create([
            'user_id' => $this->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'context' => json_encode($context)
        ]);
    }
    
    /**
     * Get full user profile with related data
     */
    public function getFullProfile()
    {
        $profile = $this->toArray();
        $profile['related_profile'] = $this->getProfile()?->toArray();
        $profile['preferences'] = $this->getPreferences()?->toArray();
        $profile['reputation'] = $this->getReputationScore()?->toArray();
        $profile['verifications'] = $this->getVerifications()->toArray();
        
        return $profile;
    }
}
?>