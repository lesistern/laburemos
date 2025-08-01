<?php
/**
 * ProfileController - Enterprise Profile Management
 * LaburAR Complete Platform
 * 
 * Handles all profile-related operations:
 * - Profile CRUD for freelancers and clients
 * - Portfolio multimedia management
 * - Skills and categories management
 * - Profile completeness tracking
 * - Media file upload and processing
 * - Privacy and visibility settings
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Freelancer.php';
require_once __DIR__ . '/../models/Client.php';
require_once __DIR__ . '/../models/PortfolioItem.php';
require_once __DIR__ . '/../models/MediaFile.php';
require_once __DIR__ . '/../models/Skill.php';
require_once __DIR__ . '/../models/FreelancerSkill.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/MediaProcessor.php';

class ProfileController
{
    private $db;
    private $security;
    private $validator;
    private $mediaProcessor;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->security = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->mediaProcessor = new MediaProcessor();
    }
    
    /**
     * Handle incoming API requests
     */
    public function handleRequest()
    {
        // Get authenticated user
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            $this->sendErrorResponse(401, 'Authentication required');
            return;
        }
        
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'get-profile':
                    if ($method === 'GET') {
                        $this->getProfile($user);
                    }
                    break;
                    
                case 'update-profile':
                    if ($method === 'PUT' || $method === 'POST') {
                        $this->updateProfile($user);
                    }
                    break;
                    
                case 'upload-avatar':
                    if ($method === 'POST') {
                        $this->uploadAvatar($user);
                    }
                    break;
                    
                case 'get-portfolio':
                    if ($method === 'GET') {
                        $this->getPortfolio($user);
                    }
                    break;
                    
                case 'add-portfolio-item':
                    if ($method === 'POST') {
                        $this->addPortfolioItem($user);
                    }
                    break;
                    
                case 'update-portfolio-item':
                    if ($method === 'PUT' || $method === 'POST') {
                        $this->updatePortfolioItem($user);
                    }
                    break;
                    
                case 'delete-portfolio-item':
                    if ($method === 'DELETE') {
                        $this->deletePortfolioItem($user);
                    }
                    break;
                    
                case 'upload-portfolio-media':
                    if ($method === 'POST') {
                        $this->uploadPortfolioMedia($user);
                    }
                    break;
                    
                case 'get-skills':
                    if ($method === 'GET') {
                        $this->getAvailableSkills();
                    }
                    break;
                    
                case 'update-skills':
                    if ($method === 'POST') {
                        $this->updateUserSkills($user);
                    }
                    break;
                    
                case 'get-profile-completeness':
                    if ($method === 'GET') {
                        $this->getProfileCompleteness($user);
                    }
                    break;
                    
                case 'update-preferences':
                    if ($method === 'POST') {
                        $this->updateUserPreferences($user);
                    }
                    break;
                    
                case 'get-public-profile':
                    if ($method === 'GET') {
                        $this->getPublicProfile();
                    }
                    break;
                    
                default:
                    $this->sendErrorResponse(404, 'Endpoint not found');
            }
        } catch (Exception $e) {
            $this->logError($e, $user->id);
            $this->sendErrorResponse(500, 'Internal server error');
        }
    }
    
    /**
     * Get complete user profile
     */
    private function getProfile($user)
    {
        $profileData = [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'email_verified' => !empty($user->email_verified_at),
                'phone_verified' => !empty($user->phone_verified_at),
                'two_factor_enabled' => $user->two_factor_enabled,
                'last_activity' => $user->last_activity,
                'created_at' => $user->created_at
            ]
        ];
        
        // Get specific profile data based on user type
        if ($user->user_type === 'freelancer') {
            $freelancer = Freelancer::where('user_id', $user->id)->first();
            if ($freelancer) {
                $profileData['freelancer'] = [
                    'professional_title' => $freelancer->professional_title,
                    'bio' => $freelancer->bio,
                    'hourly_rate' => $freelancer->hourly_rate,
                    'experience_level' => $freelancer->experience_level,
                    'availability_status' => $freelancer->availability_status,
                    'response_time_hours' => $freelancer->response_time_hours,
                    'languages' => json_decode($freelancer->languages ?? '[]', true),
                    'timezone' => $freelancer->timezone,
                    'profile_views' => $freelancer->profile_views,
                    'completed_projects' => $freelancer->completed_projects,
                    'success_rate' => $freelancer->success_rate
                ];
                
                // Get skills
                $profileData['skills'] = $this->getFreelancerSkills($user->id);
                
                // Get portfolio
                $profileData['portfolio'] = $this->getFreelancerPortfolio($user->id);
            }
        } else {
            $client = Client::where('user_id', $user->id)->first();
            if ($client) {
                $profileData['client'] = [
                    'company_name' => $client->company_name,
                    'company_description' => $client->company_description,
                    'industry' => $client->industry,
                    'company_size' => $client->company_size,
                    'website' => $client->website,
                    'projects_posted' => $client->projects_posted,
                    'total_spent' => $client->total_spent,
                    'preferred_budget_range' => $client->preferred_budget_range
                ];
            }
        }
        
        // Get user preferences
        $preferences = UserPreferences::where('user_id', $user->id)->first();
        if ($preferences) {
            $profileData['preferences'] = [
                'email_notifications' => json_decode($preferences->email_notifications ?? '{}', true),
                'privacy_settings' => json_decode($preferences->privacy_settings ?? '{}', true),
                'communication_preferences' => json_decode($preferences->communication_preferences ?? '{}', true)
            ];
        }
        
        // Calculate profile completeness
        $profileData['completeness'] = $this->calculateProfileCompleteness($user);
        
        $this->sendSuccessResponse($profileData);
    }
    
    /**
     * Update user profile
     */
    private function updateProfile($user)
    {
        $input = $this->getJSONInput();
        
        try {
            $this->db->beginTransaction();
            
            // Update user basic info
            if (isset($input['first_name'])) {
                $nameValidation = $this->validator->validateName($input['first_name'], 'first name');
                if (!$nameValidation['valid']) {
                    $this->sendErrorResponse(400, $nameValidation['message']);
                    return;
                }
                $user->first_name = $nameValidation['sanitized'];
            }
            
            if (isset($input['last_name'])) {
                $nameValidation = $this->validator->validateName($input['last_name'], 'last name');
                if (!$nameValidation['valid']) {
                    $this->sendErrorResponse(400, $nameValidation['message']);
                    return;
                }
                $user->last_name = $nameValidation['sanitized'];
            }
            
            if (isset($input['phone'])) {
                if (!$this->validator->validatePhone($input['phone'])) {
                    $this->sendErrorResponse(400, 'Invalid phone number format');
                    return;
                }
                $user->phone = $input['phone'];
            }
            
            $user->save();
            
            // Update specific profile based on user type
            if ($user->user_type === 'freelancer') {
                $this->updateFreelancerProfile($user->id, $input);
            } else {
                $this->updateClientProfile($user->id, $input);
            }
            
            // Log profile update
            $this->logActivity($user->id, 'profile_updated', 'user', $user->id);
            
            $this->db->commit();
            
            $this->sendSuccessResponse([
                'message' => 'Profile updated successfully',
                'user_id' => $user->id
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Upload user avatar
     */
    private function uploadAvatar($user)
    {
        if (!isset($_FILES['avatar'])) {
            $this->sendErrorResponse(400, 'No avatar file provided');
            return;
        }
        
        $file = $_FILES['avatar'];
        
        // Validate file
        $validation = $this->validator->validateFile($file, 'image');
        if (!$validation['valid']) {
            $this->sendErrorResponse(400, $validation['message']);
            return;
        }
        
        try {
            // Process and save avatar
            $result = $this->mediaProcessor->processAvatar($file, $user->id);
            
            if ($result['success']) {
                // Update user avatar URL
                $user->avatar_url = $result['url'];
                $user->save();
                
                // Log avatar upload
                $this->logActivity($user->id, 'avatar_uploaded', 'media', $result['media_id']);
                
                $this->sendSuccessResponse([
                    'message' => 'Avatar uploaded successfully',
                    'avatar_url' => $result['url'],
                    'media_id' => $result['media_id']
                ]);
            } else {
                $this->sendErrorResponse(500, $result['error'] ?? 'Avatar upload failed');
            }
            
        } catch (Exception $e) {
            $this->logError($e, $user->id);
            $this->sendErrorResponse(500, 'Avatar upload failed');
        }
    }
    
    /**
     * Get freelancer portfolio
     */
    private function getPortfolio($user)
    {
        if ($user->user_type !== 'freelancer') {
            $this->sendErrorResponse(403, 'Only freelancers have portfolios');
            return;
        }
        
        $portfolio = $this->getFreelancerPortfolio($user->id);
        
        $this->sendSuccessResponse([
            'portfolio' => $portfolio,
            'total_items' => count($portfolio)
        ]);
    }
    
    /**
     * Add portfolio item
     */
    private function addPortfolioItem($user)
    {
        if ($user->user_type !== 'freelancer') {
            $this->sendErrorResponse(403, 'Only freelancers can add portfolio items');
            return;
        }
        
        $input = $this->getJSONInput();
        
        // Validate required fields
        $requiredFields = ['title', 'description', 'category'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->sendErrorResponse(400, "Field '$field' is required");
                return;
            }
        }
        
        // Validate input
        $titleValidation = $this->validator->validateText($input['title'], 200, true);
        if (!$titleValidation['valid']) {
            $this->sendErrorResponse(400, $titleValidation['message']);
            return;
        }
        
        $descValidation = $this->validator->validateText($input['description'], 2000, true);
        if (!$descValidation['valid']) {
            $this->sendErrorResponse(400, $descValidation['message']);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Create portfolio item
            $portfolioData = [
                'freelancer_id' => $user->id,
                'title' => $titleValidation['sanitized'],
                'description' => $descValidation['sanitized'],
                'category' => $input['category'],
                'project_url' => $input['project_url'] ?? null,
                'completion_date' => $input['completion_date'] ?? null,
                'technologies_used' => json_encode($input['technologies'] ?? []),
                'status' => 'active'
            ];
            
            $portfolioItem = PortfolioItem::create($portfolioData);
            
            // Log portfolio addition
            $this->logActivity($user->id, 'portfolio_item_added', 'portfolio_item', $portfolioItem->id);
            
            $this->db->commit();
            
            $this->sendSuccessResponse([
                'message' => 'Portfolio item added successfully',
                'portfolio_item' => $portfolioItem->toArray()
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Upload portfolio media
     */
    private function uploadPortfolioMedia($user)
    {
        if ($user->user_type !== 'freelancer') {
            $this->sendErrorResponse(403, 'Only freelancers can upload portfolio media');
            return;
        }
        
        if (!isset($_FILES['media']) || !isset($_POST['portfolio_item_id'])) {
            $this->sendErrorResponse(400, 'Media file and portfolio item ID required');
            return;
        }
        
        $file = $_FILES['media'];
        $portfolioItemId = $_POST['portfolio_item_id'];
        
        // Verify portfolio item ownership
        $portfolioItem = PortfolioItem::where('id', $portfolioItemId)
                                     ->where('freelancer_id', $user->id)
                                     ->first();
        
        if (!$portfolioItem) {
            $this->sendErrorResponse(404, 'Portfolio item not found');
            return;
        }
        
        // Validate file
        $validation = $this->validator->validateFile($file, ['image', 'document']);
        if (!$validation['valid']) {
            $this->sendErrorResponse(400, $validation['message']);
            return;
        }
        
        try {
            // Process and save media
            $result = $this->mediaProcessor->processPortfolioMedia($file, $user->id, $portfolioItemId);
            
            if ($result['success']) {
                $this->logActivity($user->id, 'portfolio_media_uploaded', 'media', $result['media_id']);
                
                $this->sendSuccessResponse([
                    'message' => 'Portfolio media uploaded successfully',
                    'media' => $result['media']
                ]);
            } else {
                $this->sendErrorResponse(500, $result['error'] ?? 'Media upload failed');
            }
            
        } catch (Exception $e) {
            $this->logError($e, $user->id);
            $this->sendErrorResponse(500, 'Media upload failed');
        }
    }
    
    /**
     * Get available skills
     */
    private function getAvailableSkills()
    {
        $skills = Skill::where('status', 'active')->orderBy('name')->get();
        
        // Group by category
        $grouped = [];
        foreach ($skills as $skill) {
            $category = $skill->category;
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = [
                'id' => $skill->id,
                'name' => $skill->name,
                'description' => $skill->description
            ];
        }
        
        $this->sendSuccessResponse([
            'skills' => $grouped,
            'total' => count($skills)
        ]);
    }
    
    /**
     * Update user skills
     */
    private function updateUserSkills($user)
    {
        if ($user->user_type !== 'freelancer') {
            $this->sendErrorResponse(403, 'Only freelancers can update skills');
            return;
        }
        
        $input = $this->getJSONInput();
        
        if (!isset($input['skills']) || !is_array($input['skills'])) {
            $this->sendErrorResponse(400, 'Skills array is required');
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Remove existing skills
            FreelancerSkill::where('freelancer_id', $user->id)->delete();
            
            // Add new skills
            foreach ($input['skills'] as $skillData) {
                if (!isset($skillData['skill_id']) || !isset($skillData['proficiency_level'])) {
                    continue;
                }
                
                // Validate skill exists
                $skill = Skill::find($skillData['skill_id']);
                if (!$skill) {
                    continue;
                }
                
                FreelancerSkill::create([
                    'freelancer_id' => $user->id,
                    'skill_id' => $skillData['skill_id'],
                    'proficiency_level' => $skillData['proficiency_level'],
                    'years_experience' => $skillData['years_experience'] ?? 0
                ]);
            }
            
            // Log skills update
            $this->logActivity($user->id, 'skills_updated', 'user', $user->id);
            
            $this->db->commit();
            
            $this->sendSuccessResponse([
                'message' => 'Skills updated successfully'
            ]);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Get profile completeness score
     */
    private function getProfileCompleteness($user)
    {
        $completeness = $this->calculateProfileCompleteness($user);
        
        $this->sendSuccessResponse([
            'completeness' => $completeness
        ]);
    }
    
    /**
     * Get public profile (for viewing by others)
     */
    private function getPublicProfile()
    {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            $this->sendErrorResponse(400, 'User ID is required');
            return;
        }
        
        $user = User::find($userId);
        if (!$user || $user->status !== 'active') {
            $this->sendErrorResponse(404, 'User not found');
            return;
        }
        
        // Check privacy settings
        $preferences = UserPreferences::where('user_id', $userId)->first();
        $privacySettings = $preferences ? json_decode($preferences->privacy_settings ?? '{}', true) : [];
        
        if (isset($privacySettings['profile_visibility']) && $privacySettings['profile_visibility'] === 'private') {
            $this->sendErrorResponse(403, 'Profile is private');
            return;
        }
        
        // Build public profile
        $publicProfile = [
            'id' => $user->id,
            'user_type' => $user->user_type,
            'first_name' => $user->first_name,
            'avatar_url' => $user->avatar_url,
            'created_at' => $user->created_at
        ];
        
        if ($user->user_type === 'freelancer') {
            $freelancer = Freelancer::where('user_id', $userId)->first();
            if ($freelancer) {
                $publicProfile['freelancer'] = [
                    'professional_title' => $freelancer->professional_title,
                    'bio' => $freelancer->bio,
                    'experience_level' => $freelancer->experience_level,
                    'languages' => json_decode($freelancer->languages ?? '[]', true),
                    'completed_projects' => $freelancer->completed_projects,
                    'success_rate' => $freelancer->success_rate
                ];
                
                // Add skills and portfolio if not private
                if (!isset($privacySettings['hide_skills'])) {
                    $publicProfile['skills'] = $this->getFreelancerSkills($userId);
                }
                
                if (!isset($privacySettings['hide_portfolio'])) {
                    $publicProfile['portfolio'] = $this->getFreelancerPortfolio($userId, 6); // Limit to 6 items
                }
            }
            
            // Increment profile views
            if ($freelancer) {
                $freelancer->profile_views = ($freelancer->profile_views ?? 0) + 1;
                $freelancer->save();
            }
        }
        
        $this->sendSuccessResponse($publicProfile);
    }
    
    /**
     * Helper: Update freelancer profile
     */
    private function updateFreelancerProfile($userId, $input)
    {
        $freelancer = Freelancer::where('user_id', $userId)->first();
        if (!$freelancer) {
            return;
        }
        
        if (isset($input['professional_title'])) {
            $titleValidation = $this->validator->validateText($input['professional_title'], 200, true);
            if ($titleValidation['valid']) {
                $freelancer->professional_title = $titleValidation['sanitized'];
            }
        }
        
        if (isset($input['bio'])) {
            $bioValidation = $this->validator->validateText($input['bio'], 2000);
            if ($bioValidation['valid']) {
                $freelancer->bio = $bioValidation['sanitized'];
            }
        }
        
        if (isset($input['hourly_rate'])) {
            $rateValidation = $this->validator->validateNumber($input['hourly_rate'], 0, 10000);
            if ($rateValidation['valid']) {
                $freelancer->hourly_rate = $rateValidation['sanitized'];
            }
        }
        
        if (isset($input['experience_level'])) {
            $validLevels = ['beginner', 'intermediate', 'expert'];
            if (in_array($input['experience_level'], $validLevels)) {
                $freelancer->experience_level = $input['experience_level'];
            }
        }
        
        if (isset($input['availability_status'])) {
            $validStatuses = ['available', 'busy', 'unavailable'];
            if (in_array($input['availability_status'], $validStatuses)) {
                $freelancer->availability_status = $input['availability_status'];
            }
        }
        
        if (isset($input['languages'])) {
            $freelancer->languages = json_encode($input['languages']);
        }
        
        if (isset($input['timezone'])) {
            $freelancer->timezone = $input['timezone'];
        }
        
        $freelancer->save();
    }
    
    /**
     * Helper: Update client profile
     */
    private function updateClientProfile($userId, $input)
    {
        $client = Client::where('user_id', $userId)->first();
        if (!$client) {
            return;
        }
        
        if (isset($input['company_name'])) {
            $nameValidation = $this->validator->validateName($input['company_name'], 'company name');
            if ($nameValidation['valid']) {
                $client->company_name = $nameValidation['sanitized'];
            }
        }
        
        if (isset($input['company_description'])) {
            $descValidation = $this->validator->validateText($input['company_description'], 2000);
            if ($descValidation['valid']) {
                $client->company_description = $descValidation['sanitized'];
            }
        }
        
        if (isset($input['industry'])) {
            $client->industry = $input['industry'];
        }
        
        if (isset($input['company_size'])) {
            $client->company_size = $input['company_size'];
        }
        
        if (isset($input['website'])) {
            $urlValidation = $this->validator->validateURL($input['website']);
            if ($urlValidation['valid']) {
                $client->website = $urlValidation['sanitized'];
            }
        }
        
        $client->save();
    }
    
    /**
     * Helper: Get freelancer skills
     */
    private function getFreelancerSkills($userId)
    {
        $skills = $this->db->query("
            SELECT s.name, s.category, fs.proficiency_level, fs.years_experience
            FROM freelancer_skills fs
            JOIN skills s ON fs.skill_id = s.id
            WHERE fs.freelancer_id = ?
            ORDER BY s.category, s.name
        ", [$userId]);
        
        return $skills ?: [];
    }
    
    /**
     * Helper: Get freelancer portfolio
     */
    private function getFreelancerPortfolio($userId, $limit = null)
    {
        $sql = "
            SELECT pi.*, 
                   COUNT(mf.id) as media_count,
                   GROUP_CONCAT(mf.file_path) as media_files
            FROM portfolio_items pi
            LEFT JOIN media_files mf ON mf.related_id = pi.id AND mf.file_type = 'portfolio'
            WHERE pi.freelancer_id = ? AND pi.status = 'active'
            GROUP BY pi.id
            ORDER BY pi.created_at DESC
        ";
        
        if ($limit) {
            $sql .= " LIMIT " . intval($limit);
        }
        
        $portfolio = $this->db->query($sql, [$userId]);
        
        // Process portfolio items
        foreach ($portfolio as &$item) {
            $item['technologies'] = json_decode($item['technologies_used'] ?? '[]', true);
            $item['media'] = $item['media_files'] ? explode(',', $item['media_files']) : [];
            unset($item['technologies_used'], $item['media_files']);
        }
        
        return $portfolio ?: [];
    }
    
    /**
     * Helper: Calculate profile completeness
     */
    private function calculateProfileCompleteness($user)
    {
        $score = 0;
        $maxScore = 100;
        $steps = [];
        
        // Basic info (30 points)
        if (!empty($user->first_name)) $score += 5;
        else $steps[] = 'Add your first name';
        
        if (!empty($user->last_name)) $score += 5;
        else $steps[] = 'Add your last name';
        
        if (!empty($user->avatar_url)) $score += 10;
        else $steps[] = 'Upload a profile picture';
        
        if (!empty($user->email_verified_at)) $score += 10;
        else $steps[] = 'Verify your email address';
        
        if ($user->user_type === 'freelancer') {
            $freelancer = Freelancer::where('user_id', $user->id)->first();
            
            // Freelancer specific (70 points)
            if ($freelancer && !empty($freelancer->professional_title)) $score += 15;
            else $steps[] = 'Add your professional title';
            
            if ($freelancer && !empty($freelancer->bio)) $score += 15;
            else $steps[] = 'Write a professional bio';
            
            if ($freelancer && !empty($freelancer->hourly_rate)) $score += 10;
            else $steps[] = 'Set your hourly rate';
            
            // Skills (15 points)
            $skillsCount = FreelancerSkill::where('freelancer_id', $user->id)->count();
            if ($skillsCount >= 3) $score += 15;
            else $steps[] = 'Add at least 3 skills';
            
            // Portfolio (15 points)
            $portfolioCount = PortfolioItem::where('freelancer_id', $user->id)->count();
            if ($portfolioCount >= 1) $score += 15;
            else $steps[] = 'Add at least one portfolio item';
            
        } else {
            $client = Client::where('user_id', $user->id)->first();
            
            // Client specific (70 points)
            if ($client && !empty($client->company_name)) $score += 20;
            else $steps[] = 'Add your company name';
            
            if ($client && !empty($client->company_description)) $score += 20;
            else $steps[] = 'Describe your company';
            
            if ($client && !empty($client->industry)) $score += 15;
            else $steps[] = 'Select your industry';
            
            if ($client && !empty($client->company_size)) $score += 15;
            else $steps[] = 'Add your company size';
        }
        
        return [
            'score' => $score,
            'percentage' => ($score / $maxScore) * 100,
            'next_steps' => $steps
        ];
    }
    
    /**
     * Helper: Get authenticated user
     */
    private function getAuthenticatedUser()
    {
        $token = $this->security->getBearerToken();
        if (!$token) {
            return null;
        }
        
        $payload = $this->security->validateJWT($token);
        if (!$payload) {
            return null;
        }
        
        return User::find($payload['user_id']);
    }
    
    /**
     * Helper: Get JSON input
     */
    private function getJSONInput()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input ?: [];
    }
    
    /**
     * Helper: Send success response
     */
    private function sendSuccessResponse($data)
    {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    /**
     * Helper: Send error response
     */
    private function sendErrorResponse($status, $message)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    /**
     * Helper: Log activity
     */
    private function logActivity($userId, $action, $resourceType, $resourceId, $context = [])
    {
        AuditLog::create([
            'user_id' => $userId,
            'session_id' => session_id(),
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'context' => json_encode($context),
            'severity' => 'info',
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Helper: Log errors
     */
    private function logError($exception, $userId = null)
    {
        error_log('[ProfileController] ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());
        
        AuditLog::create([
            'user_id' => $userId,
            'session_id' => session_id(),
            'action' => 'system_error',
            'resource_type' => 'system',
            'resource_id' => null,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'context' => json_encode([
                'error' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine()
            ]),
            'severity' => 'error',
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
}

// Handle requests if called directly
if ($_SERVER['REQUEST_METHOD'] !== 'GET' || isset($_GET['action'])) {
    $controller = new ProfileController();
    $controller->handleRequest();
}
?>