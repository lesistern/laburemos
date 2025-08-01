<?php
/**
 * Project Model
 * LaburAR Complete Platform
 * 
 * Manages project lifecycle, milestones,
 * proposals, and workflow automation
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/BaseModel.php';

class Project extends BaseModel {
    protected static $table = 'projects';
    
    protected static $fillable = [
        'client_id', 'freelancer_id', 'service_id',
        'title', 'description', 'requirements',
        'category_id', 'complexity', 'priority',
        'budget_type', 'budget_amount', 'hourly_rate', 'currency',
        'estimated_duration', 'start_date', 'deadline',
        'deliverables_description', 'source_files_required',
        'revisions_included', 'status'
    ];
    
    // ===== Project Creation & Management =====
    
    public static function createProject($data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Validate required fields
            $required = ['client_id', 'title', 'description', 'budget_type', 'budget_amount'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field {$field} is required");
                }
            }
            
            // Set defaults
            $data['status'] = $data['status'] ?? 'draft';
            $data['currency'] = $data['currency'] ?? 'ARS';
            $data['complexity'] = $data['complexity'] ?? 'medium';
            $data['priority'] = $data['priority'] ?? 'medium';
            $data['revisions_included'] = $data['revisions_included'] ?? 2;
            
            // Calculate estimated duration if not provided
            if (empty($data['estimated_duration']) && !empty($data['budget_amount'])) {
                $data['estimated_duration'] = static::calculateEstimatedDuration(
                    $data['budget_amount'], 
                    $data['complexity']
                );
            }
            
            $pdo->beginTransaction();
            
            // Create project
            $project = static::create($data);
            $projectId = $project['id'];
            
            // Create default milestones if template provided
            if (!empty($data['template_id'])) {
                static::createMilestonesFromTemplate($projectId, $data['template_id']);
            } elseif (!empty($data['milestones'])) {
                static::createCustomMilestones($projectId, $data['milestones']);
            }
            
            // Log project creation
            static::logTimeline($projectId, $data['client_id'], 'project_created', 'Project created');
            
            $pdo->commit();
            
            return static::getProjectWithDetails($projectId);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Project::createProject] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function updateProjectStatus($projectId, $newStatus, $userId, $notes = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $project = static::find($projectId);
            if (!$project) {
                throw new Exception('Project not found');
            }
            
            $oldStatus = $project['status'];
            
            // Validate status transition
            if (!static::canTransitionStatus($oldStatus, $newStatus, $userId, $projectId)) {
                throw new Exception("Invalid status transition from {$oldStatus} to {$newStatus}");
            }
            
            $pdo->beginTransaction();
            
            // Update project status
            static::update($projectId, [
                'status' => $newStatus,
                'last_activity' => date('Y-m-d H:i:s')
            ]);
            
            // Handle status-specific actions
            static::handleStatusChange($projectId, $oldStatus, $newStatus, $userId);
            
            // Log timeline
            $description = "Project status changed from {$oldStatus} to {$newStatus}";
            if ($notes) {
                $description .= ": {$notes}";
            }
            
            static::logTimeline($projectId, $userId, 'status_changed', $description, [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'notes' => $notes
            ]);
            
            $pdo->commit();
            
            return static::getProjectWithDetails($projectId);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Project::updateProjectStatus] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Project Search & Filtering =====
    
    public static function searchProjects($filters = [], $page = 1, $limit = 20) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = [];
            $params = [];
            
            $query = "
                SELECT p.*, 
                       uc.first_name as client_first_name, uc.last_name as client_last_name,
                       uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name,
                       sc.name as category_name,
                       ps.proposals_count,
                       ps.completed_milestones,
                       ps.total_milestones
                FROM projects p
                LEFT JOIN users uc ON p.client_id = uc.id
                LEFT JOIN users uf ON p.freelancer_id = uf.id
                LEFT JOIN service_categories sc ON p.category_id = sc.id
                LEFT JOIN project_stats ps ON p.id = ps.project_id
            ";
            
            // Status filter
            if (!empty($filters['status'])) {
                if (is_array($filters['status'])) {
                    $placeholders = str_repeat('?,', count($filters['status']) - 1) . '?';
                    $conditions[] = "p.status IN ($placeholders)";
                    $params = array_merge($params, $filters['status']);
                } else {
                    $conditions[] = "p.status = ?";
                    $params[] = $filters['status'];
                }
            }
            
            // Category filter
            if (!empty($filters['category_id'])) {
                $conditions[] = "p.category_id = ?";
                $params[] = $filters['category_id'];
            }
            
            // Budget range
            if (!empty($filters['budget_min'])) {
                $conditions[] = "p.budget_amount >= ?";
                $params[] = $filters['budget_min'];
            }
            
            if (!empty($filters['budget_max'])) {
                $conditions[] = "p.budget_amount <= ?";
                $params[] = $filters['budget_max'];
            }
            
            // Complexity filter
            if (!empty($filters['complexity'])) {
                $conditions[] = "p.complexity = ?";
                $params[] = $filters['complexity'];
            }
            
            // Client or freelancer filter
            if (!empty($filters['client_id'])) {
                $conditions[] = "p.client_id = ?";
                $params[] = $filters['client_id'];
            }
            
            if (!empty($filters['freelancer_id'])) {
                $conditions[] = "p.freelancer_id = ?";
                $params[] = $filters['freelancer_id'];
            }
            
            // Deadline filter
            if (!empty($filters['deadline_before'])) {
                $conditions[] = "p.deadline <= ?";
                $params[] = $filters['deadline_before'];
            }
            
            // Search query
            if (!empty($filters['q'])) {
                $conditions[] = "(p.title LIKE ? OR p.description LIKE ?)";
                $searchTerm = '%' . $filters['q'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            // Add WHERE clause
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(' AND ', $conditions);
            }
            
            // Sorting
            $orderBy = static::buildProjectOrderBy($filters['sort'] ?? 'recent');
            $query .= " ORDER BY " . $orderBy;
            
            // Pagination
            $offset = ($page - 1) * $limit;
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process project data
            foreach ($projects as &$project) {
                $project = static::processProjectData($project);
            }
            
            // Get total count
            $countQuery = str_replace(
                "SELECT p.*, uc.first_name as client_first_name, uc.last_name as client_last_name, uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name, sc.name as category_name, ps.proposals_count, ps.completed_milestones, ps.total_milestones",
                "SELECT COUNT(*)",
                explode(" ORDER BY", $query)[0]
            );
            
            $countParams = array_slice($params, 0, -2);
            $countStmt = $pdo->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetchColumn();
            
            return [
                'projects' => $projects,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ];
            
        } catch (Exception $e) {
            error_log('[Project::searchProjects] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Milestones Management =====
    
    public static function createMilestone($projectId, $data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Validate project exists
            $project = static::find($projectId);
            if (!$project) {
                throw new Exception('Project not found');
            }
            
            // Set default values
            $data['project_id'] = $projectId;
            $data['status'] = $data['status'] ?? 'pending';
            
            // Auto-calculate sort order if not provided
            if (empty($data['sort_order'])) {
                $stmt = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM project_milestones WHERE project_id = ?");
                $stmt->execute([$projectId]);
                $data['sort_order'] = $stmt->fetchColumn();
            }
            
            // Create milestone
            $stmt = $pdo->prepare("
                INSERT INTO project_milestones 
                (project_id, title, description, deliverables, amount, percentage, estimated_days, due_date, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['project_id'],
                $data['title'],
                $data['description'] ?? '',
                $data['deliverables'] ?? '',
                $data['amount'],
                $data['percentage'] ?? null,
                $data['estimated_days'] ?? null,
                $data['due_date'] ?? null,
                $data['sort_order']
            ]);
            
            $milestoneId = $pdo->lastInsertId();
            
            // Log timeline
            static::logTimeline($projectId, null, 'milestone_created', "Milestone '{$data['title']}' created", [
                'milestone_id' => $milestoneId
            ]);
            
            return static::getMilestone($milestoneId);
            
        } catch (Exception $e) {
            error_log('[Project::createMilestone] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function updateMilestoneStatus($milestoneId, $status, $userId, $notes = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $milestone = static::getMilestone($milestoneId);
            if (!$milestone) {
                throw new Exception('Milestone not found');
            }
            
            $oldStatus = $milestone['status'];
            $updates = ['status' => $status];
            
            // Handle status-specific updates
            if ($status === 'delivered') {
                $updates['completed_at'] = date('Y-m-d H:i:s');
            } elseif ($status === 'approved') {
                $updates['client_approved'] = true;
                $updates['approval_date'] = date('Y-m-d H:i:s');
            }
            
            if ($notes) {
                $updates['revision_notes'] = $notes;
            }
            
            // Update milestone
            $setParts = array_map(function($key) { return "$key = ?"; }, array_keys($updates));
            $stmt = $pdo->prepare("
                UPDATE project_milestones 
                SET " . implode(', ', $setParts) . ", updated_at = NOW()
                WHERE id = ?
            ");
            
            $values = array_values($updates);
            $values[] = $milestoneId;
            $stmt->execute($values);
            
            // Log timeline
            $description = "Milestone '{$milestone['title']}' status changed to {$status}";
            if ($notes) {
                $description .= ": {$notes}";
            }
            
            static::logTimeline($milestone['project_id'], $userId, 'milestone_updated', $description, [
                'milestone_id' => $milestoneId,
                'old_status' => $oldStatus,
                'new_status' => $status
            ]);
            
            // Check if all milestones are completed
            static::checkProjectCompletion($milestone['project_id']);
            
            return static::getMilestone($milestoneId);
            
        } catch (Exception $e) {
            error_log('[Project::updateMilestoneStatus] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Proposals Management =====
    
    public static function createProposal($projectId, $freelancerId, $data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Validate project exists and is accepting proposals
            $project = static::find($projectId);
            if (!$project) {
                throw new Exception('Project not found');
            }
            
            if (!in_array($project['status'], ['posted', 'proposals_review'])) {
                throw new Exception('Project is not accepting proposals');
            }
            
            // Check if freelancer already submitted proposal
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM project_proposals 
                WHERE project_id = ? AND freelancer_id = ?
            ");
            $stmt->execute([$projectId, $freelancerId]);
            
            if ($stmt->fetchColumn() > 0) {
                throw new Exception('You have already submitted a proposal for this project');
            }
            
            // Create proposal
            $stmt = $pdo->prepare("
                INSERT INTO project_proposals 
                (project_id, freelancer_id, cover_letter, proposed_budget, proposed_timeline, portfolio_items, similar_work_examples, questions_for_client)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $projectId,
                $freelancerId,
                $data['cover_letter'],
                $data['proposed_budget'],
                $data['proposed_timeline'],
                json_encode($data['portfolio_items'] ?? []),
                $data['similar_work_examples'] ?? '',
                $data['questions_for_client'] ?? ''
            ]);
            
            $proposalId = $pdo->lastInsertId();
            
            // Update project status if first proposal
            if ($project['status'] === 'posted') {
                static::update($projectId, ['status' => 'proposals_review']);
            }
            
            // Log timeline
            static::logTimeline($projectId, $freelancerId, 'proposal_submitted', 'New proposal submitted', [
                'proposal_id' => $proposalId,
                'proposed_budget' => $data['proposed_budget'],
                'proposed_timeline' => $data['proposed_timeline']
            ]);
            
            return static::getProposal($proposalId);
            
        } catch (Exception $e) {
            error_log('[Project::createProposal] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function acceptProposal($proposalId, $clientId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $proposal = static::getProposal($proposalId);
            if (!$proposal) {
                throw new Exception('Proposal not found');
            }
            
            // Verify client owns the project
            $project = static::find($proposal['project_id']);
            if ($project['client_id'] != $clientId) {
                throw new Exception('Unauthorized');
            }
            
            $pdo->beginTransaction();
            
            // Accept the proposal
            $stmt = $pdo->prepare("
                UPDATE project_proposals 
                SET status = 'accepted', responded_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$proposalId]);
            
            // Reject all other proposals
            $stmt = $pdo->prepare("
                UPDATE project_proposals 
                SET status = 'rejected', responded_at = NOW() 
                WHERE project_id = ? AND id != ?
            ");
            $stmt->execute([$proposal['project_id'], $proposalId]);
            
            // Assign freelancer to project and update status
            static::update($proposal['project_id'], [
                'freelancer_id' => $proposal['freelancer_id'],
                'status' => 'in_progress',
                'start_date' => date('Y-m-d'),
                'budget_amount' => $proposal['proposed_budget'],
                'estimated_duration' => $proposal['proposed_timeline']
            ]);
            
            // Log timeline
            static::logTimeline($proposal['project_id'], $clientId, 'proposal_accepted', 'Proposal accepted - project started', [
                'proposal_id' => $proposalId,
                'freelancer_id' => $proposal['freelancer_id']
            ]);
            
            $pdo->commit();
            
            return static::getProjectWithDetails($proposal['project_id']);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Project::acceptProposal] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Helper Methods =====
    
    private static function processProjectData($project) {
        // Add computed fields
        $project['client_name'] = trim($project['client_first_name'] . ' ' . $project['client_last_name']);
        $project['freelancer_name'] = trim($project['freelancer_first_name'] . ' ' . $project['freelancer_last_name']);
        $project['formatted_budget'] = static::formatCurrency($project['budget_amount'], $project['currency']);
        $project['days_remaining'] = static::calculateDaysRemaining($project['deadline']);
        $project['progress_percentage'] = static::calculateProgress($project);
        
        return $project;
    }
    
    private static function buildProjectOrderBy($sort) {
        $orderOptions = [
            'recent' => 'p.created_at DESC',
            'deadline' => 'p.deadline ASC',
            'budget_high' => 'p.budget_amount DESC',
            'budget_low' => 'p.budget_amount ASC',
            'activity' => 'p.last_activity DESC',
            'proposals' => 'ps.proposals_count DESC'
        ];
        
        return $orderOptions[$sort] ?? $orderOptions['recent'];
    }
    
    private static function calculateEstimatedDuration($budget, $complexity) {
        $baseDays = [
            'simple' => 3,
            'medium' => 7,
            'complex' => 21,
            'enterprise' => 45
        ];
        
        $base = $baseDays[$complexity] ?? 7;
        
        // Adjust based on budget (rough estimation)
        if ($budget > 100000) $base *= 1.5;
        if ($budget > 300000) $base *= 2;
        
        return min($base, 90); // Cap at 90 days
    }
    
    private static function formatCurrency($amount, $currency = 'ARS') {
        return number_format($amount, 0, ',', '.') . ' ' . $currency;
    }
    
    private static function calculateDaysRemaining($deadline) {
        if (!$deadline) return null;
        
        $deadlineDate = new DateTime($deadline);
        $now = new DateTime();
        $diff = $now->diff($deadlineDate);
        
        return $diff->invert ? -$diff->days : $diff->days;
    }
    
    private static function calculateProgress($project) {
        if (empty($project['total_milestones'])) return 0;
        return round(($project['completed_milestones'] / $project['total_milestones']) * 100);
    }
    
    // ===== Database Helpers =====
    
    public static function getProjectWithDetails($projectId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT p.*, 
                       uc.first_name as client_first_name, uc.last_name as client_last_name,
                       uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name,
                       sc.name as category_name,
                       ps.proposals_count,
                       ps.completed_milestones,
                       ps.total_milestones
                FROM projects p
                LEFT JOIN users uc ON p.client_id = uc.id
                LEFT JOIN users uf ON p.freelancer_id = uf.id
                LEFT JOIN service_categories sc ON p.category_id = sc.id
                LEFT JOIN project_stats ps ON p.id = ps.project_id
                WHERE p.id = ?
            ");
            $stmt->execute([$projectId]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($project) {
                $project = static::processProjectData($project);
            }
            
            return $project;
            
        } catch (Exception $e) {
            error_log('[Project::getProjectWithDetails] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function getMilestone($milestoneId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM project_milestones WHERE id = ?");
            $stmt->execute([$milestoneId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Project::getMilestone] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function getProposal($proposalId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT pp.*, 
                       u.first_name, u.last_name, u.avatar_url,
                       f.professional_title, f.rating_average
                FROM project_proposals pp
                LEFT JOIN users u ON pp.freelancer_id = u.id
                LEFT JOIN freelancers f ON u.id = f.user_id
                WHERE pp.id = ?
            ");
            $stmt->execute([$proposalId]);
            $proposal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($proposal && $proposal['portfolio_items']) {
                $proposal['portfolio_items'] = json_decode($proposal['portfolio_items'], true);
            }
            
            return $proposal;
            
        } catch (Exception $e) {
            error_log('[Project::getProposal] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function logTimeline($projectId, $userId, $eventType, $description, $eventData = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO project_timeline 
                (project_id, user_id, event_type, event_description, event_data)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $projectId,
                $userId,
                $eventType,
                $description,
                $eventData ? json_encode($eventData) : null
            ]);
            
        } catch (Exception $e) {
            error_log('[Project::logTimeline] Error: ' . $e->getMessage());
        }
    }
    
    // Additional methods would be implemented here for:
    // - Status workflow validation
    // - Template creation from milestones
    // - Project completion checking
    // - File management integration
    // - Communication integration
}
?>