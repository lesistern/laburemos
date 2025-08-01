<?php
/**
 * ReputationScore Model
 * LaburAR Complete Platform - Reputation System
 */

require_once __DIR__ . '/BaseModel.php';

class ReputationScore extends BaseModel
{
    protected $table = 'reputation_scores';
    
    protected $fillable = [
        'user_id',
        'overall_score',
        'communication_score',
        'quality_score',
        'timeliness_score',
        'professionalism_score',
        'total_reviews',
        'five_star_count',
        'four_star_count',
        'three_star_count',
        'two_star_count',
        'one_star_count'
    ];
}
?>