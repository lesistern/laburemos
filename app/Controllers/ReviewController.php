<?php
/**
 * Review Controller
 * LaburAR Complete Platform - Phase 5
 * 
 * Complete review management with moderation workflows,
 * anti-fraud detection, and reputation system
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/Review.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';

class ReviewController {
    private $securityHelper;
    private $validator;
    private $rateLimiter;
    
    public function __construct() {
        $this->securityHelper = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->rateLimiter = new RateLimiter();
    }
    
    public function handleRequest() {
        try {
            // Rate limiting
            if (!$this->rateLimiter->checkLimit('api_review', 30)) {
                return $this->jsonError('Too many review requests', 429);
            }
            
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            // Get authenticated user
            $user = $this->getAuthenticatedUser();
            if (!$user) {
                return $this->jsonError('Authentication required', 401);
            }
            
            // Handle different request methods
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'create-review':
                        return $this->createReview($user, $input);
                        
                    case 'vote-review':
                        return $this->voteOnReview($user, $input);
                        
                    case 'flag-review':
                        return $this->flagReview($user, $input);
                        
                    case 'respond-to-review':
                        return $this->respondToReview($user, $input);
                        
                    case 'moderate-review':
                        return $this->moderateReview($user, $input);
                        
                    case 'bulk-moderate':
                        return $this->bulkModerrateReviews($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'GET') {
                switch ($action) {
                    case 'user-reviews':
                        return $this->getUserReviews($user);
                        
                    case 'project-reviews':
                        return $this->getProjectReviews($user);
                        
                    case 'review-details':
                        return $this->getReviewDetails($user);
                        
                    case 'user-reputation':
                        return $this->getUserReputation($user);
                        
                    case 'review-templates':
                        return $this->getReviewTemplates($user);
                        
                    case 'moderation-queue':
                        return $this->getModerationQueue($user);
                        
                    case 'review-stats':
                        return $this->getReviewStats($user);
                        
                    case 'top-rated-users':
                        return $this->getTopRatedUsers();
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'PUT') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'update-review':
                        return $this->updateReview($user, $input);
                        
                    case 'remove-vote':
                        return $this->removeVote($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'DELETE') {
                switch ($action) {
                    case 'delete-review':
                        return $this->deleteReview($user);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } else {
                return $this->jsonError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log('[ReviewController] Error: ' . $e->getMessage());
            return $this->jsonError('Internal server error', 500);
        }
    }
    
    // ===== Review Management =====
    
    private function createReview($user, $input) {
        try {
            // Validate required fields
            $required = ['project_id', 'reviewee_id', 'overall_rating'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            // Validate rating values
            $ratingFields = ['overall_rating', 'communication_rating', 'quality_rating', 
                           'timeliness_rating', 'professionalism_rating', 'value_rating'];
            
            foreach ($ratingFields as $field) {
                if (isset($input[$field])) {
                    $rating = floatval($input[$field]);
                    if ($rating < 1.0 || $rating > 5.0) {
                        return $this->jsonError("{$field} must be between 1.0 and 5.0", 400);
                    }
                }
            }
            
            // Set reviewer info
            $input['reviewer_id'] = $user['user_id'];
            $input['reviewer_type'] = $user['user_type'];
            
            // Add security metadata
            $input['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
            $input['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;
            
            // Validate text content
            if (isset($input['comment']) && strlen($input['comment']) > 2000) {
                return $this->jsonError('Comment is too long (max 2000 characters)', 400);
            }
            
            if (isset($input['title']) && strlen($input['title']) > 255) {
                return $this->jsonError('Title is too long (max 255 characters)', 400);
            }
            
            $review = Review::createReview($input);
            
            return $this->jsonSuccess([
                'review' => $review,
                'message' => 'Review created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::createReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create review: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateReview($user, $input) {
        try {
            $reviewId = intval($input['review_id'] ?? 0);
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            $review = Review::updateReview($reviewId, $input, $user['user_id']);
            
            return $this->jsonSuccess([
                'review' => $review,
                'message' => 'Review updated successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::updateReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to update review: ' . $e->getMessage(), 500);
        }
    }
    
    private function deleteReview($user) {
        try {
            $reviewId = intval($_GET['review_id'] ?? 0);
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            // Only admins can delete reviews
            if ($user['user_type'] !== 'admin') {
                return $this->jsonError('Unauthorized', 403);
            }
            
            Review::delete($reviewId);
            
            return $this->jsonSuccess(['message' => 'Review deleted successfully']);
            
        } catch (Exception $e) {
            error_log('[ReviewController::deleteReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to delete review: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Review Voting =====
    
    private function voteOnReview($user, $input) {
        try {
            $reviewId = intval($input['review_id'] ?? 0);
            $voteType = $input['vote_type'] ?? '';
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            if (!in_array($voteType, ['helpful', 'not_helpful'])) {
                return $this->jsonError('Invalid vote type', 400);
            }
            
            Review::voteOnReview($reviewId, $user['user_id'], $voteType);
            
            return $this->jsonSuccess(['message' => 'Vote recorded successfully']);
            
        } catch (Exception $e) {
            error_log('[ReviewController::voteOnReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to record vote: ' . $e->getMessage(), 500);
        }
    }
    
    private function removeVote($user, $input) {
        try {
            $reviewId = intval($input['review_id'] ?? 0);
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            Review::removeVote($reviewId, $user['user_id']);
            
            return $this->jsonSuccess(['message' => 'Vote removed successfully']);
            
        } catch (Exception $e) {
            error_log('[ReviewController::removeVote] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to remove vote: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Review Flagging =====
    
    private function flagReview($user, $input) {
        try {
            $reviewId = intval($input['review_id'] ?? 0);
            $reason = $input['reason'] ?? '';
            $description = $input['description'] ?? '';
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            $validReasons = ['inappropriate', 'fake', 'spam', 'offensive', 'other'];
            if (!in_array($reason, $validReasons)) {
                return $this->jsonError('Invalid flag reason', 400);
            }
            
            $flagId = Review::flagReview($reviewId, $user['user_id'], $reason, $description);
            
            return $this->jsonSuccess([
                'flag_id' => $flagId,
                'message' => 'Review flagged successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::flagReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to flag review: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Review Responses =====
    
    private function respondToReview($user, $input) {
        try {
            $reviewId = intval($input['review_id'] ?? 0);
            $responseText = trim($input['response_text'] ?? '');
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            if (empty($responseText)) {
                return $this->jsonError('Response text is required', 400);
            }
            
            if (strlen($responseText) > 1000) {
                return $this->jsonError('Response is too long (max 1000 characters)', 400);
            }
            
            $responseId = Review::addResponse($reviewId, $user['user_id'], $responseText);
            
            return $this->jsonSuccess([
                'response_id' => $responseId,
                'message' => 'Response added successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::respondToReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to add response: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Review Moderation =====
    
    private function moderateReview($user, $input) {
        try {
            // Only admins can moderate
            if ($user['user_type'] !== 'admin') {
                return $this->jsonError('Unauthorized', 403);
            }
            
            $reviewId = intval($input['review_id'] ?? 0);
            $action = $input['moderation_action'] ?? '';
            $reason = $input['reason'] ?? '';
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            if (!in_array($action, ['approve', 'reject'])) {
                return $this->jsonError('Invalid moderation action', 400);
            }
            
            if ($action === 'approve') {
                $result = Review::approveReview($reviewId, $user['user_id'], $reason);
            } else {
                if (empty($reason)) {
                    return $this->jsonError('Reason is required for rejection', 400);
                }
                $result = Review::rejectReview($reviewId, $user['user_id'], $reason);
            }
            
            return $this->jsonSuccess([
                'result' => $result,
                'message' => "Review {$action}d successfully"
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::moderateReview] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to moderate review: ' . $e->getMessage(), 500);
        }
    }
    
    private function bulkModerrateReviews($user, $input) {
        try {
            // Only admins can bulk moderate
            if ($user['user_type'] !== 'admin') {
                return $this->jsonError('Unauthorized', 403);
            }
            
            $reviewIds = $input['review_ids'] ?? [];
            $action = $input['moderation_action'] ?? '';
            $reason = $input['reason'] ?? '';
            
            if (empty($reviewIds) || !is_array($reviewIds)) {
                return $this->jsonError('Review IDs array is required', 400);
            }
            
            if (count($reviewIds) > 50) {
                return $this->jsonError('Cannot moderate more than 50 reviews at once', 400);
            }
            
            if (!in_array($action, ['approve', 'reject'])) {
                return $this->jsonError('Invalid moderation action', 400);
            }
            
            $results = [];
            $successCount = 0;
            $errorCount = 0;
            
            foreach ($reviewIds as $reviewId) {
                try {
                    if ($action === 'approve') {
                        Review::approveReview($reviewId, $user['user_id'], $reason);
                    } else {
                        Review::rejectReview($reviewId, $user['user_id'], $reason);
                    }
                    $results[$reviewId] = 'success';
                    $successCount++;
                } catch (Exception $e) {
                    $results[$reviewId] = 'error: ' . $e->getMessage();
                    $errorCount++;
                }
            }
            
            return $this->jsonSuccess([
                'results' => $results,
                'summary' => [
                    'total' => count($reviewIds),
                    'success' => $successCount,
                    'errors' => $errorCount
                ],
                'message' => "Bulk moderation completed: {$successCount} success, {$errorCount} errors"
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::bulkModerrateReviews] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to bulk moderate reviews: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Review Queries =====
    
    private function getUserReviews($user) {
        try {
            $targetUserId = intval($_GET['user_id'] ?? $user['user_id']);
            $asReviewee = filter_var($_GET['as_reviewee'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(5, intval($_GET['limit'] ?? 10)));
            
            $reviews = Review::getUserReviews($targetUserId, $asReviewee, $page, $limit);
            
            // Process reviews for display
            foreach ($reviews as &$review) {
                $review = $this->processReviewForDisplay($review);
            }
            
            return $this->jsonSuccess([
                'reviews' => $reviews,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getUserReviews] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get user reviews', 500);
        }
    }
    
    private function getProjectReviews($user) {
        try {
            $projectId = intval($_GET['project_id'] ?? 0);
            
            if (!$projectId) {
                return $this->jsonError('Project ID is required', 400);
            }
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(5, intval($_GET['limit'] ?? 10)));
            
            $reviews = Review::getProjectReviews($projectId, $page, $limit);
            
            // Process reviews for display
            foreach ($reviews as &$review) {
                $review = $this->processReviewForDisplay($review);
            }
            
            return $this->jsonSuccess([
                'reviews' => $reviews,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getProjectReviews] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get project reviews', 500);
        }
    }
    
    private function getReviewDetails($user) {
        try {
            $reviewId = intval($_GET['review_id'] ?? 0);
            
            if (!$reviewId) {
                return $this->jsonError('Review ID is required', 400);
            }
            
            $review = Review::getReviewWithDetails($reviewId);
            
            if (!$review) {
                return $this->jsonError('Review not found', 404);
            }
            
            $review = $this->processReviewForDisplay($review);
            
            return $this->jsonSuccess(['review' => $review]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getReviewDetails] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get review details', 500);
        }
    }
    
    // ===== Reputation Management =====
    
    private function getUserReputation($user) {
        try {
            $targetUserId = intval($_GET['user_id'] ?? $user['user_id']);
            
            $reputation = Review::getUserReputation($targetUserId);
            
            if (!$reputation) {
                return $this->jsonError('Reputation data not found', 404);
            }
            
            // Add formatted values
            $reputation['formatted_average_rating'] = number_format($reputation['average_rating'], 1);
            $reputation['formatted_reputation_score'] = number_format($reputation['reputation_score'], 1);
            $reputation['formatted_recommendation_rate'] = number_format($reputation['recommendation_rate'], 0) . '%';
            
            // Calculate rating distribution percentages
            if ($reputation['total_reviews'] > 0) {
                $reputation['rating_distribution'] = [
                    5 => round(($reputation['rating_5_count'] / $reputation['total_reviews']) * 100, 1),
                    4 => round(($reputation['rating_4_count'] / $reputation['total_reviews']) * 100, 1),
                    3 => round(($reputation['rating_3_count'] / $reputation['total_reviews']) * 100, 1),
                    2 => round(($reputation['rating_2_count'] / $reputation['total_reviews']) * 100, 1),
                    1 => round(($reputation['rating_1_count'] / $reputation['total_reviews']) * 100, 1)
                ];
            } else {
                $reputation['rating_distribution'] = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            }
            
            return $this->jsonSuccess(['reputation' => $reputation]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getUserReputation] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get user reputation', 500);
        }
    }
    
    // ===== Templates & Configuration =====
    
    private function getReviewTemplates($user) {
        try {
            $userType = $user['user_type'];
            $scenario = $_GET['scenario'] ?? null;
            
            $templates = Review::getReviewTemplates($userType, $scenario);
            
            return $this->jsonSuccess(['templates' => $templates]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getReviewTemplates] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get review templates', 500);
        }
    }
    
    // ===== Admin Functions =====
    
    private function getModerationQueue($user) {
        try {
            // Only admins can access moderation queue
            if ($user['user_type'] !== 'admin') {
                return $this->jsonError('Unauthorized', 403);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(100, max(10, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $stmt = $pdo->prepare("
                SELECT * FROM review_moderation_queue
                ORDER BY fraud_score DESC, flag_count DESC, created_at ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            $queue = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->jsonSuccess([
                'queue' => $queue,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getModerationQueue] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get moderation queue', 500);
        }
    }
    
    private function getReviewStats($user) {
        try {
            $userId = $_GET['user_id'] ?? null;
            $projectId = $_GET['project_id'] ?? null;
            
            $stats = Review::getReviewStats($userId, $projectId);
            
            return $this->jsonSuccess(['stats' => $stats]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getReviewStats] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get review stats', 500);
        }
    }
    
    private function getTopRatedUsers() {
        try {
            $userType = $_GET['user_type'] ?? 'freelancer';
            $limit = min(50, max(5, intval($_GET['limit'] ?? 10)));
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT * FROM top_freelancers
                WHERE user_type = ?
                LIMIT ?
            ");
            $stmt->execute([$userType, $limit]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->jsonSuccess(['users' => $users]);
            
        } catch (Exception $e) {
            error_log('[ReviewController::getTopRatedUsers] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get top rated users', 500);
        }
    }
    
    // ===== Helper Methods =====
    
    private function processReviewForDisplay($review) {
        // Format dates
        $review['formatted_created_at'] = $this->formatDate($review['created_at']);
        if ($review['response_date']) {
            $review['formatted_response_date'] = $this->formatDate($review['response_date']);
        }
        
        // Calculate helpfulness ratio
        if ($review['total_votes'] > 0) {
            $review['helpfulness_ratio'] = round(($review['helpful_votes'] / $review['total_votes']) * 100, 1);
        } else {
            $review['helpfulness_ratio'] = 0;
        }
        
        // Format ratings
        $review['formatted_overall_rating'] = number_format($review['overall_rating'], 1);
        
        // Build reviewer name
        $review['reviewer_name'] = trim($review['reviewer_first_name'] . ' ' . $review['reviewer_last_name']);
        $review['reviewee_name'] = trim($review['reviewee_first_name'] . ' ' . $review['reviewee_last_name']);
        
        // Add avatar URLs if available
        if ($review['reviewer_avatar']) {
            $review['reviewer_avatar_url'] = '/uploads/avatars/' . $review['reviewer_avatar'];
        }
        if ($review['reviewee_avatar']) {
            $review['reviewee_avatar_url'] = '/uploads/avatars/' . $review['reviewee_avatar'];
        }
        
        return $review;
    }
    
    private function formatDate($dateString) {
        $date = new DateTime($dateString);
        $now = new DateTime();
        $diff = $now->diff($date);
        
        if ($diff->days == 0) {
            return 'Hoy';
        } elseif ($diff->days == 1) {
            return 'Ayer';
        } elseif ($diff->days < 7) {
            return 'Hace ' . $diff->days . ' días';
        } else {
            return $date->format('d/m/Y');
        }
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
$controller = new ReviewController();
$controller->handleRequest();
?>