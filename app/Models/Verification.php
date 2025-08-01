<?php
/**
 * Verification Model
 * LaburAR Complete Platform - User Verifications
 */

require_once __DIR__ . '/BaseModel.php';

class Verification extends BaseModel
{
    protected $table = 'verifications';
    
    protected $fillable = [
        'user_id',
        'verification_type',
        'status',
        'verification_data',
        'verified_by',
        'verified_at',
        'expires_at',
        'rejection_reason',
        'external_reference',
        'notes'
    ];
}
?>