<?php
/**
 * Review Model
 * LaburAR Complete Platform - Phase 5
 * 
 * Manages review system, reputation calculation,
 * anti-fraud detection, and moderation workflows
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/BaseModel.php';

class Review extends BaseModel {
    protected static $table = 'reviews';
    
    protected static $fillable = [
        'project_id', 'reviewer_id', 'reviewee_id', 'reviewer_type',
        'overall_rating', 'communication_rating', 'quality_rating', 
        'timeliness_rating', 'professionalism_rating', 'value_rating',
        'title', 'comment', 'would_recommend', 'would_work_again',
        'ip_address', 'user_agent'
    ];
    
    // ===== Review Creation & Management =====
    
    public static function createReview($data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Validate required fields
            $required = ['project_id', 'reviewer_id', 'reviewee_id', 'reviewer_type', 'overall_rating'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field {$field} is required");
                }
            }
            
            // Validate ratings
            if ($data['overall_rating'] < 1.0 || $data['overall_rating'] > 5.0) {
                throw new Exception('Overall rating must be between 1.0 and 5.0');
            }
            
            // Validate reviewer can review this project
            if (!static::canUserReviewProject($data['reviewer_id'], $data['project_id'])) {
                throw new Exception('User is not authorized to review this project');
            }
            
            // Check for existing review
            if (static::hasUserReviewedProject($data['reviewer_id'], $data['project_id'])) {
                throw new Exception('User has already reviewed this project');
            }
            
            $pdo->beginTransaction();
            
            // Set default values
            $data['fraud_score'] = 0.00;
            $data['moderation_status'] = 'pending';
            $data['helpful_votes'] = 0;
            $data['total_votes'] = 0;
            
            // Create the review
            $review = static::create($data);
            
            // Run fraud detection
            static::detectFraud($review['id']);
            
            // Auto-approve if fraud score is low and user has good history
            if (static::shouldAutoApprove($data['reviewer_id'], $review['id'])) {
                static::approveReview($review['id'], null, 'Auto-approved');
            }
            
            $pdo->commit();
            
            return static::getReviewWithDetails($review['id']);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Review::createReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function updateReview($reviewId, $data, $userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $review = static::find($reviewId);
            if (!$review) {
                throw new Exception('Review not found');
            }
            
            // Check permissions
            if ($review['reviewer_id'] != $userId) {
                throw new Exception('Unauthorized to edit this review');
            }
            
            // Check if review can be edited (within time limit)
            $timeSinceCreation = time() - strtotime($review['created_at']);
            if ($timeSinceCreation > 86400) { // 24 hours
                throw new Exception('Review can no longer be edited');
            }
            
            $pdo->beginTransaction();
            
            // Filter editable fields
            $editableFields = ['overall_rating', 'communication_rating', 'quality_rating', 
                             'timeliness_rating', 'professionalism_rating', 'value_rating',
                             'title', 'comment', 'would_recommend', 'would_work_again'];
            
            $updateData = [];
            foreach ($editableFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            // Reset moderation status if significant changes
            if (isset($updateData['overall_rating']) || isset($updateData['comment'])) {
                $updateData['moderation_status'] = 'pending';
            }
            
            static::update($reviewId, $updateData);
            
            // Re-run fraud detection
            static::detectFraud($reviewId);
            
            $pdo->commit();
            
            return static::getReviewWithDetails($reviewId);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Review::updateReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Review Moderation =====
    
    public static function approveReview($reviewId, $moderatorId = null, $reason = '') {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $pdo->beginTransaction();
            
            $updateData = [
                'moderation_status' => 'approved',
                'moderated_by' => $moderatorId,
                'moderated_at' => date('Y-m-d H:i:s'),
                'moderation_reason' => $reason
            ];
            
            static::update($reviewId, $updateData);
            
            // Trigger reputation calculation (handled by database trigger)
            
            $pdo->commit();
            
            return true;
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Review::approveReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function rejectReview($reviewId, $moderatorId, $reason) {
        try {
            $updateData = [
                'moderation_status' => 'rejected',
                'moderated_by' => $moderatorId,
                'moderated_at' => date('Y-m-d H:i:s'),
                'moderation_reason' => $reason
            ];
            
            static::update($reviewId, $updateData);
            
            return true;
            
        } catch (Exception $e) {
            error_log('[Review::rejectReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function flagReview($reviewId, $flaggerId, $reason, $description = '') {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if already flagged by this user
            $stmt = $pdo->prepare("SELECT id FROM review_flags WHERE review_id = ? AND flagger_id = ?");
            $stmt->execute([$reviewId, $flaggerId]);
            if ($stmt->fetch()) {
                throw new Exception('You have already flagged this review');
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO review_flags (review_id, flagger_id, flag_reason, flag_description)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$reviewId, $flaggerId, $reason, $description]);
            
            // Update review status to flagged if multiple flags
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM review_flags WHERE review_id = ?");
            $stmt->execute([$reviewId]);
            $flagCount = $stmt->fetchColumn();
            
            if ($flagCount >= 3) {
                static::update($reviewId, ['moderation_status' => 'flagged']);
            }
            
            return $pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log('[Review::flagReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Anti-Fraud Detection =====
    
    public static function detectFraud($reviewId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Call stored procedure for fraud detection
            $stmt = $pdo->prepare("CALL detect_review_fraud(?)");
            $stmt->execute([$reviewId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log('[Review::detectFraud] Error: ' . $e->getMessage());
            return false;
        }
    }
    
    private static function shouldAutoApprove($reviewerId, $reviewId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get reviewer history
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_reviews,
                       AVG(fraud_score) as avg_fraud_score,
                       COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved_count
                FROM reviews 
                WHERE reviewer_id = ? AND id != ?
            ");
            $stmt->execute([$reviewerId, $reviewId]);
            $history = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get current review fraud score
            $stmt = $pdo->prepare("SELECT fraud_score FROM reviews WHERE id = ?");
            $stmt->execute([$reviewId]);
            $currentFraudScore = $stmt->fetchColumn();
            
            // Auto-approve criteria
            $hasGoodHistory = $history['total_reviews'] >= 3 && 
                            $history['approved_count'] / $history['total_reviews'] >= 0.8;
            $lowFraudScore = $currentFraudScore < 0.30;
            $lowAvgFraud = $history['avg_fraud_score'] < 0.25;
            
            return $hasGoodHistory && $lowFraudScore && $lowAvgFraud;
            
        } catch (Exception $e) {
            error_log('[Review::shouldAutoApprove] Error: ' . $e->getMessage());
            return false;
        }
    }
    
    // ===== Review Voting =====
    
    public static function voteOnReview($reviewId, $voterId, $voteType) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if user already voted
            $stmt = $pdo->prepare("SELECT id FROM review_votes WHERE review_id = ? AND voter_id = ?");
            $stmt->execute([$reviewId, $voterId]);
            $existingVote = $stmt->fetch();
            
            if ($existingVote) {
                // Update existing vote
                $stmt = $pdo->prepare("UPDATE review_votes SET vote_type = ? WHERE id = ?");
                $stmt->execute([$voteType, $existingVote['id']]);
            } else {
                // Create new vote
                $stmt = $pdo->prepare("
                    INSERT INTO review_votes (review_id, voter_id, vote_type, ip_address)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$reviewId, $voterId, $voteType, $_SERVER['REMOTE_ADDR'] ?? null]);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log('[Review::voteOnReview] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function removeVote($reviewId, $voterId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("DELETE FROM review_votes WHERE review_id = ? AND voter_id = ?");
            $stmt->execute([$reviewId, $voterId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log('[Review::removeVote] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Review Responses =====
    
    public static function addResponse($reviewId, $responderId, $responseText) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Verify responder is the reviewee
            $stmt = $pdo->prepare("SELECT reviewee_id FROM reviews WHERE id = ?");
            $stmt->execute([$reviewId]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$review || $review['reviewee_id'] != $responderId) {
                throw new Exception('Unauthorized to respond to this review');
            }
            
            // Check if response already exists
            $stmt = $pdo->prepare("SELECT id FROM review_responses WHERE review_id = ?");
            $stmt->execute([$reviewId]);
            if ($stmt->fetch()) {
                throw new Exception('Response already exists for this review');
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO review_responses (review_id, responder_id, response_text)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$reviewId, $responderId, $responseText]);
            
            return $pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log('[Review::addResponse] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Review Queries =====
    
    public static function getReviewWithDetails($reviewId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT r.*,
                       reviewer.first_name as reviewer_first_name,
                       reviewer.last_name as reviewer_last_name,
                       reviewer.profile_picture as reviewer_avatar,
                       reviewee.first_name as reviewee_first_name,
                       reviewee.last_name as reviewee_last_name,
                       reviewee.profile_picture as reviewee_avatar,
                       p.title as project_title,
                       rr.response_text as response,
                       rr.created_at as response_date,
                       COUNT(rv.id) as total_votes,
                       SUM(CASE WHEN rv.vote_type = 'helpful' THEN 1 ELSE 0 END) as helpful_votes
                FROM reviews r
                LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
                LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
                LEFT JOIN projects p ON r.project_id = p.id
                LEFT JOIN review_responses rr ON r.id = rr.review_id
                LEFT JOIN review_votes rv ON r.id = rv.review_id
                WHERE r.id = ?
                GROUP BY r.id
            ");
            $stmt->execute([$reviewId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Review::getReviewWithDetails] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function getUserReviews($userId, $asReviewee = true, $page = 1, $limit = 10) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $offset = ($page - 1) * $limit;
            $column = $asReviewee ? 'reviewee_id' : 'reviewer_id';
            
            $stmt = $pdo->prepare("
                SELECT r.*,
                       reviewer.first_name as reviewer_first_name,
                       reviewer.last_name as reviewer_last_name,
                       reviewer.profile_picture as reviewer_avatar,
                       reviewee.first_name as reviewee_first_name,
                       reviewee.last_name as reviewee_last_name,
                       p.title as project_title,
                       rr.response_text as response,
                       rr.created_at as response_date
                FROM reviews r
                LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
                LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
                LEFT JOIN projects p ON r.project_id = p.id
                LEFT JOIN review_responses rr ON r.id = rr.review_id
                WHERE r.{$column} = ? AND r.moderation_status = 'approved'
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, $limit, $offset]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Review::getUserReviews] Error: ' . $e->getMessage());
            return [];
        }
    }
    
    public static function getProjectReviews($projectId, $page = 1, $limit = 10) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $offset = ($page - 1) * $limit;
            
            $stmt = $pdo->prepare("
                SELECT r.*,
                       reviewer.first_name as reviewer_first_name,
                       reviewer.last_name as reviewer_last_name,
                       reviewer.profile_picture as reviewer_avatar,
                       reviewee.first_name as reviewee_first_name,
                       reviewee.last_name as reviewee_last_name,
                       rr.response_text as response,
                       rr.created_at as response_date
                FROM reviews r
                LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
                LEFT JOIN users reviewee ON r.reviewee_id = reviewee.id
                LEFT JOIN review_responses rr ON r.id = rr.review_id
                WHERE r.project_id = ? AND r.moderation_status = 'approved'
                ORDER BY r.helpful_votes DESC, r.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$projectId, $limit, $offset]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Review::getProjectReviews] Error: ' . $e->getMessage());
            return [];
        }
    }
    
    // ===== Reputation Management =====
    
    public static function getUserReputation($userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT * FROM user_reputation WHERE user_id = ?");
            $stmt->execute([$userId]);
            $reputation = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$reputation) {
                // Create reputation record if doesn't exist
                $userType = static::getUserType($userId);
                $stmt = $pdo->prepare("
                    INSERT INTO user_reputation (user_id, user_type) VALUES (?, ?)
                ");
                $stmt->execute([$userId, $userType]);
                
                return static::getUserReputation($userId);
            }
            
            return $reputation;
            
        } catch (Exception $e) {
            error_log('[Review::getUserReputation] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public static function calculateReputation($userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Call stored procedure
            $stmt = $pdo->prepare("CALL calculate_user_reputation(?)");
            $stmt->execute([$userId]);
            
            return true;
            
        } catch (Exception $e) {
            error_log('[Review::calculateReputation] Error: ' . $e->getMessage());
            return false;
        }
    }
    
    // ===== Review Templates =====
    
    public static function getReviewTemplates($userType, $scenario = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $sql = "SELECT * FROM review_templates WHERE user_type = ? AND is_active = TRUE";
            $params = [$userType];
            
            if ($scenario) {
                $sql .= " AND scenario = ?";
                $params[] = $scenario;
            }
            
            $sql .= " ORDER BY usage_count DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Review::getReviewTemplates] Error: ' . $e->getMessage());
            return [];
        }
    }
    
    // ===== Validation Methods =====
    
    private static function canUserReviewProject($userId, $projectId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if user is involved in the project and project is completed
            $stmt = $pdo->prepare("
                SELECT p.status, p.client_id, p.freelancer_id
                FROM projects p
                WHERE p.id = ? AND p.status = 'completed'
                AND (p.client_id = ? OR p.freelancer_id = ?)
            ");
            $stmt->execute([$projectId, $userId, $userId]);
            
            return $stmt->fetch() !== false;
            
        } catch (Exception $e) {
            error_log('[Review::canUserReviewProject] Error: ' . $e->getMessage());
            return false;
        }
    }
    
    private static function hasUserReviewedProject($userId, $projectId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT id FROM reviews WHERE reviewer_id = ? AND project_id = ?");
            $stmt->execute([$userId, $projectId]);
            
            return $stmt->fetch() !== false;
            
        } catch (Exception $e) {
            error_log('[Review::hasUserReviewedProject] Error: ' . $e->getMessage());
            return true; // Err on the side of caution
        }
    }
    
    private static function getUserType($userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() ?: 'client';
            
        } catch (Exception $e) {
            return 'client';
        }
    }
    
    // ===== Statistics =====
    
    public static function getReviewStats($userId = null, $projectId = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = ["r.moderation_status = 'approved'"];
            $params = [];
            
            if ($userId) {
                $conditions[] = "r.reviewee_id = ?";
                $params[] = $userId;
            }
            
            if ($projectId) {
                $conditions[] = "r.project_id = ?";
                $params[] = $projectId;
            }
            
            $whereClause = implode(' AND ', $conditions);
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(overall_rating) as average_rating,
                    AVG(communication_rating) as avg_communication,
                    AVG(quality_rating) as avg_quality,
                    AVG(timeliness_rating) as avg_timeliness,
                    AVG(professionalism_rating) as avg_professionalism,
                    COUNT(CASE WHEN overall_rating >= 4.5 THEN 1 END) as rating_5_count,
                    COUNT(CASE WHEN overall_rating >= 3.5 AND overall_rating < 4.5 THEN 1 END) as rating_4_count,
                    COUNT(CASE WHEN overall_rating >= 2.5 AND overall_rating < 3.5 THEN 1 END) as rating_3_count,
                    COUNT(CASE WHEN overall_rating >= 1.5 AND overall_rating < 2.5 THEN 1 END) as rating_2_count,
                    COUNT(CASE WHEN overall_rating < 1.5 THEN 1 END) as rating_1_count,
                    COUNT(CASE WHEN would_recommend = TRUE THEN 1 END) as positive_recommendations,
                    COUNT(CASE WHEN would_recommend IS NOT NULL THEN 1 END) as total_recommendations
                FROM reviews r
                WHERE {$whereClause}
            ");
            
            $stmt->execute($params);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Review::getReviewStats] Error: ' . $e->getMessage());
            return null;
        }
    }
}
?>