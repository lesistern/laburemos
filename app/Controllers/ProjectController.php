<?php
/**
 * Project Controller
 * LaburAR Complete Platform
 * 
 * Complete project management with workflows,
 * milestones, proposals, and file handling
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/Project.php';
require_once __DIR__ . '/../models/Service.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';
require_once __DIR__ . '/../includes/MediaProcessor.php';

class ProjectController {
    private $securityHelper;
    private $validator;
    private $rateLimiter;
    private $mediaProcessor;
    
    public function __construct() {
        $this->securityHelper = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->rateLimiter = new RateLimiter();
        $this->mediaProcessor = new MediaProcessor();
    }
    
    public function handleRequest() {
        try {
            // Rate limiting
            if (!$this->rateLimiter->checkLimit('api_general')) {
                return $this->jsonError('Too many requests', 429);
            }
            
            // Get authenticated user
            $user = $this->getAuthenticatedUser();
            if (!$user) {
                return $this->jsonError('Authentication required', 401);
            }
            
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            // Handle different request methods
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'create':
                        return $this->createProject($user, $input);
                        
                    case 'update-status':
                        return $this->updateProjectStatus($user, $input);
                        
                    case 'create-proposal':
                        return $this->createProposal($user, $input);
                        
                    case 'accept-proposal':
                        return $this->acceptProposal($user, $input);
                        
                    case 'reject-proposal':
                        return $this->rejectProposal($user, $input);
                        
                    case 'create-milestone':
                        return $this->createMilestone($user, $input);
                        
                    case 'update-milestone':
                        return $this->updateMilestone($user, $input);
                        
                    case 'upload-file':
                        return $this->uploadFile($user);
                        
                    case 'send-message':
                        return $this->sendMessage($user, $input);
                        
                    case 'invite-freelancer':
                        return $this->inviteFreelancer($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'GET') {
                switch ($action) {
                    case 'search':
                        return $this->searchProjects($user);
                        
                    case 'get':
                        return $this->getProject($user);
                        
                    case 'my-projects':
                        return $this->getMyProjects($user);
                        
                    case 'proposals':
                        return $this->getProjectProposals($user);
                        
                    case 'milestones':
                        return $this->getProjectMilestones($user);
                        
                    case 'timeline':
                        return $this->getProjectTimeline($user);
                        
                    case 'messages':
                        return $this->getProjectMessages($user);
                        
                    case 'files':
                        return $this->getProjectFiles($user);
                        
                    case 'templates':
                        return $this->getProjectTemplates($user);
                        
                    case 'dashboard':
                        return $this->getProjectDashboard($user);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'PUT') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'update':
                        return $this->updateProject($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'DELETE') {
                switch ($action) {
                    case 'delete':
                        return $this->deleteProject($user);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } else {
                return $this->jsonError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log('[ProjectController] Error: ' . $e->getMessage());
            return $this->jsonError('Internal server error', 500);
        }
    }
    
    // ===== Project CRUD Operations =====
    
    private function createProject($user, $input) {
        try {
            // Validate required fields
            $required = ['title', 'description', 'budget_type', 'budget_amount'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            // Validate budget
            if ($input['budget_amount'] < 1000) {
                return $this->jsonError('Minimum budget is ARS 1,000', 400);
            }
            
            // Validate user is client
            if ($user['user_type'] !== 'client') {
                return $this->jsonError('Only clients can create projects', 403);
            }
            
            // Set client ID
            $input['client_id'] = $user['user_id'];
            
            // Validate and process deadline
            if (!empty($input['deadline'])) {
                $deadline = new DateTime($input['deadline']);
                $now = new DateTime();
                $now->add(new DateInterval('P1D')); // Must be at least tomorrow
                
                if ($deadline < $now) {
                    return $this->jsonError('Deadline must be at least 1 day from now', 400);
                }
                
                $input['deadline'] = $deadline->format('Y-m-d');
            }
            
            $project = Project::createProject($input);
            
            return $this->jsonSuccess([
                'project' => $project,
                'message' => 'Project created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::createProject] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create project: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateProject($user, $input) {
        try {
            $projectId = intval($input['project_id'] ?? 0);
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            $project = Project::find($projectId);
            if (!$project) {
                return $this->jsonError('Project not found', 404);
            }
            
            // Check permissions
            if (!$this->canEditProject($user, $project)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            // Only allow updates if project is in draft or posted status
            if (!in_array($project['status'], ['draft', 'posted'])) {
                return $this->jsonError('Cannot edit project in current status', 400);
            }
            
            // Filter allowed fields
            $allowedFields = ['title', 'description', 'requirements', 'budget_amount', 'deadline', 'revisions_included'];
            $updateData = array_intersect_key($input, array_flip($allowedFields));
            
            // Validate deadline if provided
            if (!empty($updateData['deadline'])) {
                $deadline = new DateTime($updateData['deadline']);
                $now = new DateTime();
                $now->add(new DateInterval('P1D'));
                
                if ($deadline < $now) {
                    return $this->jsonError('Deadline must be at least 1 day from now', 400);
                }
                
                $updateData['deadline'] = $deadline->format('Y-m-d');
            }
            
            Project::update($projectId, $updateData);
            
            // Log timeline
            Project::logTimeline($projectId, $user['user_id'], 'project_updated', 'Project details updated');
            
            $updatedProject = Project::getProjectWithDetails($projectId);
            
            return $this->jsonSuccess([
                'project' => $updatedProject,
                'message' => 'Project updated successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::updateProject] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to update project', 500);
        }
    }
    
    // ===== Project Status Management =====
    
    private function updateProjectStatus($user, $input) {
        try {
            $projectId = intval($input['project_id'] ?? 0);
            $newStatus = $input['status'] ?? '';
            $notes = $input['notes'] ?? null;
            
            if (!$projectId || !$newStatus) {
                return $this->jsonError('Project ID and status are required', 400);
            }
            
            $project = Project::find($projectId);
            if (!$project) {
                return $this->jsonError('Project not found', 404);
            }
            
            // Check permissions
            if (!$this->canUpdateProjectStatus($user, $project, $newStatus)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            $updatedProject = Project::updateProjectStatus($projectId, $newStatus, $user['user_id'], $notes);
            
            return $this->jsonSuccess([
                'project' => $updatedProject,
                'message' => 'Project status updated successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::updateProjectStatus] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to update project status: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Proposals Management =====
    
    private function createProposal($user, $input) {
        try {
            $projectId = intval($input['project_id'] ?? 0);
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            // Validate user is freelancer
            if ($user['user_type'] !== 'freelancer') {
                return $this->jsonError('Only freelancers can create proposals', 403);
            }
            
            // Validate required fields
            $required = ['cover_letter', 'proposed_budget', 'proposed_timeline'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            // Validate budget and timeline
            if ($input['proposed_budget'] < 1000) {
                return $this->jsonError('Minimum proposal budget is ARS 1,000', 400);
            }
            
            if ($input['proposed_timeline'] < 1) {
                return $this->jsonError('Timeline must be at least 1 day', 400);
            }
            
            $proposal = Project::createProposal($projectId, $user['user_id'], $input);
            
            return $this->jsonSuccess([
                'proposal' => $proposal,
                'message' => 'Proposal submitted successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::createProposal] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create proposal: ' . $e->getMessage(), 500);
        }
    }
    
    private function acceptProposal($user, $input) {
        try {
            $proposalId = intval($input['proposal_id'] ?? 0);
            
            if (!$proposalId) {
                return $this->jsonError('Proposal ID is required', 400);
            }
            
            // Validate user is client
            if ($user['user_type'] !== 'client') {
                return $this->jsonError('Only clients can accept proposals', 403);
            }
            
            $project = Project::acceptProposal($proposalId, $user['user_id']);
            
            return $this->jsonSuccess([
                'project' => $project,
                'message' => 'Proposal accepted successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::acceptProposal] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to accept proposal: ' . $e->getMessage(), 500);
        }
    }
    
    private function rejectProposal($user, $input) {
        try {
            $proposalId = intval($input['proposal_id'] ?? 0);
            $reason = $input['reason'] ?? '';
            
            if (!$proposalId) {
                return $this->jsonError('Proposal ID is required', 400);
            }
            
            $proposal = Project::getProposal($proposalId);
            if (!$proposal) {
                return $this->jsonError('Proposal not found', 404);
            }
            
            // Verify permissions
            $project = Project::find($proposal['project_id']);
            if ($project['client_id'] != $user['user_id']) {
                return $this->jsonError('Permission denied', 403);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Update proposal status
            $stmt = $pdo->prepare("
                UPDATE project_proposals 
                SET status = 'rejected', responded_at = NOW(), client_feedback = ?
                WHERE id = ?
            ");
            $stmt->execute([$reason, $proposalId]);
            
            // Log timeline
            Project::logTimeline($proposal['project_id'], $user['user_id'], 'proposal_rejected', 'Proposal rejected', [
                'proposal_id' => $proposalId,
                'reason' => $reason
            ]);
            
            return $this->jsonSuccess(['message' => 'Proposal rejected']);
            
        } catch (Exception $e) {
            error_log('[ProjectController::rejectProposal] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to reject proposal', 500);
        }
    }
    
    // ===== Milestones Management =====
    
    private function createMilestone($user, $input) {
        try {
            $projectId = intval($input['project_id'] ?? 0);
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            $project = Project::find($projectId);
            if (!$project) {
                return $this->jsonError('Project not found', 404);
            }
            
            // Check permissions
            if (!$this->canManageProject($user, $project)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            // Validate required fields
            $required = ['title', 'amount'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            $milestone = Project::createMilestone($projectId, $input);
            
            return $this->jsonSuccess([
                'milestone' => $milestone,
                'message' => 'Milestone created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::createMilestone] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create milestone: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateMilestone($user, $input) {
        try {
            $milestoneId = intval($input['milestone_id'] ?? 0);
            $status = $input['status'] ?? '';
            $notes = $input['notes'] ?? null;
            
            if (!$milestoneId || !$status) {
                return $this->jsonError('Milestone ID and status are required', 400);
            }
            
            $milestone = Project::getMilestone($milestoneId);
            if (!$milestone) {
                return $this->jsonError('Milestone not found', 404);
            }
            
            $project = Project::find($milestone['project_id']);
            
            // Check permissions
            if (!$this->canUpdateMilestone($user, $project, $milestone, $status)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            $updatedMilestone = Project::updateMilestoneStatus($milestoneId, $status, $user['user_id'], $notes);
            
            return $this->jsonSuccess([
                'milestone' => $updatedMilestone,
                'message' => 'Milestone updated successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::updateMilestone] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to update milestone: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== File Management =====
    
    private function uploadFile($user) {
        try {
            $projectId = intval($_POST['project_id'] ?? 0);
            $milestoneId = intval($_POST['milestone_id'] ?? 0) ?: null;
            $fileType = $_POST['file_type'] ?? 'deliverable';
            $description = $_POST['description'] ?? '';
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            if (empty($_FILES['file'])) {
                return $this->jsonError('File is required', 400);
            }
            
            $project = Project::find($projectId);
            if (!$project) {
                return $this->jsonError('Project not found', 404);
            }
            
            // Check permissions
            if (!$this->canUploadFile($user, $project, $fileType)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            // Process file upload
            $uploadResult = $this->mediaProcessor->processProjectFile($_FILES['file'], $projectId);
            
            if (!$uploadResult['success']) {
                return $this->jsonError('File upload failed: ' . $uploadResult['error'], 400);
            }
            
            // Save file record
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO project_files 
                (project_id, milestone_id, uploaded_by, original_name, file_name, file_path, file_size, mime_type, file_type, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $projectId,
                $milestoneId,
                $user['user_id'],
                $uploadResult['original_name'],
                $uploadResult['file_name'],
                $uploadResult['file_path'],
                $uploadResult['file_size'],
                $uploadResult['mime_type'],
                $fileType,
                $description
            ]);
            
            $fileId = $pdo->lastInsertId();
            
            // Log timeline
            Project::logTimeline($projectId, $user['user_id'], 'file_uploaded', "File '{$uploadResult['original_name']}' uploaded", [
                'file_id' => $fileId,
                'file_type' => $fileType,
                'milestone_id' => $milestoneId
            ]);
            
            return $this->jsonSuccess([
                'file_id' => $fileId,
                'file_url' => $uploadResult['file_url'],
                'message' => 'File uploaded successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::uploadFile] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to upload file', 500);
        }
    }
    
    // ===== Data Retrieval Methods =====
    
    private function searchProjects($user) {
        try {
            $filters = [];
            
            // Build filters from query parameters
            $allowedFilters = ['status', 'category_id', 'budget_min', 'budget_max', 'complexity', 'q', 'deadline_before'];
            foreach ($allowedFilters as $filter) {
                if (!empty($_GET[$filter])) {
                    $filters[$filter] = $_GET[$filter];
                }
            }
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
            
            $result = Project::searchProjects($filters, $page, $limit);
            
            return $this->jsonSuccess($result);
            
        } catch (Exception $e) {
            error_log('[ProjectController::searchProjects] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to search projects', 500);
        }
    }
    
    private function getProject($user) {
        try {
            $projectId = intval($_GET['project_id'] ?? 0);
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            $project = Project::getProjectWithDetails($projectId);
            if (!$project) {
                return $this->jsonError('Project not found', 404);
            }
            
            // Check if user can view this project
            if (!$this->canViewProject($user, $project)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            return $this->jsonSuccess(['project' => $project]);
            
        } catch (Exception $e) {
            error_log('[ProjectController::getProject] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get project', 500);
        }
    }
    
    private function getMyProjects($user) {
        try {
            $filters = [];
            
            // Filter by user role
            if ($user['user_type'] === 'client') {
                $filters['client_id'] = $user['user_id'];
            } else {
                $filters['freelancer_id'] = $user['user_id'];
            }
            
            // Additional filters
            if (!empty($_GET['status'])) {
                $filters['status'] = $_GET['status'];
            }
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
            
            $result = Project::searchProjects($filters, $page, $limit);
            
            return $this->jsonSuccess($result);
            
        } catch (Exception $e) {
            error_log('[ProjectController::getMyProjects] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get projects', 500);
        }
    }
    
    // ===== Permission Helpers =====
    
    private function canEditProject($user, $project) {
        // Only project owner (client) can edit
        return $project['client_id'] == $user['user_id'];
    }
    
    private function canViewProject($user, $project) {
        // Client, assigned freelancer, or admins can view
        return $project['client_id'] == $user['user_id'] || 
               $project['freelancer_id'] == $user['user_id'] ||
               $user['user_type'] === 'admin';
    }
    
    private function canManageProject($user, $project) {
        // Client or assigned freelancer can manage
        return $project['client_id'] == $user['user_id'] || 
               $project['freelancer_id'] == $user['user_id'];
    }
    
    private function canUpdateProjectStatus($user, $project, $newStatus) {
        $userType = $user['user_type'];
        $isClient = $project['client_id'] == $user['user_id'];
        $isFreelancer = $project['freelancer_id'] == $user['user_id'];
        
        // Define who can update to which status
        $statusPermissions = [
            'posted' => $isClient,
            'in_progress' => $isClient,
            'review' => $isFreelancer,
            'completed' => $isClient,
            'cancelled' => $isClient || $userType === 'admin'
        ];
        
        return $statusPermissions[$newStatus] ?? false;
    }
    
    private function canUpdateMilestone($user, $project, $milestone, $newStatus) {
        $isClient = $project['client_id'] == $user['user_id'];
        $isFreelancer = $project['freelancer_id'] == $user['user_id'];
        
        // Define who can update milestones to which status
        $statusPermissions = [
            'in_progress' => $isFreelancer,
            'delivered' => $isFreelancer,
            'approved' => $isClient,
            'revision_requested' => $isClient
        ];
        
        return $statusPermissions[$newStatus] ?? false;
    }
    
    private function canUploadFile($user, $project, $fileType) {
        $isClient = $project['client_id'] == $user['user_id'];
        $isFreelancer = $project['freelancer_id'] == $user['user_id'];
        
        // Define who can upload which file types
        $filePermissions = [
            'requirement' => $isClient,
            'reference' => $isClient,
            'deliverable' => $isFreelancer,
            'revision' => $isFreelancer,
            'final' => $isFreelancer
        ];
        
        return $filePermissions[$fileType] ?? false;
    }
    
    // ===== Utility Methods =====
    
    private function getAuthenticatedUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        try {
            $payload = $this->securityHelper->validateJWT($matches[1]);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
    
    private function jsonSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    private function jsonError($message, $code = 400) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

// Handle the request
$controller = new ProjectController();
$controller->handleRequest();
?>