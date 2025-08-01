<?php
/**
 * Client Model
 * LaburAR Complete Platform - Client Profile Management
 * Generated: 2025-01-18
 * Version: 1.0
 */

require_once __DIR__ . '/BaseModel.php';

class Client extends BaseModel
{
    protected $table = 'clients';
    
    protected $fillable = [
        'user_id',
        'company_name',
        'industry',
        'company_size',
        'cuit',
        'fiscal_address',
        'contact_person',
        'position',
        'budget_range_min',
        'budget_range_max',
        'currency',
        'preferred_freelancer_types',
        'company_logo',
        'company_description',
        'company_website'
    ];
    
    protected $dates = [
        'created_at',
        'updated_at'
    ];
    
    // Company size constants
    const SIZE_MICRO = '1-10';
    const SIZE_SMALL = '11-50';
    const SIZE_MEDIUM = '51-200';
    const SIZE_LARGE = '201-500';
    const SIZE_ENTERPRISE = '500+';
    
    /**
     * Create client profile for user
     */
    public static function createForUser($userId, $data)
    {
        // Verify user exists and is client type
        require_once __DIR__ . '/User.php';
        $user = User::find($userId);
        
        if (!$user || !$user->isClient()) {
            throw new Exception('Invalid user or user is not a client');
        }
        
        // Check if profile already exists
        if (self::whereFirst('user_id', $userId)) {
            throw new Exception('Client profile already exists for this user');
        }
        
        $data['user_id'] = $userId;
        return self::create($data);
    }
    
    /**
     * Get user associated with client
     */
    public function getUser()
    {
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
    
    /**
     * Update budget range
     */
    public function updateBudgetRange($min, $max = null)
    {
        if ($min < 0) {
            throw new InvalidArgumentException('Minimum budget cannot be negative');
        }
        
        if ($max !== null && $max < $min) {
            throw new InvalidArgumentException('Maximum budget cannot be less than minimum');
        }
        
        $this->budget_range_min = $min;
        $this->budget_range_max = $max;
        return $this->save();
    }
    
    /**
     * Set preferred freelancer types
     */
    public function setPreferredFreelancerTypes($types)
    {
        if (!is_array($types)) {
            throw new InvalidArgumentException('Preferred types must be an array');
        }
        
        $this->preferred_freelancer_types = json_encode($types);
        return $this->save();
    }
    
    /**
     * Get preferred freelancer types as array
     */
    public function getPreferredFreelancerTypes()
    {
        if (empty($this->preferred_freelancer_types)) {
            return [];
        }
        
        $types = json_decode($this->preferred_freelancer_types, true);
        return is_array($types) ? $types : [];
    }
    
    /**
     * Update project statistics
     */
    public function updateProjectStats($newProjectBudget = 0)
    {
        $this->projects_completed = ($this->projects_completed ?? 0) + 1;
        $this->total_spent = ($this->total_spent ?? 0) + $newProjectBudget;
        
        // Recalculate average project budget
        if ($this->projects_completed > 0) {
            $this->avg_project_budget = $this->total_spent / $this->projects_completed;
        }
        
        return $this->save();
    }
    
    /**
     * Get company size display text
     */
    public function getCompanySizeDisplay()
    {
        $sizes = [
            self::SIZE_MICRO => 'Microempresa (1-10 empleados)',
            self::SIZE_SMALL => 'Pequeña empresa (11-50 empleados)',
            self::SIZE_MEDIUM => 'Mediana empresa (51-200 empleados)',
            self::SIZE_LARGE => 'Empresa grande (201-500 empleados)',
            self::SIZE_ENTERPRISE => 'Corporación (500+ empleados)'
        ];
        
        return $sizes[$this->company_size] ?? 'No especificado';
    }
    
    /**
     * Get budget range display
     */
    public function getBudgetRangeDisplay()
    {
        $currency = $this->currency ?? 'ARS';
        
        if ($this->budget_range_min && $this->budget_range_max) {
            return '$' . number_format($this->budget_range_min, 0, ',', '.') . ' - $' . 
                   number_format($this->budget_range_max, 0, ',', '.') . ' ' . $currency;
        } elseif ($this->budget_range_min) {
            return 'Desde $' . number_format($this->budget_range_min, 0, ',', '.') . ' ' . $currency;
        } elseif ($this->budget_range_max) {
            return 'Hasta $' . number_format($this->budget_range_max, 0, ',', '.') . ' ' . $currency;
        }
        
        return 'A convenir';
    }
    
    /**
     * Get client projects (placeholder for future implementation)
     */
    public function getProjects($status = null)
    {
        // This will be implemented when project system is added
        // For now, return empty array
        return [];
    }
    
    /**
     * Get client reviews and ratings (placeholder for future implementation)
     */
    public function getReviews($limit = 10)
    {
        // This will be implemented when review system is added
        // For now, return empty array
        return [];
    }
    
    /**
     * Search clients
     */
    public static function search($params = [])
    {
        $sql = "SELECT c.*, u.email, u.email_verified_at, u.phone_verified_at
                FROM clients c
                JOIN users u ON c.user_id = u.id
                WHERE u.status = 'active'";
        
        $conditions = [];
        $params_array = [];
        
        // Industry filter
        if (!empty($params['industry'])) {
            $conditions[] = "c.industry = ?";
            $params_array[] = $params['industry'];
        }
        
        // Company size filter
        if (!empty($params['company_size'])) {
            $conditions[] = "c.company_size = ?";
            $params_array[] = $params['company_size'];
        }
        
        // Budget range filter
        if (!empty($params['min_budget'])) {
            $conditions[] = "(c.budget_range_min >= ? OR c.budget_range_min IS NULL)";
            $params_array[] = $params['min_budget'];
        }
        
        if (!empty($params['max_budget'])) {
            $conditions[] = "(c.budget_range_max <= ? OR c.budget_range_max IS NULL)";
            $params_array[] = $params['max_budget'];
        }
        
        // Text search
        if (!empty($params['search'])) {
            $conditions[] = "(
                MATCH(c.company_name, c.company_description) AGAINST (? IN NATURAL LANGUAGE MODE)
                OR c.company_name LIKE ?
                OR c.contact_person LIKE ?
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
        $orderBy = 'c.created_at DESC'; // Default sort
        if (!empty($params['sort'])) {
            switch ($params['sort']) {
                case 'budget_low':
                    $orderBy = 'c.budget_range_min ASC';
                    break;
                case 'budget_high':
                    $orderBy = 'c.budget_range_max DESC';
                    break;
                case 'projects':
                    $orderBy = 'c.projects_completed DESC';
                    break;
                case 'company_size':
                    $orderBy = 'c.company_size ASC';
                    break;
                case 'name':
                    $orderBy = 'c.company_name ASC';
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
     * Get client profile with complete data
     */
    public function getCompleteProfile()
    {
        $profile = $this->toArray();
        $profile['user'] = $this->getUser()?->toArray();
        $profile['preferred_types'] = $this->getPreferredFreelancerTypes();
        $profile['budget_display'] = $this->getBudgetRangeDisplay();
        $profile['size_display'] = $this->getCompanySizeDisplay();
        
        // Remove sensitive data from user
        if (isset($profile['user'])) {
            unset($profile['user']['password_hash']);
            unset($profile['user']['two_factor_secret']);
        }
        
        return $profile;
    }
    
    /**
     * Get profile completion percentage
     */
    public function getProfileCompletion()
    {
        $fields = [
            'company_name',
            'industry',
            'company_size',
            'contact_person',
            'position',
            'budget_range_min',
            'company_description'
        ];
        
        $completed = 0;
        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $completed++;
            }
        }
        
        // Add points for optional but valuable fields
        if (!empty($this->company_website)) {
            $completed += 0.5;
        }
        
        if (!empty($this->company_logo)) {
            $completed += 0.5;
        }
        
        return round(($completed / count($fields)) * 100);
    }
    
    /**
     * Check if client has enterprise features (based on company size)
     */
    public function hasEnterpriseFeatures()
    {
        return in_array($this->company_size, [self::SIZE_LARGE, self::SIZE_ENTERPRISE]);
    }
    
    /**
     * Get recommended freelancers based on client preferences
     */
    public function getRecommendedFreelancers($limit = 10)
    {
        require_once __DIR__ . '/Freelancer.php';
        
        $searchParams = [
            'limit' => $limit,
            'sort' => 'reputation'
        ];
        
        // Add budget filter if client has budget range
        if ($this->budget_range_min) {
            $searchParams['max_rate'] = $this->budget_range_min;
        }
        
        // Add preferred skills if specified
        $preferredTypes = $this->getPreferredFreelancerTypes();
        if (!empty($preferredTypes)) {
            $searchParams['skills'] = $preferredTypes;
        }
        
        return Freelancer::search($searchParams);
    }
    
    /**
     * Get spending statistics
     */
    public function getSpendingStats()
    {
        return [
            'total_spent' => $this->total_spent ?? 0,
            'projects_completed' => $this->projects_completed ?? 0,
            'avg_project_budget' => $this->avg_project_budget ?? 0,
            'total_spent_formatted' => '$' . number_format($this->total_spent ?? 0, 0, ',', '.'),
            'avg_budget_formatted' => '$' . number_format($this->avg_project_budget ?? 0, 0, ',', '.')
        ];
    }
}
?>