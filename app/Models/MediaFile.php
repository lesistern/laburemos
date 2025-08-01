<?php
/**
 * MediaFile Model
 * LaburAR Complete Platform - Media Management
 */

require_once __DIR__ . '/BaseModel.php';

class MediaFile extends BaseModel
{
    protected $table = 'media_files';
    
    protected $fillable = [
        'owner_id',
        'owner_type',
        'related_id',
        'file_type',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'width',
        'height',
        'duration',
        'alt_text',
        'title',
        'description',
        'processing_status',
        'thumbnail_path',
        'virus_scan_status'
    ];
    
    protected $dates = ['uploaded_at', 'updated_at'];
}
?>