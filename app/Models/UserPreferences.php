<?php
/**
 * UserPreferences Model
 * LaburAR Complete Platform - User Settings
 */

require_once __DIR__ . '/BaseModel.php';

class UserPreferences extends BaseModel
{
    protected $table = 'user_preferences';
    
    protected $fillable = [
        'user_id',
        'notification_email',
        'notification_push',
        'notification_sms',
        'notify_new_messages',
        'notify_project_updates',
        'notify_payment_updates',
        'notify_review_received',
        'notify_marketing',
        'timezone',
        'language',
        'currency',
        'date_format',
        'profile_visibility',
        'show_online_status',
        'show_last_seen',
        'allow_contact_form',
        'marketing_consent',
        'analytics_consent',
        'cookie_consent'
    ];
}
?>