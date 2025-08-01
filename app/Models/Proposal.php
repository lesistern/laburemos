<?php
/**
 * Proposal Model
 * LaburAR Complete Platform
 * 
 * Manages project proposals, negotiations,
 * and bidding system for freelancers
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/BaseModel.php';

class Proposal extends BaseModel {
    protected static $table = 'project_proposals';
    
    protected static $fillable = [
        'project_id', 'freelancer_id', 'cover_letter',
        'proposed_budget', 'proposed_timeline', 'portfolio_items',
        'similar_work_examples', 'questions_for_client', 'status'
    ];
    
    // ===== Proposal Management =====
    
    public static function getProjectProposals($projectId, $includeProfile = true) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $query = "
                SELECT pp.*, 
                       u.first_name, u.last_name, u.avatar_url,
                       f.professional_title, f.rating_average, f.completed_projects, f.response_time_hours
                FROM project_proposals pp
                JOIN users u ON pp.freelancer_id = u.id
                LEFT JOIN freelancers f ON u.id = f.user_id
                WHERE pp.project_id = ?
                ORDER BY 
                    CASE pp.status 
                        WHEN 'submitted' THEN 1 
                        WHEN 'negotiating' THEN 2 
                        WHEN 'accepted' THEN 3 
                        ELSE 4 
                    END,
                    pp.submitted_at DESC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$projectId]);
            $proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process proposals
            foreach ($proposals as &$proposal) {
                $proposal = static::processProposalData($proposal, $includeProfile);
            }
            
            return $proposals;
            
        } catch (Exception $e) {
            error_log('[Proposal::getProjectProposals] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getFreelancerProposals($freelancerId, $status = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = ['pp.freelancer_id = ?'];
            $params = [$freelancerId];
            
            if ($status) {
                $conditions[] = 'pp.status = ?';
                $params[] = $status;
            }
            
            $query = "
                SELECT pp.*, 
                       p.title as project_title, p.budget_amount, p.status as project_status,
                       uc.first_name as client_first_name, uc.last_name as client_last_name,
                       sc.name as category_name
                FROM project_proposals pp
                JOIN projects p ON pp.project_id = p.id
                JOIN users uc ON p.client_id = uc.id
                LEFT JOIN service_categories sc ON p.category_id = sc.id
                WHERE " . implode(' AND ', $conditions) . "
                ORDER BY pp.submitted_at DESC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process proposals
            foreach ($proposals as &$proposal) {
                $proposal = static::processProposalData($proposal, false);
                $proposal['client_name'] = trim($proposal['client_first_name'] . ' ' . $proposal['client_last_name']);
                $proposal['formatted_project_budget'] = static::formatCurrency($proposal['budget_amount']);
                $proposal['formatted_proposed_budget'] = static::formatCurrency($proposal['proposed_budget']);
                $proposal['timeline_text'] = static::formatTimeline($proposal['proposed_timeline']);
            }
            
            return $proposals;
            
        } catch (Exception $e) {
            error_log('[Proposal::getFreelancerProposals] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function updateProposalStatus($proposalId, $status, $userId, $feedback = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $proposal = static::find($proposalId);
            if (!$proposal) {
                throw new Exception('Proposal not found');
            }
            
            $updates = [
                'status' => $status,
                'responded_at' => date('Y-m-d H:i:s')
            ];
            
            if ($feedback) {
                if ($status === 'rejected') {
                    $updates['client_feedback'] = $feedback;
                } else {
                    $updates['negotiation_notes'] = $feedback;
                }
            }
            
            // Update proposal
            $setParts = array_map(function($key) { return "$key = ?"; }, array_keys($updates));
            $stmt = $pdo->prepare("
                UPDATE project_proposals 
                SET " . implode(', ', $setParts) . " 
                WHERE id = ?
            ");
            
            $values = array_values($updates);
            $values[] = $proposalId;
            $stmt->execute($values);
            
            return static::find($proposalId);
            
        } catch (Exception $e) {
            error_log('[Proposal::updateProposalStatus] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Proposal Analytics =====
    
    public static function getProposalStats($freelancerId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_proposals,
                    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_proposals,
                    SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_proposals,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_proposals,
                    ROUND(
                        (SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) / 
                         NULLIF(SUM(CASE WHEN status IN ('accepted', 'rejected') THEN 1 ELSE 0 END), 0)) * 100, 
                        1
                    ) as success_rate,
                    AVG(proposed_budget) as avg_proposed_budget,
                    AVG(proposed_timeline) as avg_proposed_timeline
                FROM project_proposals 
                WHERE freelancer_id = ?
            ");
            $stmt->execute([$freelancerId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get recent proposal trends (last 30 days)
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(submitted_at) as proposal_date,
                    COUNT(*) as daily_count
                FROM project_proposals 
                WHERE freelancer_id = ? 
                AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(submitted_at)
                ORDER BY proposal_date ASC
            ");
            $stmt->execute([$freelancerId]);
            $trends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'stats' => $stats,
                'trends' => $trends
            ];
            
        } catch (Exception $e) {
            error_log('[Proposal::getProposalStats] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getCompetitiveAnalysis($projectId, $excludeFreelancerId = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = ['project_id = ?', 'status = ?'];
            $params = [$projectId, 'submitted'];
            
            if ($excludeFreelancerId) {
                $conditions[] = 'freelancer_id != ?';
                $params[] = $excludeFreelancerId;
            }
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_proposals,
                    MIN(proposed_budget) as min_budget,
                    MAX(proposed_budget) as max_budget,
                    AVG(proposed_budget) as avg_budget,
                    MIN(proposed_timeline) as min_timeline,
                    MAX(proposed_timeline) as max_timeline,
                    AVG(proposed_timeline) as avg_timeline
                FROM project_proposals 
                WHERE " . implode(' AND ', $conditions)
            );
            $stmt->execute($params);
            $analysis = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get budget distribution
            $stmt = $pdo->prepare("
                SELECT 
                    CASE 
                        WHEN proposed_budget < 10000 THEN 'Under 10K'
                        WHEN proposed_budget < 50000 THEN '10K-50K'
                        WHEN proposed_budget < 100000 THEN '50K-100K'
                        WHEN proposed_budget < 250000 THEN '100K-250K'
                        ELSE 'Over 250K'
                    END as budget_range,
                    COUNT(*) as count
                FROM project_proposals 
                WHERE " . implode(' AND ', $conditions) . "
                GROUP BY budget_range
                ORDER BY MIN(proposed_budget)
            ");
            $stmt->execute($params);
            $budgetDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'analysis' => $analysis,
                'budget_distribution' => $budgetDistribution
            ];
            
        } catch (Exception $e) {
            error_log('[Proposal::getCompetitiveAnalysis] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Proposal Recommendations =====
    
    public static function generateProposalRecommendations($projectId, $freelancerId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get project details
            $stmt = $pdo->prepare("
                SELECT p.*, sc.name as category_name
                FROM projects p
                LEFT JOIN service_categories sc ON p.category_id = sc.id
                WHERE p.id = ?
            ");
            $stmt->execute([$projectId]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$project) {
                throw new Exception('Project not found');
            }
            
            // Get freelancer's previous proposals in same category
            $stmt = $pdo->prepare("
                SELECT AVG(proposed_budget) as avg_budget, AVG(proposed_timeline) as avg_timeline
                FROM project_proposals pp
                JOIN projects p ON pp.project_id = p.id
                WHERE pp.freelancer_id = ? 
                AND p.category_id = ?
                AND pp.status = 'accepted'
            ");
            $stmt->execute([$freelancerId, $project['category_id']]);
            $freelancerHistory = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get market rates for similar projects
            $stmt = $pdo->prepare("
                SELECT 
                    AVG(proposed_budget) as market_avg_budget,
                    MIN(proposed_budget) as market_min_budget,
                    MAX(proposed_budget) as market_max_budget,
                    AVG(proposed_timeline) as market_avg_timeline
                FROM project_proposals pp
                JOIN projects p ON pp.project_id = p.id
                WHERE p.category_id = ?
                AND p.budget_amount BETWEEN ? AND ?
                AND pp.status = 'accepted'
                AND pp.submitted_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            ");
            
            $budgetRange = $project['budget_amount'] * 0.2; // 20% range
            $stmt->execute([
                $project['category_id'],
                $project['budget_amount'] - $budgetRange,
                $project['budget_amount'] + $budgetRange
            ]);
            $marketData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Generate recommendations
            $recommendations = [
                'suggested_budget' => [
                    'competitive' => $marketData['market_avg_budget'] * 0.95, // 5% below market average
                    'market_rate' => $marketData['market_avg_budget'],
                    'premium' => $marketData['market_avg_budget'] * 1.1, // 10% above market average
                    'range' => [
                        'min' => $marketData['market_min_budget'],
                        'max' => $marketData['market_max_budget']
                    ]
                ],
                'suggested_timeline' => [
                    'fast' => ceil($marketData['market_avg_timeline'] * 0.8),
                    'standard' => ceil($marketData['market_avg_timeline']),
                    'comfortable' => ceil($marketData['market_avg_timeline'] * 1.2)
                ],
                'winning_factors' => static::getWinningFactors($project['category_id']),
                'freelancer_history' => $freelancerHistory
            ];
            
            return $recommendations;
            
        } catch (Exception $e) {
            error_log('[Proposal::generateProposalRecommendations] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Helper Methods =====
    
    private static function processProposalData($proposal, $includeProfile = true) {
        // Decode JSON fields
        if ($proposal['portfolio_items']) {
            $proposal['portfolio_items'] = json_decode($proposal['portfolio_items'], true) ?? [];
        }
        
        // Add computed fields
        $proposal['freelancer_name'] = trim($proposal['first_name'] . ' ' . $proposal['last_name']);
        $proposal['formatted_budget'] = static::formatCurrency($proposal['proposed_budget']);
        $proposal['timeline_text'] = static::formatTimeline($proposal['proposed_timeline']);
        $proposal['time_since_submitted'] = static::timeAgo($proposal['submitted_at']);
        
        if ($includeProfile) {
            $proposal['profile_completeness'] = static::calculateProfileCompleteness($proposal);
            $proposal['experience_badge'] = static::getExperienceBadge($proposal['completed_projects']);
        }
        
        return $proposal;
    }
    
    private static function getWinningFactors($categoryId) {
        // This would be based on analysis of successful proposals
        $factors = [
            1 => [ // Development & Programming
                'Technical expertise demonstration',
                'Clear project breakdown',
                'Previous similar work examples',
                'Realistic timeline estimation',
                'Post-delivery support offer'
            ],
            2 => [ // Design & Creative
                'Strong portfolio showcase',
                'Understanding of brand requirements',
                'Multiple concept proposals',
                'Revision policy clarity',
                'File format specifications'
            ],
            3 => [ // Digital Marketing
                'Strategy outline',
                'Expected ROI projections',
                'Campaign timeline',
                'Reporting frequency',
                'Previous campaign results'
            ]
        ];
        
        return $factors[$categoryId] ?? [
            'Professional communication',
            'Competitive pricing',
            'Realistic timeline',
            'Previous client testimonials',
            'Clear deliverables outline'
        ];
    }
    
    private static function calculateProfileCompleteness($proposal) {
        $score = 0;
        $maxScore = 10;
        
        // Avatar
        if (!empty($proposal['avatar_url'])) $score++;
        
        // Professional title
        if (!empty($proposal['professional_title'])) $score++;
        
        // Rating
        if ($proposal['rating_average'] > 0) $score++;
        
        // Completed projects
        if ($proposal['completed_projects'] > 0) $score += 2;
        if ($proposal['completed_projects'] > 5) $score++;
        if ($proposal['completed_projects'] > 20) $score++;
        
        // Response time
        if ($proposal['response_time_hours'] <= 2) $score += 2;
        elseif ($proposal['response_time_hours'] <= 24) $score++;
        
        // Portfolio items
        if (count($proposal['portfolio_items']) > 0) $score++;
        
        return round(($score / $maxScore) * 100);
    }
    
    private static function getExperienceBadge($completedProjects) {
        if ($completedProjects >= 100) return 'expert';
        if ($completedProjects >= 50) return 'seasoned';
        if ($completedProjects >= 20) return 'experienced';
        if ($completedProjects >= 5) return 'established';
        return 'newcomer';
    }
    
    private static function formatCurrency($amount, $currency = 'ARS') {
        return number_format($amount, 0, ',', '.') . ' ' . $currency;
    }
    
    private static function formatTimeline($days) {
        if ($days == 1) return '1 día';
        if ($days < 7) return $days . ' días';
        if ($days == 7) return '1 semana';
        if ($days < 30) return ceil($days / 7) . ' semanas';
        return ceil($days / 30) . ' mes' . ($days >= 60 ? 'es' : '');
    }
    
    private static function timeAgo($datetime) {
        $time = time() - strtotime($datetime);
        
        if ($time < 60) return 'hace un momento';
        if ($time < 3600) return 'hace ' . floor($time/60) . ' minutos';
        if ($time < 86400) return 'hace ' . floor($time/3600) . ' horas';
        if ($time < 2592000) return 'hace ' . floor($time/86400) . ' días';
        
        return date('d/m/Y', strtotime($datetime));
    }
}
?>