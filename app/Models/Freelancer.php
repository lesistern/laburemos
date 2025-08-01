<?php
/**
 * Freelancer Model
 * LaburAR Complete Platform - Freelancer Profile Management
 * Generated: 2025-01-18
 * Version: 1.0
 */

require_once __DIR__ . '/BaseModel.php';

class Freelancer extends BaseModel
{
    protected $table = 'freelancers';
    
    protected $fillable = [
        'user_id',
        'professional_name',
        'title',
        'bio',
        'hourly_rate_min',
        'hourly_rate_max',
        'currency',
        'availability_status',
        'location',
        'cuil',
        'tax_condition',
        'portfolio_description',
        'profile_image',
        'cover_image',
        'website_url'
    ];
    
    protected $dates = [
        'created_at',
        'updated_at'
    ];
    
    // Availability status constants
    const STATUS_AVAILABLE = 'available';
    const STATUS_BUSY = 'busy';
    const STATUS_UNAVAILABLE = 'unavailable';
    
    // Tax condition constants
    const TAX_MONOTRIBUTO = 'monotributo';
    const TAX_RESPONSABLE_INSCRIPTO = 'responsable_inscripto';
    const TAX_EXENTO = 'exento';
    
    /**
     * Create freelancer profile for user
     */
    public static function createForUser($userId, $data)
    {
        // Verify user exists and is freelancer type
        require_once __DIR__ . '/User.php';
        $user = User::find($userId);
        
        if (!$user || !$user->isFreelancer()) {
            throw new Exception('Invalid user or user is not a freelancer');
        }
        
        // Check if profile already exists
        if (self::whereFirst('user_id', $userId)) {
            throw new Exception('Freelancer profile already exists for this user');
        }
        
        $data['user_id'] = $userId;
        return self::create($data);
    }
    
    /**
     * Get user associated with freelancer
     */
    public function getUser()
    {
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
    
    /**
     * Check if freelancer is available
     */
    public function isAvailable()
    {
        return $this->availability_status === self::STATUS_AVAILABLE;
    }
    
    /**
     * Check if freelancer is busy
     */
    public function isBusy()
    {
        return $this->availability_status === self::STATUS_BUSY;
    }
    
    /**
     * Set availability status
     */
    public function setAvailabilityStatus($status)
    {
        if (!in_array($status, [self::STATUS_AVAILABLE, self::STATUS_BUSY, self::STATUS_UNAVAILABLE])) {
            throw new InvalidArgumentException('Invalid availability status');
        }
        
        $this->availability_status = $status;
        return $this->save();
    }
    
    /**
     * Update hourly rate range
     */
    public function updateHourlyRate($min, $max = null)
    {
        if ($min < 0) {
            throw new InvalidArgumentException('Minimum rate cannot be negative');
        }
        
        if ($max !== null && $max < $min) {
            throw new InvalidArgumentException('Maximum rate cannot be less than minimum');
        }
        
        $this->hourly_rate_min = $min;
        $this->hourly_rate_max = $max;
        return $this->save();
    }
    
    /**
     * Get freelancer skills
     */
    public function getSkills()
    {
        require_once __DIR__ . '/FreelancerSkill.php';
        return FreelancerSkill::where('freelancer_id', $this->id);
    }
    
    /**
     * Get verified skills only
     */
    public function getVerifiedSkills()
    {
        $sql = "SELECT fs.*, s.name as skill_name, s.category, s.subcategory 
                FROM freelancer_skills fs 
                JOIN skills s ON fs.skill_id = s.id 
                WHERE fs.freelancer_id = ? AND fs.verification_status = 'verified'
                ORDER BY fs.proficiency_level DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->id]);
        return $stmt->fetchAll();
    }
    
    /**
     * Add skill to freelancer
     */
    public function addSkill($skillId, $proficiencyLevel, $yearsExperience = null)
    {
        require_once __DIR__ . '/FreelancerSkill.php';
        
        return FreelancerSkill::create([
            'freelancer_id' => $this->id,
            'skill_id' => $skillId,
            'proficiency_level' => $proficiencyLevel,
            'years_experience' => $yearsExperience
        ]);
    }
    
    /**
     * Remove skill from freelancer
     */
    public function removeSkill($skillId)
    {
        require_once __DIR__ . '/FreelancerSkill.php';
        
        $skill = FreelancerSkill::whereFirst('freelancer_id', $this->id);
        if ($skill && $skill->skill_id == $skillId) {
            return $skill->delete();
        }
        
        return false;
    }
    
    /**
     * Get portfolio items
     */
    public function getPortfolioItems($publicOnly = true)
    {
        require_once __DIR__ . '/PortfolioItem.php';
        
        $sql = "SELECT * FROM portfolio_items WHERE freelancer_id = ?";
        $params = [$this->id];
        
        if ($publicOnly) {
            $sql .= " AND is_public = 1";
        }
        
        $sql .= " ORDER BY display_order ASC, created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return new ModelCollection($stmt->fetchAll(), 'PortfolioItem');
    }
    
    /**
     * Get featured portfolio items
     */
    public function getFeaturedPortfolioItems()
    {
        $sql = "SELECT * FROM portfolio_items 
                WHERE freelancer_id = ? AND featured = 1 AND is_public = 1
                ORDER BY display_order ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->id]);
        
        return new ModelCollection($stmt->fetchAll(), 'PortfolioItem');
    }
    
    /**
     * Add portfolio item
     */
    public function addPortfolioItem($data)
    {
        require_once __DIR__ . '/PortfolioItem.php';
        
        $data['freelancer_id'] = $this->id;
        return PortfolioItem::create($data);
    }
    
    /**
     * Update performance metrics
     */
    public function updatePerformanceMetrics($responseTime = null, $completionRate = null)
    {
        if ($responseTime !== null) {
            $this->response_time_avg = $responseTime;
        }
        
        if ($completionRate !== null) {
            $this->completion_rate = max(0, min(100, $completionRate));
        }
        
        return $this->save();
    }
    
    /**
     * Increment project statistics
     */
    public function incrementProjectStats($earnings = 0)
    {
        $this->total_projects = ($this->total_projects ?? 0) + 1;
        $this->total_earnings = ($this->total_earnings ?? 0) + $earnings;
        return $this->save();
    }
    
    /**
     * Search freelancers
     */
    public static function search($params = [])
    {
        $sql = "SELECT f.*, u.email, u.email_verified_at, u.phone_verified_at, 
                       COALESCE(r.overall_score, 0) as reputation_score
                FROM freelancers f
                JOIN users u ON f.user_id = u.id
                LEFT JOIN reputation_scores r ON u.id = r.user_id
                WHERE u.status = 'active'";
        
        $conditions = [];
        $params_array = [];
        
        // Location filter
        if (!empty($params['location'])) {
            $conditions[] = "f.location LIKE ?";
            $params_array[] = '%' . $params['location'] . '%';
        }
        
        // Availability filter
        if (!empty($params['availability'])) {
            $conditions[] = "f.availability_status = ?";
            $params_array[] = $params['availability'];
        }
        
        // Rate range filter
        if (!empty($params['min_rate'])) {
            $conditions[] = "(f.hourly_rate_min >= ? OR f.hourly_rate_min IS NULL)";
            $params_array[] = $params['min_rate'];
        }
        
        if (!empty($params['max_rate'])) {
            $conditions[] = "(f.hourly_rate_max <= ? OR f.hourly_rate_max IS NULL)";
            $params_array[] = $params['max_rate'];
        }
        
        // Skills filter
        if (!empty($params['skills']) && is_array($params['skills'])) {
            $skillPlaceholders = str_repeat('?,', count($params['skills']) - 1) . '?';
            $conditions[] = "f.id IN (
                SELECT fs.freelancer_id 
                FROM freelancer_skills fs 
                JOIN skills s ON fs.skill_id = s.id 
                WHERE s.name IN ($skillPlaceholders)
            )";
            $params_array = array_merge($params_array, $params['skills']);
        }
        
        // Text search
        if (!empty($params['search'])) {
            $conditions[] = "(
                MATCH(f.professional_name, f.title, f.bio, f.portfolio_description) AGAINST (? IN NATURAL LANGUAGE MODE)
                OR f.professional_name LIKE ?
                OR f.title LIKE ?
            )";
            $params_array[] = $params['search'];
            $params_array[] = '%' . $params['search'] . '%';
            $params_array[] = '%' . $params['search'] . '%';
        }
        
        // Add conditions to SQL
        if (!empty($conditions)) {
            $sql .= ' AND ' . implode(' AND ', $conditions);
        }
        
        // Sorting
        $orderBy = 'f.created_at DESC'; // Default sort
        if (!empty($params['sort'])) {
            switch ($params['sort']) {
                case 'rate_low':
                    $orderBy = 'f.hourly_rate_min ASC';
                    break;
                case 'rate_high':
                    $orderBy = 'f.hourly_rate_max DESC';
                    break;
                case 'reputation':
                    $orderBy = 'reputation_score DESC';
                    break;
                case 'completion_rate':
                    $orderBy = 'f.completion_rate DESC';
                    break;
                case 'projects':
                    $orderBy = 'f.total_projects DESC';
                    break;
            }
        }
        
        $sql .= " ORDER BY $orderBy";
        
        // Pagination
        if (!empty($params['limit'])) {
            $sql .= " LIMIT ?";
            $params_array[] = (int) $params['limit'];
            
            if (!empty($params['offset'])) {
                $sql .= " OFFSET ?";
                $params_array[] = (int) $params['offset'];
            }
        }
        
        $instance = new self();
        $stmt = $instance->db->prepare($sql);
        $stmt->execute($params_array);
        
        return new ModelCollection($stmt->fetchAll(), self::class);
    }
    
    /**
     * Get freelancer profile with complete data
     */
    public function getCompleteProfile()
    {
        $profile = $this->toArray();
        $profile['user'] = $this->getUser()?->toArray();
        $profile['skills'] = $this->getVerifiedSkills();
        $profile['portfolio'] = $this->getFeaturedPortfolioItems()->toArray();
        
        // Remove sensitive data from user
        if (isset($profile['user'])) {
            unset($profile['user']['password_hash']);
            unset($profile['user']['two_factor_secret']);
        }
        
        return $profile;
    }
    
    /**
     * Calculate hourly rate range display
     */
    public function getHourlyRateDisplay()
    {
        $currency = $this->currency ?? 'ARS';
        
        if ($this->hourly_rate_min && $this->hourly_rate_max) {
            return number_format($this->hourly_rate_min, 0, ',', '.') . ' - ' . 
                   number_format($this->hourly_rate_max, 0, ',', '.') . ' ' . $currency;
        } elseif ($this->hourly_rate_min) {
            return 'Desde ' . number_format($this->hourly_rate_min, 0, ',', '.') . ' ' . $currency;
        } elseif ($this->hourly_rate_max) {
            return 'Hasta ' . number_format($this->hourly_rate_max, 0, ',', '.') . ' ' . $currency;
        }
        
        return 'A convenir';
    }
    
    /**
     * Get completion rate percentage display
     */
    public function getCompletionRateDisplay()
    {
        return number_format($this->completion_rate ?? 0, 1) . '%';
    }
    
    /**
     * Get profile completion percentage
     */
    public function getProfileCompletion()
    {
        $fields = [
            'professional_name',
            'title', 
            'bio',
            'location',
            'hourly_rate_min',
            'portfolio_description'
        ];
        
        $completed = 0;
        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }
        
        // Add points for skills and portfolio
        if ($this->getSkills()->count() > 0) {
            $completed++;
        }
        
        if ($this->getPortfolioItems()->count() > 0) {
            $completed++;
        }
        
        return round(($completed / (count($fields) + 2)) * 100);
    }
}
?>