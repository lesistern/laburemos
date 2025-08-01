<?php
/**
 * PortfolioItem Model
 * LaburAR Complete Platform - Portfolio Management
 */

require_once __DIR__ . '/BaseModel.php';

class PortfolioItem extends BaseModel
{
    protected $table = 'portfolio_items';
    
    protected $fillable = [
        'freelancer_id',
        'title',
        'description',
        'project_url',
        'project_duration_days',
        'budget_range_min',
        'budget_range_max',
        'currency',
        'client_testimonial',
        'client_name',
        'client_company',
        'featured',
        'display_order',
        'is_public'
    ];
    
    /**
     * Get freelancer
     */
    public function getFreelancer()
    {
        require_once __DIR__ . '/Freelancer.php';
        return Freelancer::find($this->freelancer_id);
    }
    
    /**
     * Get portfolio media files
     */
    public function getMediaFiles()
    {
        require_once __DIR__ . '/MediaFile.php';
        return MediaFile::where('owner_type', 'portfolio_item')->where('related_id', $this->id);
    }
}
?>