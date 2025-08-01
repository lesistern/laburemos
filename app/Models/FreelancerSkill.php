<?php
/**
 * FreelancerSkill Model
 * LaburAR Complete Platform - Freelancer Skills Junction
 */

require_once __DIR__ . '/BaseModel.php';

class FreelancerSkill extends BaseModel
{
    protected $table = 'freelancer_skills';
    
    protected $fillable = [
        'freelancer_id',
        'skill_id',
        'proficiency_level',
        'years_experience',
        'verification_status',
        'certification_url',
        'certification_name'
    ];
    
    /**
     * Get skill details
     */
    public function getSkill()
    {
        require_once __DIR__ . '/Skill.php';
        return Skill::find($this->skill_id);
    }
}
?>