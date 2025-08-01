<?php
/**
 * AuditLog Model
 * LaburAR Complete Platform - Audit Trail
 */

require_once __DIR__ . '/BaseModel.php';

class AuditLog extends BaseModel
{
    protected $table = 'audit_logs';
    
    protected $fillable = [
        'user_id',
        'session_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'request_method',
        'request_uri',
        'old_values',
        'new_values',
        'context',
        'severity',
        'gdpr_lawful_basis',
        'data_subject_rights_impact'
    ];
    
    protected $dates = ['created_at'];
}
?>